import { NotFoundException } from '@nestjs/common';
import { InvestorCommandServiceImpl } from './investor-command.service.impl';
import { Investor } from '../../../domain/model/aggregates/investor.aggregate';
import { InvestorId } from '../../../domain/model/valueobjects/investor-id.vo';
import { UserId } from '../../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../../domain/model/valueobjects/email.vo';
import { KycStatus } from '../../../domain/model/valueobjects/kyc-status.enum';
import type { IInvestorRepository } from '../../../domain/repositories/investor.repository';
import type { IFileStorageService } from '../../../domain/services/file-storage.service';
import type { IEventPublisherService } from '../../../domain/services/event-publisher.service';
import { CompleteInvestorProfileCommand } from '../../../domain/model/commands/complete-investor-profile.command';
import { CreateInvestorCommand } from '../../../domain/model/commands/create-investor.command';
import { UploadInvestorDniCommand } from '../../../domain/model/commands/upload-investor-dni.command';
import { UploadInvestorPhotoCommand } from '../../../domain/model/commands/upload-investor-photo.command';
import { VerifyInvestorKycCommand } from '../../../domain/model/commands/verify-investor-kyc.command';
import { RejectInvestorKycCommand } from '../../../domain/model/commands/reject-investor-kyc.command';
import { RequestInvestorDniUploadUrlCommand } from '../../../domain/model/commands/request-investor-dni-upload-url.command';
import { RequestInvestorPhotoUploadUrlCommand } from '../../../domain/model/commands/request-investor-photo-upload-url.command';

