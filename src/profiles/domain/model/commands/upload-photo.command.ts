/**
 * @author LiquiLabs
 * @summary Comando para actualizar la foto de perfil.
 */
export class UploadPhotoCommand {
  constructor(
    public readonly profileId: string,
    public readonly photoUrl: string,
  ) {
    if (!profileId || profileId.trim() === '') {
      throw new Error('El profileId es requerido');
    }
    if (!photoUrl || photoUrl.trim() === '') {
      throw new Error('La URL de la foto es requerida');
    }
  }
}
