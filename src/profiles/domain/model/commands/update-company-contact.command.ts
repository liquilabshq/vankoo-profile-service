import { CompanyProfileData } from '../aggregates/company.aggregate';

/**
 * @author LiquiLabs
 * @summary Una empresa verificada cambia su contacto: sector, teléfono y dirección.
 */
export class UpdateCompanyContactCommand {
  constructor(
    public readonly companyId: string,
    public readonly industrySector: string,
    public readonly contactPhone: string,
    public readonly legalAddress: CompanyProfileData['legalAddress'],
  ) {}
}
