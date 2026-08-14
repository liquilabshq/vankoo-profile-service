import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICompanyRepository } from '../../../../domain/repositories/company.repository';
import { Company } from '../../../../domain/model/aggregates/company.aggregate';
import { CompanyEntity } from '../entities/company.entity';

import { CompanyId } from '../../../../domain/model/valueobjects/company-id.vo';
import { UserId } from '../../../../domain/model/valueobjects/user-id.vo';
import { RucNumber } from '../../../../domain/model/valueobjects/ruc-number.vo';
import { BusinessName } from '../../../../domain/model/valueobjects/business-name.vo';
import { IndustrySector } from '../../../../domain/model/valueobjects/industry-sector.enum';
import { Email } from '../../../../domain/model/valueobjects/email.vo';
import { PhoneNumber } from '../../../../domain/model/valueobjects/phone-number.vo';
import { Address } from '../../../../domain/model/valueobjects/address.vo';
import { SustainabilityStatus } from '../../../../domain/model/valueobjects/sustainability-status.vo';
import { DocumentUrl } from '../../../../domain/model/valueobjects/document-url.vo';
import { KycStatus } from '../../../../domain/model/valueobjects/kyc-status.enum';
import { KycRejectionReason } from '../../../../domain/model/valueobjects/kyc-rejection-reason.vo';

@Injectable()
export class CompanyRepositoryImpl implements ICompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly typeormRepo: Repository<CompanyEntity>,
  ) {}

  async findById(id: string): Promise<Company | null> {
    const entity = await this.typeormRepo.findOne({ where: { id } });
    if (!entity) return null;

    // 1. Reconstruimos en el NUEVO ORDEN (id, userId, email, opcionales...)
    const company = new Company(
      new CompanyId(entity.id),
      new UserId(entity.userId),
      new Email(entity.contactEmail),
      entity.rucNumber ? new RucNumber(entity.rucNumber) : undefined,
      entity.businessName ? new BusinessName(entity.businessName) : undefined,
      entity.industrySector
        ? (entity.industrySector as IndustrySector)
        : undefined,
      entity.contactPhone ? new PhoneNumber(entity.contactPhone) : undefined,
      entity.legalAddress && entity.legalAddress.street
        ? new Address(
            entity.legalAddress.street,
            entity.legalAddress.city,
            entity.legalAddress.state,
            entity.legalAddress.postalCode,
            entity.legalAddress.country,
          )
        : undefined,
      entity.sustainabilityStatus
        ? new SustainabilityStatus(
            entity.sustainabilityStatus.isGreen,
            entity.sustainabilityStatus.verificationDate ?? undefined,
          )
        : undefined,
      entity.kycStatus as KycStatus,
      entity.kycRejectionReason
        ? new KycRejectionReason(entity.kycRejectionReason)
        : undefined,
    );

    if (entity.rucDocumentUrl) {
      company.uploadRucDocument(new DocumentUrl(entity.rucDocumentUrl));
    }
    if (entity.logoUrl) {
      company.updateLogo(new DocumentUrl(entity.logoUrl));
    }

    return company;
  }

  async save(company: Company): Promise<void> {
    const entity = new CompanyEntity();

    entity.id = company.id.value;
    entity.userId = company.userId.value;
    entity.contactEmail = company.contactEmail.address;

    // Usamos el optional chaining "?." para evitar errores si nacieron vacíos
    entity.rucNumber = company.rucNumber?.value ?? null;
    entity.businessName = company.businessName?.value || '';
    entity.industrySector = company.industrySector as string;
    entity.contactPhone = company.contactPhone?.value ?? null;

    entity.legalAddress = {
      street: company.legalAddress?.street,
      city: company.legalAddress?.city,
      state: company.legalAddress?.state,
      postalCode: company.legalAddress?.postalCode,
      country: company.legalAddress?.country,
    } as any; // Casteamos para engañar a TypeORM en caso estén nulos

    entity.sustainabilityStatus = {
      isGreen: company.sustainabilityStatus?.isGreen,
      verificationDate: company.sustainabilityStatus?.verificationDate ?? null,
    } as any;

    entity.logoUrl = company.getLogoUrl()?.url ?? null;
    entity.rucDocumentUrl = company.getRucDocumentUrl()?.url ?? null;

    entity.kycStatus = company.getKycStatus();
    entity.kycRejectionReason = company.getKycRejectionReason()?.value ?? null;

    await this.typeormRepo.save(entity);
  }
}
