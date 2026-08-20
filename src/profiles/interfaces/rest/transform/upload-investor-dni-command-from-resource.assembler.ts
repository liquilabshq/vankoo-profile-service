import { UploadInvestorDniCommand } from '../../../domain/model/commands/upload-investor-dni.command';
import { UploadInvestorDniResource } from '../resources/upload-investor-dni.resource';

/** @author LiquiLabs */
export class UploadInvestorDniCommandFromResourceAssembler {
  public static toCommandFromResource(
    investorId: string,
    resource: UploadInvestorDniResource,
  ): UploadInvestorDniCommand {
    return new UploadInvestorDniCommand(investorId, resource.dniDocumentUrl);
  }
}
