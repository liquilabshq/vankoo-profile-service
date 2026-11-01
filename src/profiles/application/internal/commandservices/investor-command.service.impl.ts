import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IInvestorCommandService } from '../../../domain/services/investor-command.service';
import { UploadInvestorDniCommand } from '../../../domain/model/commands/upload-investor-dni.command';
import { UploadInvestorPhotoCommand } from '../../../domain/model/commands/upload-investor-photo.command';
import { Investor } from '../../../domain/model/aggregates/investor.aggregate';
import { DocumentUrl } from '../../../domain/model/valueobjects/document-url.vo';
import { INVESTOR_REPOSITORY } from '../../../domain/repositories/investor.repository';

import type { IInvestorRepository } from '../../../domain/repositories/investor.repository';
import { CreateInvestorCommand } from '../../../domain/model/commands/create-investor.command';
import { InvestorId } from '../../../domain/model/valueobjects/investor-id.vo';
import { UserId } from '../../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../../domain/model/valueobjects/email.vo';
import { CompleteInvestorProfileCommand } from '../../../domain/model/commands/complete-investor-profile.command';
import { RequestInvestorDniUploadUrlCommand } from '../../../domain/model/commands/request-investor-dni-upload-url.command';
import { RequestInvestorPhotoUploadUrlCommand } from '../../../domain/model/commands/request-investor-photo-upload-url.command';
import { VerifyInvestorKycCommand } from '../../../domain/model/commands/verify-investor-kyc.command';
import { RejectInvestorKycCommand } from '../../../domain/model/commands/reject-investor-kyc.command';
import {
  FILE_STORAGE_SERVICE,
  resolveFileExtension,
} from '../../../domain/services/file-storage.service';
import type {
  IFileStorageService,
  UploadUrlResult,
} from '../../../domain/services/file-storage.service';
import { EVENT_PUBLISHER_SERVICE } from '../../../domain/services/event-publisher.service';
import type { IEventPublisherService } from '../../../domain/services/event-publisher.service';
import { DNI_VERIFICATION_SERVICE } from '../../../domain/services/dni-verification.service';
import type { IDniVerificationService } from '../../../domain/services/dni-verification.service';
import { KycStatus } from '../../../domain/model/valueobjects/kyc-status.enum';

const PROFILE_EVENTS_TOPIC = 'vankoo.profile.events';

const DNI_MISMATCH_REASON =
  'El nombre declarado no coincide con el registrado para este DNI.';
const DNI_NOT_FOUND_REASON = 'El DNI no existe en el registro consultado.';

/** @author LiquiLabs */
@Injectable()
export class InvestorCommandServiceImpl implements IInvestorCommandService {
  private readonly logger = new Logger(InvestorCommandServiceImpl.name);

  constructor(
    @Inject(INVESTOR_REPOSITORY)
    private readonly investorRepository: IInvestorRepository,

    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,

    @Inject(EVENT_PUBLISHER_SERVICE)
    private readonly eventPublisherService: IEventPublisherService,

    @Inject(DNI_VERIFICATION_SERVICE)
    private readonly dniVerificationService: IDniVerificationService,
  ) {}

  async handleCreateInvestor(
    command: CreateInvestorCommand,
  ): Promise<Investor> {
    const investorId = new InvestorId();
    const userId = new UserId(command.userId);
    const email = new Email(command.email);

    const investor = new Investor(investorId, userId, email);

    await this.investorRepository.save(investor);

    return investor;
  }

  async handleCompleteProfile(
    command: CompleteInvestorProfileCommand,
  ): Promise<Investor> {
    // 1. Buscamos el cascarón en la base de datos
    const investor = await this.investorRepository.findById(command.investorId);

    if (!investor) {
      throw new NotFoundException(
        `Inversor con ID ${command.investorId} no encontrado.`,
      );
    }

    // 2. Actualizamos el agregado.
    investor.completeProfile(
      command.dni,
      command.firstName,
      command.lastName,
      command.contactPhone,
      command.billingAddress,
    );

    // 3. Guardamos los cambios
    await this.investorRepository.save(investor);

    // 4. Publicamos el evento de dominio para otros microservicios
    await this.eventPublisherService.publish(PROFILE_EVENTS_TOPIC, {
      eventType: 'ProfileCompleted',
      profileType: 'INVESTOR',
      investorId: investor.id.value,
      userId: investor.userId.value,
      email: investor.contactEmail.address,
    });

    // 5. Verificación automática del DNI (función serverless). No bloquea la respuesta:
    //    el KYC pasa a VERIFIED/REJECTED cuando la función contesta.
    void this.autoVerifyDni(command);

    return investor;
  }

