import { Investor } from '../model/aggregates/investor.aggregate';

/** @author LiquiLabs */
export const INVESTOR_REPOSITORY = 'INVESTOR_REPOSITORY';

export interface IInvestorRepository {
  findById(id: string): Promise<Investor | null>;
  save(investor: Investor): Promise<void>;
}
