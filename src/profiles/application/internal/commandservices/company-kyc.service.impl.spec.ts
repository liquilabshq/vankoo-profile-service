/* eslint-disable @typescript-eslint/unbound-method -- expect(mock.method) on jest mocks */
import { CompanyCommandServiceImpl } from './company-command.service.impl';
import { Company } from '../../../domain/model/aggregates/company.aggregate';
import { CompanyId } from '../../../domain/model/valueobjects/company-id.vo';
import { UserId } from '../../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../../domain/model/valueobjects/email.vo';
import { KycStatus } from '../../../domain/model/valueobjects/kyc-status.enum';
import { ICompanyRepository } from '../../../domain/repositories/company.repository';
import {
  IFileStorageService,
  objectKeyFromUrl,
} from '../../../domain/services/file-storage.service';
import { IEventPublisherService } from '../../../domain/services/event-publisher.service';
import { SubmitCompanyForVerificationCommand } from '../../../domain/model/commands/submit-company-for-verification.command';
import { RecordCompanyVerificationCommand } from '../../../domain/model/commands/record-company-verification.command';
import { RequestCompanyRucUploadUrlCommand } from '../../../domain/model/commands/request-company-ruc-upload-url.command';
import { UploadCompanyLogoCommand } from '../../../domain/model/commands/upload-company-logo.command';

const COMPANY_ID = '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10';
const USER_ID = '7a1e2b3a-1111-4222-8333-444455556666';
const BASE = 'http://localhost:9100/vankoo-profile-documents';
const KEY = `companies/${COMPANY_ID}/ruc/9c1e2b3a-1111-4222-8333-444455556666.pdf`;
const DATA = {
  rucNumber: '20601234567',
  businessName: 'Textiles Andinos S.A.C.',
  industrySector: 'MANUFACTURING',
  contactPhone: '+51 987654321',
  legalAddress: {
    street: 'Av. 1',
    city: 'Lima',
    state: 'Lima',
    postalCode: '15001',
    country: 'Perú',
  },
};