  /**
   * Pide a la función serverless que confirme el DNI y aplica su veredicto con los
   * mismos comandos que el flujo manual. Si no hay veredicto confiable (función
   * apagada, caída, clave inválida...) el KYC queda PENDING para revisión manual.
   */
  private async autoVerifyDni(
    command: CompleteInvestorProfileCommand,
  ): Promise<void> {
    if (!this.dniVerificationService.enabled) return;

    try {
      const current = await this.investorRepository.findById(
        command.investorId,
      );
      if (current?.getKycStatus() !== KycStatus.PENDING) return;

      const result = await this.dniVerificationService.verify({
        investorId: command.investorId,
        dni: command.dni,
        firstName: command.firstName,
        lastName: command.lastName,
      });

      switch (result.status) {
        case 'VERIFIED':
          await this.handleVerifyKyc(
            new VerifyInvestorKycCommand(command.investorId),
          );
          break;
        case 'NAME_MISMATCH':
          await this.handleRejectKyc(
            new RejectInvestorKycCommand(
              command.investorId,
              DNI_MISMATCH_REASON,
            ),
          );
          break;
        case 'NOT_FOUND':
          await this.handleRejectKyc(
            new RejectInvestorKycCommand(
              command.investorId,
              DNI_NOT_FOUND_REASON,
            ),
          );
          break;
      }
    } catch (error) {
      this.logger.warn(
        `Verificación automática del DNI no concluyó para el inversor ${command.investorId}; ` +
          `queda en revisión manual: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async handleUploadDni(command: UploadInvestorDniCommand): Promise<Investor> {
    const investor = await this.investorRepository.findById(command.investorId);
    if (!investor)
      throw new NotFoundException(
        `Inversor con ID ${command.investorId} no encontrado.`,
      );

    const documentUrl = new DocumentUrl(command.dniDocumentUrl);
    investor.updateDniDocument(documentUrl);

    await this.investorRepository.save(investor);
    return investor;
  }

  async handleUploadPhoto(
    command: UploadInvestorPhotoCommand,
  ): Promise<Investor> {
    const investor = await this.investorRepository.findById(command.investorId);
    if (!investor)
      throw new NotFoundException(
        `Inversor con ID ${command.investorId} no encontrado.`,
      );

    const photoUrl = new DocumentUrl(command.photoUrl);
    investor.updatePhoto(photoUrl);

    await this.investorRepository.save(investor);
    return investor;
  }

  async handleRequestDniUploadUrl(
    command: RequestInvestorDniUploadUrlCommand,
  ): Promise<UploadUrlResult> {
    const investor = await this.investorRepository.findById(command.investorId);
    if (!investor)
      throw new NotFoundException(
        `Inversor con ID ${command.investorId} no encontrado.`,
      );

    const extension = resolveFileExtension(command.contentType);
    const objectKey = `investors/${command.investorId}/dni/${randomUUID()}.${extension}`;

    return this.fileStorageService.generateUploadUrl(objectKey);
  }

  async handleRequestPhotoUploadUrl(
    command: RequestInvestorPhotoUploadUrlCommand,
  ): Promise<UploadUrlResult> {
    const investor = await this.investorRepository.findById(command.investorId);
    if (!investor)
      throw new NotFoundException(
        `Inversor con ID ${command.investorId} no encontrado.`,
      );

    const extension = resolveFileExtension(command.contentType);
    const objectKey = `investors/${command.investorId}/photo/${randomUUID()}.${extension}`;

    return this.fileStorageService.generateUploadUrl(objectKey);
  }

  async handleVerifyKyc(command: VerifyInvestorKycCommand): Promise<Investor> {
    const investor = await this.investorRepository.findById(command.investorId);
    if (!investor) {
      throw new NotFoundException(
        `Inversor con ID ${command.investorId} no encontrado.`,
      );
    }

    investor.verifyKyc();
    await this.investorRepository.save(investor);

    await this.eventPublisherService.publish(PROFILE_EVENTS_TOPIC, {
      eventType: 'KycVerified',
      profileType: 'INVESTOR',
      investorId: investor.id.value,
      userId: investor.userId.value,
      email: investor.contactEmail.address,
      kycStatus: investor.getKycStatus(),
    });

    return investor;
  }

  async handleRejectKyc(command: RejectInvestorKycCommand): Promise<Investor> {
    const investor = await this.investorRepository.findById(command.investorId);
    if (!investor) {
      throw new NotFoundException(
        `Inversor con ID ${command.investorId} no encontrado.`,
      );
    }

    investor.rejectKyc(command.reason);
    await this.investorRepository.save(investor);

    await this.eventPublisherService.publish(PROFILE_EVENTS_TOPIC, {
      eventType: 'KycRejected',
      profileType: 'INVESTOR',
      investorId: investor.id.value,
      userId: investor.userId.value,
      email: investor.contactEmail.address,
      kycStatus: investor.getKycStatus(),
      reason: investor.getKycRejectionReason()?.value,
    });

    return investor;
  }
}
