import { NotFoundException } from '@nestjs/common';
import { CompanyCommandServiceImpl } from './company-command.service.impl';
import { Company } from '../../../domain/model/aggregates/company.aggregate';
import { CompanyId } from '../../../domain/model/valueobjects/company-id.vo';
import { UserId } from '../../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../../domain/model/valueobjects/email.vo';
import { KycStatus } from '../../../domain/model/valueobjects/kyc-status.enum';
import type { ICompanyRepository } from '../../../domain/repositories/company.repository';
import type { IFileStorageService } from '../../../domain/services/file-storage.service';
import type { IEventPublisherService } from '../../../domain/services/event-publisher.service';
import { CompleteCompanyProfileCommand } from '../../../domain/model/commands/complete-company-profile.command';
import { CreateCompanyCommand } from '../../../domain/model/commands/create-company.command';
import { UploadCompanyRucCommand } from '../../../domain/model/commands/upload-company-ruc.command';
import { UploadCompanyLogoCommand } from '../../../domain/model/commands/upload-company-logo.command';
import { VerifyCompanyKycCommand } from '../../../domain/model/commands/verify-company-kyc.command';
import { RejectCompanyKycCommand } from '../../../domain/model/commands/reject-company-kyc.command';
import { RequestCompanyRucUploadUrlCommand } from '../../../domain/model/commands/request-company-ruc-upload-url.command';
import { RequestCompanyLogoUploadUrlCommand } from '../../../domain/model/commands/request-company-logo-upload-url.command';

