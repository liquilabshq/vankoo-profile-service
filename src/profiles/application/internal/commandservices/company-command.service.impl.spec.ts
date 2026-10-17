/* eslint-disable @typescript-eslint/unbound-method -- expect(mock.method) on jest mocks */
import { CompanyCommandServiceImpl } from './company-command.service.impl';
import { Company } from '../../../domain/model/aggregates/company.aggregate';
import { CompanyId } from '../../../domain/model/valueobjects/company-id.vo';
import { UserId } from '../../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../../domain/model/valueobjects/email.vo';
import { ICompanyRepository } from '../../../domain/repositories/company.repository';
import {
  IFileStorageService,
  objectKeyFromUrl,
} from '../../../domain/services/file-storage.service';
import { IEventPublisherService } from '../../../domain/services/event-publisher.service';
import { SubmitSustainabilityCertificateCommand } from '../../../domain/model/commands/submit-sustainability-certificate.command';
import { RequestSustainabilityCertificateUploadUrlCommand } from '../../../domain/model/commands/request-sustainability-certificate-upload-url.command';
import { RecordSustainabilityDecisionCommand } from '../../../domain/model/commands/record-sustainability-decision.command';

const COMPANY_ID = '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10';
const USER_ID = '7a1e2b3a-1111-4222-8333-444455556666';
const BASE = 'http://localhost:9100/vankoo-profile-documents';
const KEY = `companies/${COMPANY_ID}/sustainability/9c1e2b3a-1111-4222-8333-444455556666.pdf`;

function completeCompany(): Company {
  const company = new Company(
    new CompanyId(COMPANY_ID),
    new UserId(USER_ID),
    new Email('mype@vankoo.test'),
  );
  company.completeProfile(
    '20601234567',
    'Agroexport Verde S.A.C.',
    'AGRICULTURE',
    '+51 987654321',
    {
      street: 'Av. 1',
      city: 'Lima',
      state: 'Lima',
      postalCode: '15001',
      country: 'Perú',
    },
  );
  return company;
}

function setUp(company: Company | null = completeCompany()) {
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
  return { service, repository, storage, publisher };
}

describe('CompanyCommandServiceImpl sustainability certificate', () => {
  it('signs an upload URL in the company sustainability folder', async () => {
    const { service, storage } = setUp();

    await service.handleRequestSustainabilityCertificateUploadUrl(
      new RequestSustainabilityCertificateUploadUrlCommand(
        COMPANY_ID,
        'application/pdf',
      ),
    );

    const [key] = storage.generateUploadUrl.mock.calls[0];
    expect(key).toMatch(
      new RegExp(
        `^companies/${COMPANY_ID}/sustainability/[0-9a-f-]{36}\\.pdf$`,
      ),
    );
  });

  it('puts the certificate under review and publishes the event risk reads', async () => {
    const { service, repository, publisher } = setUp();

    const company = await service.handleSubmitSustainabilityCertificate(
      new SubmitSustainabilityCertificateCommand(COMPANY_ID, `${BASE}/${KEY}`),
    );

    expect(company.sustainabilityCertification.status).toBe('UNDER_REVIEW');
    expect(repository.save).toHaveBeenCalledWith(company);
    const [topic, payload, key] = publisher.publish.mock.calls[0];
    expect(topic).toBe('vankoo.profile.events');
    expect(key).toBe(COMPANY_ID);
    expect(payload).toMatchObject({
      eventType: 'SustainabilityCertificateSubmitted',
      schemaVersion: 1,
      companyId: COMPANY_ID,
      userId: USER_ID,
      rucNumber: '20601234567',
      businessName: 'Agroexport Verde S.A.C.',
      objectKey: KEY,
      contentType: 'application/pdf',
      submissionId: company.sustainabilityCertification.submissionId,
    });
    expect(typeof payload.eventId).toBe('string');
    expect(typeof payload.occurredAt).toBe('string');
  });

  it.each([
    `http://evil.example/vankoo-profile-documents/${KEY}`,
    `${BASE}/../${KEY}`,
    `${BASE}/${KEY}?x=1`,
  ])('refuses a URL that is not of its own storage: %s', async (url) => {
    const { service, publisher } = setUp();

    await expect(
      service.handleSubmitSustainabilityCertificate(
        new SubmitSustainabilityCertificateCommand(COMPANY_ID, url),
      ),
    ).rejects.toThrow();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('saves a decision on the current upload and ignores a stale one', async () => {
    const { service, repository } = setUp();
    const company = await service.handleSubmitSustainabilityCertificate(
      new SubmitSustainabilityCertificateCommand(COMPANY_ID, `${BASE}/${KEY}`),
    );
    repository.save.mockClear();
    const decision = {
      submissionId: company.sustainabilityCertification.submissionId as string,
      certificationId: 'green-1',
      green: true,
      standard: 'ISO_14001',
      issuer: 'SGS',
      validUntil: '2028-03-31',
      criteria: [],
      reasonCodes: [],
      decidedAt: new Date(),
    };

    const stale = await service.handleRecordSustainabilityDecision(
      new RecordSustainabilityDecisionCommand(COMPANY_ID, {
        ...decision,
        submissionId: 'old',
      }),
    );
    expect(stale).toBeNull();
    expect(repository.save).not.toHaveBeenCalled();

    const saved = await service.handleRecordSustainabilityDecision(
      new RecordSustainabilityDecisionCommand(COMPANY_ID, decision),
    );
    expect(saved?.sustainabilityCertification.isGreen).toBe(true);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });
});
