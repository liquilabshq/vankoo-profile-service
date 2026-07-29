import { UploadCompanyLogoCommand } from '../../../domain/model/commands/upload-company-logo.command';
import { UploadCompanyLogoResource } from '../resources/upload-company-logo.resource';

/** @author LiquiLabs */
export class UploadCompanyLogoCommandFromResourceAssembler {
  public static toCommandFromResource(
    companyId: string,
    resource: UploadCompanyLogoResource,
  ): UploadCompanyLogoCommand {
    return new UploadCompanyLogoCommand(companyId, resource.logoUrl);
  }
}
