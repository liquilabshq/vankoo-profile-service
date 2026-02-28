/**
 * @author LiquiLabs
 * @summary Comando para subir/actualizar el DNI de un perfil.
 */
export class UploadDniCommand {
  constructor(
    public readonly profileId: string,
    public readonly dniDocumentUrl: string,
  ) {
    if (!profileId || profileId.trim() === '') {
      throw new Error('El profileId es requerido');
    }
    if (!dniDocumentUrl || dniDocumentUrl.trim() === '') {
      throw new Error('La URL del DNI es requerida');
    }
  }
}
