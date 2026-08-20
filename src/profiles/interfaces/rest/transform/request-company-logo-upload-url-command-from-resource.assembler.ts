import { RequestCompanyLogoUploadUrlCommand } from '../../../domain/model/commands/request-company-logo-upload-url.command';
import { RequestUploadUrlResource } from '../resources/request-upload-url.resource';

/** @author LiquiLabs */
export class RequestCompanyLogoUploadUrlCommandFromResourceAssembler {
  public static toCommandFromResource(
    companyId: string,
    resource: RequestUploadUrlResource,
  ): RequestCompanyLogoUploadUrlCommand {
    return new RequestCompanyLogoUploadUrlCommand(
      companyId,
      resource.contentType,
    );
  }
}
