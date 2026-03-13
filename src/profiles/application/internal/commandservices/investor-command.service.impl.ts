import { Injectable, NotFoundException, Inject } from '@nestjs/common';
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

/** @author LiquiLabs */
@Injectable()
export class InvestorCommandServiceImpl implements IInvestorCommandService {
  constructor(
    @Inject(INVESTOR_REPOSITORY)
    private readonly investorRepository: IInvestorRepository,
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

    return investor;
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
}
