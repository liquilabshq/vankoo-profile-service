import { UploadDniCommand } from '../model/commands/upload-dni.command';
import { ProfileAggregate } from '../model/aggregates/profile.aggregate';
import { UploadRucCommand } from '../model/commands/upload-ruc.command';
import { UploadPhotoCommand } from '../model/commands/upload-photo.command';

/**
 * @author LiquiLabs
 * @summary Contrato del servicio de aplicación para comandos de ProfileAggregate.
 */
export const PROFILE_COMMAND_SERVICE = 'PROFILE_COMMAND_SERVICE';

export interface IProfileCommandService {
  handleUploadDni(command: UploadDniCommand): Promise<ProfileAggregate>;
  handleUploadRuc(command: UploadRucCommand): Promise<ProfileAggregate>;
  handleUploadPhoto(command: UploadPhotoCommand): Promise<ProfileAggregate>;
}
