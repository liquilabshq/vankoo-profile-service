import { CompanyProfileData } from '../aggregates/company.aggregate';

/**
 * @author LiquiLabs
 * @summary La empresa envía sus datos y su ficha RUC (ya subida) para que la verifiquen.
 */
export class SubmitCompanyForVerificationCommand {
  constructor(
    public readonly companyId: string,
    public readonly data: CompanyProfileData,
    public readonly rucDocumentUrl: string,
  ) {}
}
