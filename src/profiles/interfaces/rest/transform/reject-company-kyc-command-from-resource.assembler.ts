import { RejectCompanyKycCommand } from '../../../domain/model/commands/reject-company-kyc.command';
import { RejectKycResource } from '../resources/reject-kyc.resource';

/** @author LiquiLabs */
export class RejectCompanyKycCommandFromResourceAssembler {
  public static toCommandFromResource(
    companyId: string,
    resource: RejectKycResource,
  ): RejectCompanyKycCommand {
    return new RejectCompanyKycCommand(companyId, resource.reason);
  }
}
