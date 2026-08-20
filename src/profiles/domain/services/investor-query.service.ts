import { GetInvestorByIdQuery } from '../model/queries/get-investor-by-id.query';
import { Investor } from '../model/aggregates/investor.aggregate';

/** @author LiquiLabs */
export const INVESTOR_QUERY_SERVICE = 'INVESTOR_QUERY_SERVICE';

export interface IInvestorQueryService {
  handleGetInvestorById(query: GetInvestorByIdQuery): Promise<Investor | null>;
}
