/** @author LiquiLabs */
export class RequestCompanyLogoUploadUrlCommand {
  constructor(
    public readonly companyId: string,
    public readonly contentType: string,
  ) {
    if (!companyId) throw new Error('El companyId es requerido');
    if (!contentType) throw new Error('El contentType es requerido');
  }
}
