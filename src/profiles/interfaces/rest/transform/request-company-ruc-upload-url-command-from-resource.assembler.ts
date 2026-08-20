import { RequestCompanyRucUploadUrlCommand } from '../../../domain/model/commands/request-company-ruc-upload-url.command';
import { RequestUploadUrlResource } from '../resources/request-upload-url.resource';

/** @author LiquiLabs */
export class RequestCompanyRucUploadUrlCommandFromResourceAssembler {
  public static toCommandFromResource(
    companyId: string,
    resource: RequestUploadUrlResource,
  ): RequestCompanyRucUploadUrlCommand {
    return new RequestCompanyRucUploadUrlCommand(
      companyId,
      resource.contentType,
    );
  }
}
