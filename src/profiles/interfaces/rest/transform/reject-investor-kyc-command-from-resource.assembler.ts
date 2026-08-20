import { RejectInvestorKycCommand } from '../../../domain/model/commands/reject-investor-kyc.command';
import { RejectKycResource } from '../resources/reject-kyc.resource';

/** @author LiquiLabs */
export class RejectInvestorKycCommandFromResourceAssembler {
  public static toCommandFromResource(
    investorId: string,
    resource: RejectKycResource,
  ): RejectInvestorKycCommand {
    return new RejectInvestorKycCommand(investorId, resource.reason);
  }
}
