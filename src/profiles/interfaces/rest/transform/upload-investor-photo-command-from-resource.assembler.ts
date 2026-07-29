import { UploadInvestorPhotoCommand } from '../../../domain/model/commands/upload-investor-photo.command';
import { UploadInvestorPhotoResource } from '../resources/upload-investor-photo.resource';

/** @author LiquiLabs */
export class UploadInvestorPhotoCommandFromResourceAssembler {
  public static toCommandFromResource(
    investorId: string,
    resource: UploadInvestorPhotoResource,
  ): UploadInvestorPhotoCommand {
    return new UploadInvestorPhotoCommand(investorId, resource.photoUrl);
  }
}
