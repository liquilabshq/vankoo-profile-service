import { UploadDniCommand } from '../../../domain/model/commands/upload-dni.command';
import { UploadDniResource } from '../resources/upload-dni.resource';

/**
 * @author LiquiLabs
 * @summary Ensamblador para convertir un recurso REST a un Comando de Dominio.
 */
export class UploadDniCommandFromResourceAssembler {
  public static toCommandFromResource(
    profileId: string,
    resource: UploadDniResource,
  ): UploadDniCommand {
    return new UploadDniCommand(profileId, resource.dniDocumentUrl);
  }
}
