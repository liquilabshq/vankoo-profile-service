import { VerificationDecision } from '../valueobjects/kyc-review.vo';

/**
 * @author LiquiLabs
 * @summary La decisión del risk-service (CompanyVerificationIssued) sobre el KYC de una empresa.
 */
export class RecordCompanyVerificationCommand {
  constructor(
    public readonly companyId: string,
    public readonly decision: VerificationDecision,
  ) {}
}
