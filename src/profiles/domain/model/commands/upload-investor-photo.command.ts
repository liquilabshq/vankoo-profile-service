/** @author LiquiLabs */
export class UploadInvestorPhotoCommand {
  constructor(
    public readonly investorId: string,
    public readonly photoUrl: string, // Sigue siendo string aquí en el comando
  ) {
    if (!investorId) throw new Error('El investorId es requerido');
    if (!photoUrl) throw new Error('La URL de la foto es requerida');
  }
}
