/** @author LiquiLabs */
export class KycRejectionReason {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('El motivo de rechazo del KYC es requerido');
    }
  }
}
