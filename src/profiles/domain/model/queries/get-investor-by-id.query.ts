/** @author LiquiLabs */
export class GetInvestorByIdQuery {
  constructor(public readonly investorId: string) {
    if (!investorId || investorId.trim() === '') {
      throw new Error('El ID del inversor es requerido para la consulta');
    }
  }
}
