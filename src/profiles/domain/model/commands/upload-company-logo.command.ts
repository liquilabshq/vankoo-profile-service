/**
 * @author LiquiLabs
 * @summary Comando para actualizar el logo visible de la empresa.
 */
export class UploadCompanyLogoCommand {
  constructor(
    public readonly companyId: string,
    public readonly logoUrl: string,
  ) {
    if (!companyId || companyId.trim() === '') {
      throw new Error('El companyId es requerido para actualizar el logo');
    }
    if (!logoUrl || logoUrl.trim() === '') {
      throw new Error('La URL del logo es requerida');
    }
  }
}
