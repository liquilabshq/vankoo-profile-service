import { Company } from '../model/aggregates/company.aggregate';

/**
 * @author LiquiLabs
 * @summary Contrato del repositorio para la persistencia de Empresas (Companies).
 */
export const COMPANY_REPOSITORY = 'COMPANY_REPOSITORY';

export interface ICompanyRepository {
  findById(id: string): Promise<Company | null>;
  save(company: Company): Promise<void>;
}