function setUp() {
  const company = new Company(
    new CompanyId(COMPANY_ID),
    new UserId(USER_ID),
    new Email('mype@vankoo.test'),
  );
  const repository: jest.Mocked<ICompanyRepository> = {
    findById: jest.fn().mockResolvedValue(company),
    findByUserId: jest.fn().mockResolvedValue(company),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const storage: jest.Mocked<IFileStorageService> = {
    generateUploadUrl: jest.fn().mockImplementation((key: string) =>
      Promise.resolve({
        uploadUrl: `${BASE}/${key}?X-Amz-Signature=x`,
        fileUrl: `${BASE}/${key}`,
        expiresInSeconds: 300,
      }),
    ),
    resolveObjectKey: jest.fn((url: string) => objectKeyFromUrl(BASE, url)),
  };
  const publisher: jest.Mocked<IEventPublisherService> = {
    publish: jest.fn().mockResolvedValue(undefined),
  };
  const service = new CompanyCommandServiceImpl(repository, storage, publisher);
  return { service, company, repository, storage, publisher };
}

function published(publisher: jest.Mocked<IEventPublisherService>) {
  return publisher.publish.mock.calls.map(([topic, payload, key]) => ({
    topic,
    key,
    ...payload,
  }));
}

describe('CompanyCommandServiceImpl KYC', () => {
  it('sends the profile for verification and tells risk and invoicing', async () => {
    const { service, repository, publisher } = setUp();

    const company = await service.handleSubmitForVerification(
      new SubmitCompanyForVerificationCommand(
        COMPANY_ID,
        DATA,
        `${BASE}/${KEY}`,
      ),
    );

    expect(company.getKycStatus()).toBe(KycStatus.IN_REVIEW);
    expect(repository.save).toHaveBeenCalledWith(company);
    const [requested, changed] = published(publisher);
    expect(requested).toEqual(
      expect.objectContaining({
        topic: 'vankoo.profile.events',
        key: COMPANY_ID,
        eventType: 'CompanyVerificationRequested',
        schemaVersion: 1,
        requestId: company.getKycReview().requestId,
        companyId: COMPANY_ID,
        userId: USER_ID,
        rucNumber: '20601234567',
        businessName: 'Textiles Andinos S.A.C.',
        rucDocumentKey: KEY,
      }),
    );
    expect(changed).toEqual(
      expect.objectContaining({
        eventType: 'CompanyKycStatusChanged',
        schemaVersion: 1,
        userId: USER_ID,
        kycStatus: 'IN_REVIEW',
      }),
    );
  });

  it('refuses a ficha that is not in its own storage', async () => {
    const { service, publisher } = setUp();

    await expect(
      service.handleSubmitForVerification(
        new SubmitCompanyForVerificationCommand(
          COMPANY_ID,
          DATA,
          `https://evil.example/${KEY}`,
        ),
      ),
    ).rejects.toThrow('no pertenece al almacenamiento');
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('applies the decision and announces the new status', async () => {
    const { service, publisher } = setUp();
    const company = await service.handleSubmitForVerification(
      new SubmitCompanyForVerificationCommand(
        COMPANY_ID,
        DATA,
        `${BASE}/${KEY}`,
      ),
    );
    publisher.publish.mockClear();

    const decided = await service.handleRecordVerification(
      new RecordCompanyVerificationCommand(COMPANY_ID, {
        requestId: company.getKycReview().requestId as string,
        verificationId: 'kyc-1',
        decision: 'VERIFIED',
        checks: [],
        reasonCodes: [],
        fieldErrors: [],
        evidence: [],
        demo: true,
        decidedAt: new Date(),
      }),
    );

    expect(decided?.getKycStatus()).toBe(KycStatus.VERIFIED);
    expect(published(publisher)).toEqual([
      expect.objectContaining({
        eventType: 'CompanyKycStatusChanged',
        kycStatus: 'VERIFIED',
      }),
    ]);
  });

  it('ignores a decision about another request without announcing anything', async () => {
    const { service, repository, publisher } = setUp();
    await service.handleSubmitForVerification(
      new SubmitCompanyForVerificationCommand(
        COMPANY_ID,
        DATA,
        `${BASE}/${KEY}`,
      ),
    );
    repository.save.mockClear();
    publisher.publish.mockClear();

    const decided = await service.handleRecordVerification(
      new RecordCompanyVerificationCommand(COMPANY_ID, {
        requestId: 'an-old-request',
        verificationId: 'kyc-0',
        decision: 'VERIFIED',
        checks: [],
        reasonCodes: [],
        fieldErrors: [],
        evidence: [],
        demo: false,
        decidedAt: new Date(),
      }),
    );

    expect(decided).toBeNull();
    expect(repository.save).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('signs ficha uploads only for PDF', async () => {
    const { service, storage } = setUp();

    await expect(
      service.handleRequestRucUploadUrl(
        new RequestCompanyRucUploadUrlCommand(COMPANY_ID, 'image/png'),
      ),
    ).rejects.toThrow('PDF');
    await service.handleRequestRucUploadUrl(
      new RequestCompanyRucUploadUrlCommand(COMPANY_ID, 'application/pdf'),
    );
    expect(storage.generateUploadUrl.mock.calls[0][0]).toMatch(
      new RegExp(`^companies/${COMPANY_ID}/ruc/[0-9a-f-]{36}\\.pdf$`),
    );
  });

  it('accepts a logo only from the company logo folder', async () => {
    const { service } = setUp();
    const logo = `${BASE}/companies/${COMPANY_ID}/logo/9c1e2b3a-1111-4222-8333-444455556666.png`;

    await expect(
      service.handleUploadLogo(
        new UploadCompanyLogoCommand(COMPANY_ID, `${BASE}/${KEY}`),
      ),
    ).rejects.toThrow('carpeta de la empresa');
    const company = await service.handleUploadLogo(
      new UploadCompanyLogoCommand(COMPANY_ID, logo),
    );
    expect(company.getLogoUrl()?.url).toBe(logo);
  });
});
