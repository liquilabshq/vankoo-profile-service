import { GetCompanyByIdQuery } from '../model/queries/get-company-by-id.query';
import { Company } from '../model/aggregates/company.aggregate';
import { GetCompanyByUserIdQuery } from '../model/queries/get-company-by-user-id.query';

/** @author LiquiLabs */
export const COMPANY_QUERY_SERVICE = 'COMPANY_QUERY_SERVICE';

export interface ICompanyQueryService {
  handleGetCompanyById(query: GetCompanyByIdQuery): Promise<Company | null>;
  handleGetCompanyByUserId(
    query: GetCompanyByUserIdQuery,
  ): Promise<Company | null>;
}
