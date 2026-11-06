import { SustainabilityDecision } from '../valueobjects/sustainability-certification.vo';

/**
 * @author LiquiLabs
 * @summary La decisión del risk-service (GreenCertificationIssued) sobre el certificado de una empresa.
 */
export class RecordSustainabilityDecisionCommand {
  constructor(
    public readonly companyId: string,
    public readonly decision: SustainabilityDecision,
  ) {}
}
