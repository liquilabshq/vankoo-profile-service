import { CompanyResource } from './company.resource';

/** @author LiquiLabs */
export class SustainabilityCriterionResource {
  code: string;
  passed: boolean;
  detail: string;
}

/** @author LiquiLabs */
export class SustainabilityCertificationResource {
  status: string;
  submittedAt?: string;
  certificationId?: string;
  standard?: string;
  issuer?: string;
  validUntil?: string;
  criteria: SustainabilityCriterionResource[];
  reasonCodes: string[];
  decidedAt?: string;
}

/** @author LiquiLabs */
export class KycReviewResource {
  status: string;
  submittedAt?: string;
  decidedAt?: string;
  checks: SustainabilityCriterionResource[];
  reasonCodes: string[];
  fieldErrors: { field: string; code: string }[];
  evidence: { code: string; detail: string }[];
  /** La ficha la firmó la CA de demostración de Vankoo, no SUNAT: mostrarlo aparte. */
  demo: boolean;
  attempts: number;
  retryAvailableAt?: string;
}

/**
 * @author LiquiLabs
 * @summary La empresa de quien llama (GET /companies/me): lo de CompanyResource más
 * lo que necesita la pantalla de perfil.
 */
export class CompanyProfileResource extends CompanyResource {
  contactEmail: string;
  contactPhone?: string;
  legalAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  profileComplete: boolean;
  sustainability: SustainabilityCertificationResource;
  kyc: KycReviewResource;
}
