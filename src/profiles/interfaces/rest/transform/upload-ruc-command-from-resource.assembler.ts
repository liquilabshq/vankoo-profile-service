import { UploadRucCommand } from '../../../domain/model/commands/upload-ruc.command';
import { UploadRucResource } from '../resources/upload-ruc.resource';

export class UploadRucCommandFromResourceAssembler {
  public static toCommandFromResource(
    profileId: string,
    resource: UploadRucResource,
  ): UploadRucCommand {
    return new UploadRucCommand(profileId, resource.rucDocumentUrl);
  }
}
