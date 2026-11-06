/**
 * @author LiquiLabs
 * @summary La revisión del KYC de una empresa: la solicitud vigente y lo que respondió el risk-service.
 *
 * El risk-service comprueba la ficha RUC firmada por SUNAT contra el padrón y la
 * SSCO (reglas kyc-v1) y recomienda; Profile decide el estado con eso. Aquí se
 * guarda lo que respondió, para que la MYPE vea el resultado y el motivo, y
 * cuántas veces la rechazaron, para la espera antes de reenviar.
 */
export type VerificationDecisionValue =
  | 'VERIFIED'
  | 'REJECTED'
  | 'CORRECTION_REQUIRED';

export interface KycCheck {
  code: string;
  passed: boolean;
  detail: string;
}

export interface KycFieldError {
  field: string;
  code: string;
}

export interface KycEvidence {
  code: string;
  detail: string;
}

/** La decisión del risk-service sobre una solicitud concreta. */
export interface VerificationDecision {
  requestId: string;
  verificationId: string;
  decision: VerificationDecisionValue;
  checks: KycCheck[];
  reasonCodes: string[];
  fieldErrors: KycFieldError[];
  evidence: KycEvidence[];
  demo: boolean;
  decidedAt: Date;
}

const RUC_DOCUMENT_KEY_PATTERN =
  /^companies\/[0-9a-fA-F-]{36}\/ruc\/[0-9a-fA-F-]{36}\.pdf$/;
const HOUR_MS = 60 * 60 * 1000;
/** Espera para reenviar tras el 1.º, el 2.º y del 3.º rechazo en adelante. */
export const RETRY_WAITS_MS = [24 * HOUR_MS, 72 * HOUR_MS, 7 * 24 * HOUR_MS];

export class KycReview {
  constructor(
    public readonly requestId?: string,
    public readonly rucDocumentKey?: string,
    public readonly submittedAt?: Date,
    public readonly verificationId?: string,
    public readonly decision?: VerificationDecisionValue,
    public readonly checks: KycCheck[] = [],
    public readonly reasonCodes: string[] = [],
    public readonly fieldErrors: KycFieldError[] = [],
    public readonly evidence: KycEvidence[] = [],
    public readonly demo = false,
    public readonly decidedAt?: Date,
    public readonly attempts = 0,
    public readonly retryAvailableAt?: Date,
  ) {}

  static none(): KycReview {
    return new KycReview();
  }

  /**
   * Una solicitud nueva, a la espera del risk-service. La ficha tiene que ser un PDF
   * en la carpeta ruc de la propia empresa: el risk-service descargará esa clave.
   * Conserva los rechazos anteriores, que cuentan para la próxima espera.
   */
  submitted(
    companyId: string,
    requestId: string,
    rucDocumentKey: string,
    submittedAt: Date,
  ): KycReview {
    if (
      !RUC_DOCUMENT_KEY_PATTERN.test(rucDocumentKey) ||
      !rucDocumentKey.startsWith(`companies/${companyId}/`)
    ) {
      throw new Error(
        'La ficha RUC debe ser un PDF en la carpeta de la empresa.',
      );
    }
    return new KycReview(
      requestId,
      rucDocumentKey,
      submittedAt,
      undefined,
      undefined,
      [],
      [],
      [],
      [],
      false,
      undefined,
      this.attempts,
      undefined,
    );
  }

  /**
   * Aplica la decisión, o devuelve null si es sobre una solicitud que ya no es la vigente.
   * Un rechazo suma un intento y fija desde cuándo se puede reenviar.
   */
  decide(decision: VerificationDecision): KycReview | null {
    if (!this.requestId || decision.requestId !== this.requestId) return null;
    const rejected = decision.decision === 'REJECTED';
    const attempts = rejected ? this.attempts + 1 : this.attempts;
    const wait = RETRY_WAITS_MS[Math.min(attempts, RETRY_WAITS_MS.length) - 1];
    return new KycReview(
      this.requestId,
      this.rucDocumentKey,
      this.submittedAt,
      decision.verificationId,
      decision.decision,
      decision.checks,
      decision.reasonCodes,
      decision.decision === 'CORRECTION_REQUIRED' ? decision.fieldErrors : [],
      decision.evidence,
      decision.demo,
      decision.decidedAt,
      attempts,
      rejected ? new Date(decision.decidedAt.getTime() + wait) : undefined,
    );
  }

  /** Un rechazo a mano (PATCH /companies/:id/kyc/reject): cuenta como uno del risk-service. */
  rejectedByHand(decidedAt: Date): KycReview {
    const attempts = this.attempts + 1;
    const wait = RETRY_WAITS_MS[Math.min(attempts, RETRY_WAITS_MS.length) - 1];
    return new KycReview(
      this.requestId,
      this.rucDocumentKey,
      this.submittedAt,
      this.verificationId,
      'REJECTED',
      this.checks,
      this.reasonCodes,
      [],
      this.evidence,
      this.demo,
      decidedAt,
      attempts,
      new Date(decidedAt.getTime() + wait),
    );
  }

  /** Si ya pasó la espera tras el último rechazo (o no hubo ninguno). */
  canResubmitAt(now: Date): boolean {
    return !this.retryAvailableAt || now >= this.retryAvailableAt;
  }

  /** El motivo para mostrar: el detalle de la primera regla que falló. */
  get firstFailureDetail(): string | undefined {
    return this.checks.find((check) => !check.passed)?.detail;
  }
}
