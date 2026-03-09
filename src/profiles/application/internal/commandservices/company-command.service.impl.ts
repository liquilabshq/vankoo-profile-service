import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ICompanyCommandService } from '../../../domain/services/company-command.service';
import { UploadCompanyRucCommand } from '../../../domain/model/commands/upload-company-ruc.command';
import { UploadCompanyLogoCommand } from '../../../domain/model/commands/upload-company-logo.command';
import { Company } from '../../../domain/model/aggregates/company.aggregate';
import { DocumentUrl } from '../../../domain/model/valueobjects/document-url.vo';
import { COMPANY_REPOSITORY } from '../../../domain/repositories/company.repository';

import type { ICompanyRepository } from '../../../domain/repositories/company.repository';

/**
 * @author LiquiLabs
 * @summary Implementación de los casos de uso para las Empresas.
 */
@Injectable()
export class CompanyCommandServiceImpl implements ICompanyCommandService {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async handleUploadRuc(command: UploadCompanyRucCommand): Promise<Company> {
    const company = await this.companyRepository.findById(command.companyId);
    if (!company) {
      throw new NotFoundException(
        `Empresa con ID ${command.companyId} no encontrada.`,
      );
    }

    // 1. Transformamos el string en un Value Object puro
    const documentUrl = new DocumentUrl(command.rucDocumentUrl);

    // 2. Ejecutamos el comportamiento del dominio
    company.uploadRucDocument(documentUrl);

    // 3. Guardamos (el Assembler se encargará de traducir esto a TypeORM por debajo)
    await this.companyRepository.save(company);

    return company;
  }

  async handleUploadLogo(command: UploadCompanyLogoCommand): Promise<Company> {
    const company = await this.companyRepository.findById(command.companyId);
    if (!company) {
      throw new NotFoundException(
        `Empresa con ID ${command.companyId} no encontrada.`,
      );
    }

    const logoUrl = new DocumentUrl(command.logoUrl);
    company.updateLogo(logoUrl);

    await this.companyRepository.save(company);

    return company;
  }
}
