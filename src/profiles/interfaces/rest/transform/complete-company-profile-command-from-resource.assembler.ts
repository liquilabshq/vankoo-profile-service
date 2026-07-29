import { CompleteCompanyProfileResource } from '../resources/complete-company-profile.resource';
import { CompleteCompanyProfileCommand } from '../../../domain/model/commands/complete-company-profile.command';

/** @author LiquiLabs */
export class CompleteCompanyProfileCommandFromResourceAssembler {
  public static toCommandFromResource(
    companyId: string,
    resource: CompleteCompanyProfileResource,
  ): CompleteCompanyProfileCommand {
    return new CompleteCompanyProfileCommand(
      companyId,
      resource.rucNumber,
      resource.businessName,
      resource.industrySector,
      resource.contactPhone,
      resource.legalAddress,
    );
  }
}
