/** @author LiquiLabs */
export class RequestInvestorDniUploadUrlCommand {
  constructor(
    public readonly investorId: string,
    public readonly contentType: string,
  ) {
    if (!investorId) throw new Error('El investorId es requerido');
    if (!contentType) throw new Error('El contentType es requerido');
  }
}
