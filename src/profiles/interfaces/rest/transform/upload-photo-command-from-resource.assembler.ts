import { UploadPhotoCommand } from '../../../domain/model/commands/upload-photo.command';
import { UploadPhotoResource } from '../resources/upload-photo.resource';

export class UploadPhotoCommandFromResourceAssembler {
  public static toCommandFromResource(
    profileId: string,
    resource: UploadPhotoResource,
  ): UploadPhotoCommand {
    return new UploadPhotoCommand(profileId, resource.photoUrl);
  }
}
