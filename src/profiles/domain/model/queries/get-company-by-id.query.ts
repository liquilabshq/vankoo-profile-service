/** @author LiquiLabs */
export class GetCompanyByIdQuery {
  constructor(public readonly companyId: string) {
    if (!companyId || companyId.trim() === '') {
      throw new Error('El ID de la empresa es requerido');
    }
  }
}
