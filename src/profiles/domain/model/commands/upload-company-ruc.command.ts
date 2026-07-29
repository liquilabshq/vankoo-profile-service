/**
 * @author LiquiLabs
 * @summary Comando para subir o actualizar el documento PDF del RUC de la empresa.
 */
export class UploadCompanyRucCommand {
  constructor(
    public readonly companyId: string,
    public readonly rucDocumentUrl: string, // El string crudo que viene de MinIO
  ) {
    if (!companyId || companyId.trim() === '') {
      throw new Error('El companyId es requerido para subir el RUC');
    }
    if (!rucDocumentUrl || rucDocumentUrl.trim() === '') {
      throw new Error('La URL del documento RUC es requerida');
    }
  }
}
