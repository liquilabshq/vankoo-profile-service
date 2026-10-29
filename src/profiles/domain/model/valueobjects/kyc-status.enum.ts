/**
 * @author LiquiLabs
 * IN_REVIEW solo lo usa la empresa: envió sus datos y espera al risk-service.
 */
export enum KycStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}
