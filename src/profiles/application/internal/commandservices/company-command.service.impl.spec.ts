import { NotFoundException } from '@nestjs/common';
import { CompanyCommandServiceImpl } from './company-command.service.impl';
import { Company } from '../../../domain/model/aggregates/company.aggregate';
import { CompanyId } from '../../../domain/model/valueobjects/company-id.vo';
import { UserId } from '../../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../../domain/model/valueobjects/email.vo';
import { KycStatus } from '../../../domain/model/valueobjects/kyc-status.enum';
import { CreateCompanyCommand } from '../../../domain/model/commands/create-company.command';
import { CompleteCompanyProfileCommand } from '../../../domain/model/commands/complete-company-profile.command';
import { VerifyCompanyKycCommand } from '../../../domain/model/commands/verify-company-kyc.command';
import { RejectCompanyKycCommand } from '../../../domain/model/commands/reject-company-kyc.command';
import { UploadCompanyRucCommand } from '../../../domain/model/commands/upload-company-ruc.command';
import { RequestCompanyRucUploadUrlCommand } from '../../../domain/model/commands/request-company-ruc-upload-url.command';
import type { ICompanyRepository } from '../../../domain/repositories/company.repository';
import type { IFileStorageService } from '../../../domain/services/file-storage.service';
import type { IEventPublisherService } from '../../../domain/services/event-publisher.service';

/**
 * Plain unit test, no Nest module: the service is built by hand and the
 * repository, file storage and event publisher are jest mocks.
 */
describe('CompanyCommandServiceImpl', () => {
  let findById: jest.MockedFunction<ICompanyRepository['findById']>;
  let save: jest.MockedFunction<ICompanyRepository['save']>;
  let generateUploadUrl: jest.MockedFunction<
    IFileStorageService['generateUploadUrl']
  >;
  let publish: jest.MockedFunction<IEventPublisherService['publish']>;
  let service: CompanyCommandServiceImpl;
  let company: Company;

  beforeEach(() => {
    findById = jest.fn();
    save = jest.fn();
    generateUploadUrl = jest.fn();
    publish = jest.fn();
    service = new CompanyCommandServiceImpl(
      { findById, save },
      { generateUploadUrl },
      { publish },
    );
    company = new Company(
      new CompanyId('company-1'),
      new UserId('user-123'),
      new Email('carlos@vankoo.pe'),
    );
  });

  it('creates an empty company profile for a user signed up in IAM', async () => {
    const created = await service.handleCreateCompany(
      new CreateCompanyCommand('user-123', 'carlos@vankoo.pe'),
    );

    expect(created.userId.value).toBe('user-123');
    expect(created.contactEmail.address).toBe('carlos@vankoo.pe');
    expect(created.getKycStatus()).toBe(KycStatus.PENDING);
    expect(save).toHaveBeenCalledWith(created);
  });

  it('completes the profile and publishes ProfileCompleted', async () => {
    findById.mockResolvedValue(company);

    await service.handleCompleteProfile(
      new CompleteCompanyProfileCommand(
        'company-1',
        '20573093420',
        'Alvacor',
        'CONSTRUCTION',
        '987654321',
        {
          street: 'Av. Arequipa 123',
          city: 'Lima',
          state: 'Lima',
          postalCode: '15046',
          country: 'PE',
        },
      ),
    );

    expect(company.rucNumber?.value).toBe('20573093420');
    expect(save).toHaveBeenCalledWith(company);
    expect(publish).toHaveBeenCalledWith(
      'vankoo.profile.events',
      expect.objectContaining({
        eventType: 'ProfileCompleted',
        companyId: 'company-1',
        userId: 'user-123',
      }),
    );
  });

  it('verifies the KYC and publishes KycVerified', async () => {
    findById.mockResolvedValue(company);

    await service.handleVerifyKyc(new VerifyCompanyKycCommand('company-1'));

    expect(company.getKycStatus()).toBe(KycStatus.VERIFIED);
    expect(publish).toHaveBeenCalledWith(
      'vankoo.profile.events',
      expect.objectContaining({
        eventType: 'KycVerified',
        kycStatus: KycStatus.VERIFIED,
      }),
    );
  });

  it('rejects the KYC and publishes KycRejected with the reason', async () => {
    findById.mockResolvedValue(company);

    await service.handleRejectKyc(
      new RejectCompanyKycCommand('company-1', 'RUC ilegible'),
    );

    expect(company.getKycStatus()).toBe(KycStatus.REJECTED);
    expect(publish).toHaveBeenCalledWith(
      'vankoo.profile.events',
      expect.objectContaining({
        eventType: 'KycRejected',
        reason: 'RUC ilegible',
      }),
    );
  });

  it('stores the uploaded RUC document url', async () => {
    findById.mockResolvedValue(company);

    await service.handleUploadRuc(
      new UploadCompanyRucCommand(
        'company-1',
        'https://files.vankoo.pe/ruc.pdf',
      ),
    );

    expect(company.getRucDocumentUrl()?.url).toBe(
      'https://files.vankoo.pe/ruc.pdf',
    );
    expect(save).toHaveBeenCalledWith(company);
  });

  it('asks the storage for an upload url under the company RUC folder', async () => {
    findById.mockResolvedValue(company);
    generateUploadUrl.mockResolvedValue({
      uploadUrl: 'https://signed',
      fileUrl: 'https://file',
      expiresInSeconds: 300,
    });

    const result = await service.handleRequestRucUploadUrl(
      new RequestCompanyRucUploadUrlCommand('company-1', 'application/pdf'),
    );

    expect(result.uploadUrl).toBe('https://signed');
    expect(generateUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^companies\/company-1\/ruc\/[0-9a-f-]{36}\.pdf$/),
    );
  });

  it('refuses an unsupported file type before touching the storage', async () => {
    findById.mockResolvedValue(company);

    await expect(
      service.handleRequestRucUploadUrl(
        new RequestCompanyRucUploadUrlCommand('company-1', 'image/gif'),
      ),
    ).rejects.toThrow('Tipo de contenido no soportado');
    expect(generateUploadUrl).not.toHaveBeenCalled();
  });

  it('fails with NotFound for an unknown company and publishes nothing', async () => {
    findById.mockResolvedValue(null);

    await expect(
      service.handleVerifyKyc(new VerifyCompanyKycCommand('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(save).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });
});
