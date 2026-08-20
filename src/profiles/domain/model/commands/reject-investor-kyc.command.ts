/** @author LiquiLabs */
export class RejectInvestorKycCommand {
  constructor(
    public readonly investorId: string,
    public readonly reason: string,
  ) {}
}
