import { Company } from '../../../domain/model/aggregates/company.aggregate';
import { CompanyResource } from '../resources/company.resource';

/** @author LiquiLabs */
export class CompanyResourceFromEntityAssembler {
  public static toResourceFromEntity(entity: Company): CompanyResource {
    return {
      id: entity.id.value,
      businessName: entity.businessName?.value || '',
      rucNumber: entity.rucNumber?.value || '',
      industrySector: (entity.industrySector as string) || '',
      logoUrl: entity.getLogoUrl()?.url,
      rucDocumentUrl: entity.getRucDocumentUrl()?.url,
    };
  }
}
