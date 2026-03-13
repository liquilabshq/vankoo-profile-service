import { CompleteInvestorProfileResource } from '../resources/complete-investor-profile.resource';
import { CompleteInvestorProfileCommand } from '../../../domain/model/commands/complete-investor-profile.command';

/** @author LiquiLabs */
export class CompleteInvestorProfileCommandFromResourceAssembler {
  public static toCommandFromResource(
    investorId: string,
    resource: CompleteInvestorProfileResource,
  ): CompleteInvestorProfileCommand {
    return new CompleteInvestorProfileCommand(
      investorId,
      resource.dni,
      resource.firstName,
      resource.lastName,
      resource.contactPhone,
      resource.billingAddress,
    );
  }
}
