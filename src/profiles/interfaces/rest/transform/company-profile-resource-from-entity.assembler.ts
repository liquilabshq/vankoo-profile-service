import { Company } from '../../../domain/model/aggregates/company.aggregate';
import { CompanyProfileResource } from '../resources/company-profile.resource';
import { CompanyResourceFromEntityAssembler } from './company-resource-from-entity.assembler';

/** @author LiquiLabs */
export class CompanyProfileResourceFromEntityAssembler {
  public static toResourceFromEntity(entity: Company): CompanyProfileResource {
    const certification = entity.sustainabilityCertification;
    const address = entity.legalAddress;
    return {
      ...CompanyResourceFromEntityAssembler.toResourceFromEntity(entity),
      contactEmail: entity.contactEmail.address,
      contactPhone: entity.contactPhone?.value,
      legalAddress: address
        ? {
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          }
        : undefined,
      profileComplete: entity.isProfileComplete(),
      sustainability: {
        status: certification.status,
        submittedAt: certification.submittedAt?.toISOString(),
        certificationId: certification.certificationId,
        standard: certification.standard,
        issuer: certification.issuer,
        validUntil: certification.validUntil,
        criteria: certification.criteria,
        reasonCodes: certification.reasonCodes,
        decidedAt: certification.decidedAt?.toISOString(),
      },
    };
  }
}
