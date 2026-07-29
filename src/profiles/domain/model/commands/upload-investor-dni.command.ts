/** @author LiquiLabs */
export class UploadInvestorDniCommand {
  constructor(
    public readonly investorId: string,
    public readonly dniDocumentUrl: string, // Sigue siendo string aquí en el comando
  ) {
    if (!investorId) throw new Error('El investorId es requerido');
    if (!dniDocumentUrl) throw new Error('La URL del DNI es requerida');
  }
}
