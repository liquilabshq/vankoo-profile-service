import { RequestInvestorDniUploadUrlCommand } from '../../../domain/model/commands/request-investor-dni-upload-url.command';
import { RequestUploadUrlResource } from '../resources/request-upload-url.resource';

/** @author LiquiLabs */
export class RequestInvestorDniUploadUrlCommandFromResourceAssembler {
  public static toCommandFromResource(
    investorId: string,
    resource: RequestUploadUrlResource,
  ): RequestInvestorDniUploadUrlCommand {
    return new RequestInvestorDniUploadUrlCommand(
      investorId,
      resource.contentType,
    );
  }
}
