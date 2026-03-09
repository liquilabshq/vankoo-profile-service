import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICompanyRepository } from '../../../../domain/repositories/company.repository';
import { Company } from '../../../../domain/model/aggregates/company.aggregate';
import { CompanyEntity } from '../entities/company.entity';

// Importamos todos los Value Objects necesarios
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

/**
 * @author LiquiLabs
 * @summary Implementación concreta del repositorio de Company usando TypeORM.
 */
@Injectable()
export class CompanyRepositoryImpl implements ICompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly typeormRepo: Repository<CompanyEntity>,
  ) {}

  async findById(id: string): Promise<Company | null> {
    const entity = await this.typeormRepo.findOne({ where: { id } });
    if (!entity) return null;

    // 1. Reconstruimos el Agregado de Dominio desde la Entidad de BD
    const company = new Company(
      new CompanyId(entity.id),
      new UserId(entity.userId),
      new RucNumber(entity.rucNumber),
      new BusinessName(entity.businessName),
      entity.industrySector as IndustrySector,
      new Email(entity.contactEmail),
      entity.contactPhone ? new PhoneNumber(entity.contactPhone) : undefined,
      new Address(
        entity.legalAddress.street,
        entity.legalAddress.city,
        entity.legalAddress.state,
        entity.legalAddress.postalCode,
        entity.legalAddress.country,
      ),
      new SustainabilityStatus(
        entity.sustainabilityStatus.isGreen,
        entity.sustainabilityStatus.verificationDate ?? undefined,
      ),
    );

    // 2. Restauramos los campos opcionales (las URLs de MinIO)
    if (entity.rucDocumentUrl) {
      company.uploadRucDocument(new DocumentUrl(entity.rucDocumentUrl));
    }
    if (entity.logoUrl) {
      company.updateLogo(new DocumentUrl(entity.logoUrl));
    }

    return company;
  }

  async save(company: Company): Promise<void> {
    // 1. Creamos la entidad de TypeORM vacía
    const entity = new CompanyEntity();

    // 2. Desempaquetamos los Value Objects para guardarlos como primitivos
    entity.id = company.id.value;
    entity.userId = company.userId.value;
    entity.rucNumber = company.rucNumber.value;
    entity.businessName = company.businessName.value;
    entity.industrySector = company.industrySector; // Enum se guarda como string
    entity.contactEmail = company.contactEmail.address;

    // El teléfono puede ser opcional dependiendo de tu lógica, validamos por si acaso
    entity.contactPhone = company.contactPhone
      ? company.contactPhone.value
      : null;

    // 3. Aplanamos el Value Object de Dirección (Address)
    entity.legalAddress = {
      street: company.legalAddress.street,
      city: company.legalAddress.city,
      state: company.legalAddress.state,
      postalCode: company.legalAddress.postalCode,
      country: company.legalAddress.country,
    };

    // 4. Aplanamos el Value Object de Sostenibilidad
    entity.sustainabilityStatus = {
      isGreen: company.sustainabilityStatus.isGreen,
      // Usamos ?? en lugar de || para mayor seguridad
      verificationDate: company.sustainabilityStatus.verificationDate ?? null,
    };

    // 5. Extraemos las URLs (necesitarás agregar métodos getLogoUrl() y getRucDocumentUrl() en tu clase Company)
    entity.logoUrl = company.getLogoUrl()?.url ?? null;
    entity.rucDocumentUrl = company.getRucDocumentUrl()?.url ?? null;

    await this.typeormRepo.save(entity);
  }
}
