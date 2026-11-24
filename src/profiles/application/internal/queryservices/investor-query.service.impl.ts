import { Injectable, Inject } from '@nestjs/common';
import { IInvestorQueryService } from '../../../domain/services/investor-query.service';
import { GetInvestorByIdQuery } from '../../../domain/model/queries/get-investor-by-id.query';
import { GetInvestorByUserIdQuery } from '../../../domain/model/queries/get-investor-by-user-id.query';
import { Investor } from '../../../domain/model/aggregates/investor.aggregate';
import { INVESTOR_REPOSITORY } from '../../../domain/repositories/investor.repository';

import type { IInvestorRepository } from '../../../domain/repositories/investor.repository';

/** @author LiquiLabs */
@Injectable()
export class InvestorQueryServiceImpl implements IInvestorQueryService {
  constructor(
    @Inject(INVESTOR_REPOSITORY)
    private readonly investorRepository: IInvestorRepository,
  ) {}

  async handleGetInvestorById(
    query: GetInvestorByIdQuery,
  ): Promise<Investor | null> {
    return await this.investorRepository.findById(query.investorId);
  }

  async handleGetInvestorByUserId(
    query: GetInvestorByUserIdQuery,
  ): Promise<Investor | null> {
    return await this.investorRepository.findByUserId(query.userId);
  }
}