describe('InvestorCommandServiceImpl', () => {
  let investorRepository: jest.Mocked<IInvestorRepository>;
  let fileStorageService: jest.Mocked<IFileStorageService>;
  let eventPublisherService: jest.Mocked<IEventPublisherService>;
  let service: InvestorCommandServiceImpl;
  const investorId = 'investor-1';

  function buildInvestor(kycStatus?: KycStatus): Investor {
    return new Investor(
      new InvestorId(investorId),
      new UserId('user-1'),
      new Email('investor@vankoo.com'),
      undefined,
      undefined,
      undefined,
      undefined,
      kycStatus,
    );
  }

  beforeEach(() => {
    investorRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    fileStorageService = {
      generateUploadUrl: jest.fn(),
    };
    eventPublisherService = {
      publish: jest.fn(),
    };
    service = new InvestorCommandServiceImpl(
      investorRepository,
      fileStorageService,
      eventPublisherService,
    );
  });

  describe('handleCreateInvestor', () => {
    it('creates a new Investor shell and persists it', async () => {
      // Arrange
      const command = new CreateInvestorCommand('user-1', 'investor@vankoo.com');

      // Act
      const result = await service.handleCreateInvestor(command);

      // Assert
      expect(result).toBeInstanceOf(Investor);
      expect(result.userId.value).toBe('user-1');
      expect(investorRepository.save).toHaveBeenCalledWith(result);
    });
  });

  describe('handleCompleteProfile', () => {
    const command = new CompleteInvestorProfileCommand(
      investorId,
      '87654321',
      'Ana',
      'Torres',
      '+51987654321',
      {
        street: 'Jr. de la Union 500',
        city: 'Lima',
        state: 'Lima',
        postalCode: '15001',
        country: 'PE',
      },
    );

    it('throws NotFoundException when the investor does not exist', async () => {
      // Arrange
      investorRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.handleCompleteProfile(command)).rejects.toThrow(
        NotFoundException,
      );
      expect(investorRepository.save).not.toHaveBeenCalled();
    });

    it('completes the profile, persists it and publishes a ProfileCompleted event', async () => {
      // Arrange
      const investor = buildInvestor();
      investorRepository.findById.mockResolvedValue(investor);

      // Act
      const result = await service.handleCompleteProfile(command);

      // Assert
      expect(result.fullName?.firstName).toBe('Ana');
      expect(investorRepository.save).toHaveBeenCalledWith(investor);
      expect(eventPublisherService.publish).toHaveBeenCalledWith(
        'vankoo.profile.events',
        expect.objectContaining({
          eventType: 'ProfileCompleted',
          profileType: 'INVESTOR',
          investorId,
        }),
      );
    });
  });

  describe('handleUploadDni', () => {
    it('uploads the DNI document and persists the investor', async () => {
      // Arrange
      const investor = buildInvestor();
      investorRepository.findById.mockResolvedValue(investor);
      const command = new UploadInvestorDniCommand(
        investorId,
        'https://storage.vankoo.com/dni.pdf',
      );

      // Act
      const result = await service.handleUploadDni(command);

      // Assert
      expect(result.getDniDocumentUrl()?.url).toBe(
        'https://storage.vankoo.com/dni.pdf',
      );
      expect(investorRepository.save).toHaveBeenCalledWith(investor);
    });
  });

  describe('handleUploadPhoto', () => {
    it('updates the photo and persists the investor', async () => {
      // Arrange
      const investor = buildInvestor();
      investorRepository.findById.mockResolvedValue(investor);
      const command = new UploadInvestorPhotoCommand(
        investorId,
        'https://storage.vankoo.com/photo.png',
      );

      // Act
      const result = await service.handleUploadPhoto(command);

      // Assert
      expect(result.getPhotoUrl()?.url).toBe(
        'https://storage.vankoo.com/photo.png',
      );
      expect(investorRepository.save).toHaveBeenCalledWith(investor);
    });
  });

  describe('handleVerifyKyc', () => {
    it('verifies the KYC, persists it and publishes a KycVerified event', async () => {
      // Arrange
      const investor = buildInvestor();
      investorRepository.findById.mockResolvedValue(investor);

      // Act
      const result = await service.handleVerifyKyc(
        new VerifyInvestorKycCommand(investorId),
      );

      // Assert
      expect(result.getKycStatus()).toBe(KycStatus.VERIFIED);
      expect(eventPublisherService.publish).toHaveBeenCalledWith(
        'vankoo.profile.events',
        expect.objectContaining({ eventType: 'KycVerified', investorId }),
      );
    });

    it('propagates the domain invariant error when the KYC was already processed', async () => {
      // Arrange
      const investor = buildInvestor(KycStatus.VERIFIED);
      investorRepository.findById.mockResolvedValue(investor);

      // Act & Assert
      await expect(
        service.handleVerifyKyc(new VerifyInvestorKycCommand(investorId)),
      ).rejects.toThrow(/El KYC de este perfil ya fue procesado/);
      expect(investorRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('handleRejectKyc', () => {
    it('rejects the KYC, persists it and publishes a KycRejected event', async () => {
      // Arrange
      const investor = buildInvestor();
      investorRepository.findById.mockResolvedValue(investor);
      const command = new RejectInvestorKycCommand(
        investorId,
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
          investorId,
          reason: 'Documentación incompleta',
        }),
      );
    });

    it('propagates the domain invariant error when the KYC was already processed', async () => {
      // Arrange
      const investor = buildInvestor(KycStatus.REJECTED);
      investorRepository.findById.mockResolvedValue(investor);
      const command = new RejectInvestorKycCommand(investorId, 'Otro motivo');

      // Act & Assert
      await expect(service.handleRejectKyc(command)).rejects.toThrow(
        /El KYC de este perfil ya fue procesado/,
      );
    });
  });

  describe('handleRequestDniUploadUrl', () => {
    it('builds the investors/{id}/dni/ object key and delegates to the storage service', async () => {
      // Arrange
      const investor = buildInvestor();
      investorRepository.findById.mockResolvedValue(investor);
      fileStorageService.generateUploadUrl.mockResolvedValue({
        uploadUrl: 'https://minio/upload',
        fileUrl: 'https://minio/file',
        expiresInSeconds: 60,
      });
      const command = new RequestInvestorDniUploadUrlCommand(
        investorId,
        'application/pdf',
      );

      // Act
      const result = await service.handleRequestDniUploadUrl(command);

      // Assert
      expect(fileStorageService.generateUploadUrl).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^investors/${investorId}/dni/.+\\.pdf$`)),
      );
      expect(result.uploadUrl).toBe('https://minio/upload');
    });

    it('throws NotFoundException when the investor does not exist', async () => {
      // Arrange
      investorRepository.findById.mockResolvedValue(null);
      const command = new RequestInvestorDniUploadUrlCommand(
        investorId,
        'application/pdf',
      );

      // Act & Assert
      await expect(
        service.handleRequestDniUploadUrl(command),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleRequestPhotoUploadUrl', () => {
    it('builds the investors/{id}/photo/ object key and delegates to the storage service', async () => {
      // Arrange
      const investor = buildInvestor();
      investorRepository.findById.mockResolvedValue(investor);
      fileStorageService.generateUploadUrl.mockResolvedValue({
        uploadUrl: 'https://minio/upload',
        fileUrl: 'https://minio/file',
        expiresInSeconds: 60,
      });
      const command = new RequestInvestorPhotoUploadUrlCommand(
        investorId,
        'image/jpeg',
      );

      // Act
      const result = await service.handleRequestPhotoUploadUrl(command);

      // Assert
      expect(fileStorageService.generateUploadUrl).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`^investors/${investorId}/photo/.+\\.jpg$`),
        ),
      );
      expect(result.fileUrl).toBe('https://minio/file');
    });
  });
});
