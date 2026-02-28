/**
 * @author LiquiLabs
 * @summary Comando para subir/actualizar el RUC de un perfil.
 */
export class UploadRucCommand {
  constructor(
    public readonly profileId: string,
    public readonly rucDocumentUrl: string,
  ) {
    if (!profileId || profileId.trim() === '') {
      throw new Error('El profileId es requerido');
    }
    if (!rucDocumentUrl || rucDocumentUrl.trim() === '') {
      throw new Error('La URL del documento RUC es requerida');
    }
  }
}
