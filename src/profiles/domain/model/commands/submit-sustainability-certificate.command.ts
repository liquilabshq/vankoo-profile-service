/** @author LiquiLabs */
export class SubmitSustainabilityCertificateCommand {
  constructor(
    public readonly companyId: string,
    public readonly fileUrl: string,
  ) {}
}