describe('CompanyCommandServiceImpl', () => {
  let companyRepository: jest.Mocked<ICompanyRepository>;
  let fileStorageService: jest.Mocked<IFileStorageService>;
  let eventPublisherService: jest.Mocked<IEventPublisherService>;
  let service: CompanyCommandServiceImpl;
  const companyId = 'company-1';

  function buildCompany(kycStatus?: KycStatus): Company {
    return new Company(
      new CompanyId(companyId),
      new UserId('user-1'),
      new Email('contact@vankoo.com'),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      kycStatus,
    );
  }

  beforeEach(() => {
    companyRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    fileStorageService = {
      generateUploadUrl: jest.fn(),
    };
    eventPublisherService = {
      publish: jest.fn(),
    };
    service = new CompanyCommandServiceImpl(
      companyRepository,
      fileStorageService,
      eventPublisherService,
    );
  });

  describe('handleCreateCompany', () => {
    it('creates a new Company shell and persists it', async () => {
      // Arrange
      const command = new CreateCompanyCommand('user-1', 'contact@vankoo.com');

      // Act
      const result = await service.handleCreateCompany(command);

      // Assert
      expect(result).toBeInstanceOf(Company);
      expect(result.userId.value).toBe('user-1');
      expect(result.contactEmail.address).toBe('contact@vankoo.com');
      expect(companyRepository.save).toHaveBeenCalledWith(result);
    });
  });

  describe('handleCompleteProfile', () => {
    const command = new CompleteCompanyProfileCommand(
      companyId,
      '20123456789',
      'Vankoo SAC',
      'TECHNOLOGY',
      '+51987654321',
      {
        street: 'Av. Siempre Viva 742',
        city: 'Lima',
        state: 'Lima',
        postalCode: '15001',
        country: 'PE',
      },
    );

    it('throws NotFoundException when the company does not exist', async () => {
      // Arrange
      companyRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.handleCompleteProfile(command)).rejects.toThrow(
        NotFoundException,
      );
      expect(companyRepository.save).not.toHaveBeenCalled();
    });

    it('completes the profile, persists it and publishes a ProfileCompleted event', async () => {
      // Arrange
      const company = buildCompany();
      companyRepository.findById.mockResolvedValue(company);

      // Act
      const result = await service.handleCompleteProfile(command);

      // Assert
      expect(result.businessName?.value).toBe('Vankoo SAC');
      expect(companyRepository.save).toHaveBeenCalledWith(company);
      expect(eventPublisherService.publish).toHaveBeenCalledWith(
        'vankoo.profile.events',
        expect.objectContaining({
          eventType: 'ProfileCompleted',
          profileType: 'COMPANY',
          companyId,
        }),
      );
    });
  });

  describe('handleUploadRuc', () => {
    it('throws NotFoundException when the company does not exist', async () => {
      // Arrange
      companyRepository.findById.mockResolvedValue(null);
      const command = new UploadCompanyRucCommand(
        companyId,
        'https://storage.vankoo.com/ruc.pdf',
      );

      // Act & Assert
      await expect(service.handleUploadRuc(command)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('uploads the RUC document and persists the company', async () => {
      // Arrange
      const company = buildCompany();
      companyRepository.findById.mockResolvedValue(company);
      const command = new UploadCompanyRucCommand(
        companyId,
        'https://storage.vankoo.com/ruc.pdf',
      );

      // Act
      const result = await service.handleUploadRuc(command);

      // Assert
      expect(result.getRucDocumentUrl()?.url).toBe(
        'https://storage.vankoo.com/ruc.pdf',
      );
      expect(companyRepository.save).toHaveBeenCalledWith(company);
      expect(eventPublisherService.publish).not.toHaveBeenCalled();
    });
  });

  describe('handleUploadLogo', () => {
    it('updates the logo and persists the company', async () => {
      // Arrange
      const company = buildCompany();
      companyRepository.findById.mockResolvedValue(company);
      const command = new UploadCompanyLogoCommand(
        companyId,
        'https://storage.vankoo.com/logo.png',
      );

      // Act
      const result = await service.handleUploadLogo(command);

      // Assert
      expect(result.getLogoUrl()?.url).toBe(
        'https://storage.vankoo.com/logo.png',
      );
      expect(companyRepository.save).toHaveBeenCalledWith(company);
    });
  });

  describe('handleVerifyKyc', () => {
    it('throws NotFoundException when the company does not exist', async () => {
      // Arrange
      companyRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.handleVerifyKyc(new VerifyCompanyKycCommand(companyId)),
      ).rejects.toThrow(NotFoundException);
    });

    it('verifies the KYC, persists it and publishes a KycVerified event', async () => {
      // Arrange
      const company = buildCompany();
      companyRepository.findById.mockResolvedValue(company);

      // Act
      const result = await service.handleVerifyKyc(
        new VerifyCompanyKycCommand(companyId),
      );

      // Assert
      expect(result.getKycStatus()).toBe(KycStatus.VERIFIED);
      expect(companyRepository.save).toHaveBeenCalledWith(company);
      expect(eventPublisherService.publish).toHaveBeenCalledWith(
        'vankoo.profile.events',
        expect.objectContaining({ eventType: 'KycVerified', companyId }),
      );
    });

    it('propagates the domain invariant error when the KYC was already processed', async () => {
      // Arrange
      const company = buildCompany(KycStatus.VERIFIED);
      companyRepository.findById.mockResolvedValue(company);

      // Act & Assert
      await expect(
        service.handleVerifyKyc(new VerifyCompanyKycCommand(companyId)),
      ).rejects.toThrow(/El KYC de este perfil ya fue procesado/);
      expect(companyRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('handleRejectKyc', () => {
    it('rejects the KYC, persists it and publishes a KycRejected event', async () => {
      // Arrange
      const company = buildCompany();
      companyRepository.findById.mockResolvedValue(company);
      const command = new RejectCompanyKycCommand(
        companyId,
        'Documentación incompleta',
      );

      // Act
      const result = await service.handleRejectKyc(command);

      // Assert
      expect(result.getKycStatus()).toBe(KycStatus.REJECTED);
      expect(eventPublisherService.publish).toHaveBeenCalledWith(
        'vankoo.profile.events',
        expect.objectContaining({
          eventType: 'KycRejected',
          companyId,
          reason: 'Documentación incompleta',
        }),
      );
    });

    it('propagates the domain invariant error when the KYC was already processed', async () => {
      // Arrange
      const company = buildCompany(KycStatus.REJECTED);
      companyRepository.findById.mockResolvedValue(company);
      const command = new RejectCompanyKycCommand(companyId, 'Otro motivo');

      // Act & Assert
      await expect(service.handleRejectKyc(command)).rejects.toThrow(
        /El KYC de este perfil ya fue procesado/,
      );
    });
  });

  describe('handleRequestRucUploadUrl', () => {
    it('throws NotFoundException when the company does not exist', async () => {
      // Arrange
      companyRepository.findById.mockResolvedValue(null);
      const command = new RequestCompanyRucUploadUrlCommand(
        companyId,
        'application/pdf',
      );

      // Act & Assert
      await expect(
        service.handleRequestRucUploadUrl(command),
      ).rejects.toThrow(NotFoundException);
    });

    it('builds the companies/{id}/ruc/ object key and delegates to the storage service', async () => {
      // Arrange
      const company = buildCompany();
      companyRepository.findById.mockResolvedValue(company);
      fileStorageService.generateUploadUrl.mockResolvedValue({
        uploadUrl: 'https://minio/upload',
        fileUrl: 'https://minio/file',
        expiresInSeconds: 60,
      });
      const command = new RequestCompanyRucUploadUrlCommand(
        companyId,
        'application/pdf',
      );

      // Act
      const result = await service.handleRequestRucUploadUrl(command);

      // Assert
      expect(fileStorageService.generateUploadUrl).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^companies/${companyId}/ruc/.+\\.pdf$`)),
      );
      expect(result.uploadUrl).toBe('https://minio/upload');
    });
  });

  describe('handleRequestLogoUploadUrl', () => {
    it('builds the companies/{id}/logo/ object key and delegates to the storage service', async () => {
      // Arrange
      const company = buildCompany();
      companyRepository.findById.mockResolvedValue(company);
      fileStorageService.generateUploadUrl.mockResolvedValue({
        uploadUrl: 'https://minio/upload',
        fileUrl: 'https://minio/file',
        expiresInSeconds: 60,
      });
      const command = new RequestCompanyLogoUploadUrlCommand(
        companyId,
        'image/png',
      );

      // Act
      const result = await service.handleRequestLogoUploadUrl(command);

      // Assert
      expect(fileStorageService.generateUploadUrl).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^companies/${companyId}/logo/.+\\.png$`)),
      );
      expect(result.fileUrl).toBe('https://minio/file');
    });
  });
});
