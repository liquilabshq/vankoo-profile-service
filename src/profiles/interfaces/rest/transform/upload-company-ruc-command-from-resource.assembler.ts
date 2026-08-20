import { UploadCompanyRucCommand } from '../../../domain/model/commands/upload-company-ruc.command';
import { UploadCompanyRucResource } from '../resources/upload-company-ruc.resource';

/** @author LiquiLabs */
export class UploadCompanyRucCommandFromResourceAssembler {
  public static toCommandFromResource(
    companyId: string,
    resource: UploadCompanyRucResource,
  ): UploadCompanyRucCommand {
    return new UploadCompanyRucCommand(companyId, resource.rucDocumentUrl);
  }
}
