/** @author LiquiLabs */
export class RejectCompanyKycCommand {
  constructor(
    public readonly companyId: string,
    public readonly reason: string,
  ) {}
}
