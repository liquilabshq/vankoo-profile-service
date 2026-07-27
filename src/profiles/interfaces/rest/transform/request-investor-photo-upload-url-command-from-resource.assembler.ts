import { RequestInvestorPhotoUploadUrlCommand } from '../../../domain/model/commands/request-investor-photo-upload-url.command';
import { RequestUploadUrlResource } from '../resources/request-upload-url.resource';

/** @author LiquiLabs */
export class RequestInvestorPhotoUploadUrlCommandFromResourceAssembler {
  public static toCommandFromResource(
    investorId: string,
    resource: RequestUploadUrlResource,
  ): RequestInvestorPhotoUploadUrlCommand {
    return new RequestInvestorPhotoUploadUrlCommand(
      investorId,
      resource.contentType,
    );
  }
}
