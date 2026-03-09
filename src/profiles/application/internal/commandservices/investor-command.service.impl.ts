import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IInvestorCommandService } from '../../../domain/services/investor-command.service';
import { UploadInvestorDniCommand } from '../../../domain/model/commands/upload-investor-dni.command';
import { UploadInvestorPhotoCommand } from '../../../domain/model/commands/upload-investor-photo.command';
import { Investor } from '../../../domain/model/aggregates/investor.aggregate';
import { DocumentUrl } from '../../../domain/model/valueobjects/document-url.vo';
import { INVESTOR_REPOSITORY } from '../../../domain/repositories/investor.repository';

import type { IInvestorRepository } from '../../../domain/repositories/investor.repository';

/** @author LiquiLabs */
@Injectable()
export class InvestorCommandServiceImpl implements IInvestorCommandService {
  constructor(
    @Inject(INVESTOR_REPOSITORY)
    private readonly investorRepository: IInvestorRepository,
  ) {}

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
