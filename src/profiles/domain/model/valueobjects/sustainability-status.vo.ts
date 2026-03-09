/** @author LiquiLabs */
export class SustainabilityStatus {
  constructor(
    public readonly isGreen: boolean,
    public readonly verificationDate?: Date,
  ) {}
}
