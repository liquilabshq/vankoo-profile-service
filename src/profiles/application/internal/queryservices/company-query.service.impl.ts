import { Injectable, Inject } from '@nestjs/common';
import { ICompanyQueryService } from '../../../domain/services/company-query.service';
import { GetCompanyByIdQuery } from '../../../domain/model/queries/get-company-by-id.query';
import { Company } from '../../../domain/model/aggregates/company.aggregate';
import { COMPANY_REPOSITORY } from '../../../domain/repositories/company.repository';
import type { ICompanyRepository } from '../../../domain/repositories/company.repository';

/** @author LiquiLabs */
@Injectable()
export class CompanyQueryServiceImpl implements ICompanyQueryService {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async handleGetCompanyById(
    query: GetCompanyByIdQuery,
  ): Promise<Company | null> {
    return await this.companyRepository.findById(query.companyId);
  }
}
