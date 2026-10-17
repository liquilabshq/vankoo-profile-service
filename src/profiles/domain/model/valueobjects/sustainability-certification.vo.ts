/**
 * @author LiquiLabs
 * @summary Estado del certificado ambiental (ISO 14001 / ISO 50001) que la empresa subió a su perfil.
 *
 * Profile guarda el archivo y el estado; quien decide si la empresa es verde es
 * el risk-service, que lee el certificado y aplica sus reglas (green-v1). Aquí
 * solo se guarda lo que respondió, para que la MYPE vea el resultado y el motivo.
 */
export enum SustainabilityCertificationStatus {
  NONE = 'NONE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  GREEN = 'GREEN',
  NOT_GREEN = 'NOT_GREEN',
}

export interface SustainabilityCriterion {
  code: string;
  passed: boolean;
  detail: string;
}

/** La decisión del risk-service sobre una subida concreta. */
export interface SustainabilityDecision {
  submissionId: string;
  certificationId: string;
  green: boolean;
  standard: string | null;
  issuer: string | null;
  validUntil: string | null;
  criteria: SustainabilityCriterion[];
  reasonCodes: string[];
  decidedAt: Date;
}

const OBJECT_KEY_PATTERN =
  /^companies\/[0-9a-fA-F-]{36}\/sustainability\/[0-9a-fA-F-]{36}\.(pdf|jpg|png)$/;
const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  png: 'image/png',
};

export class SustainabilityCertification {
  constructor(
    public readonly status: SustainabilityCertificationStatus,
    public readonly submissionId?: string,
    public readonly objectKey?: string,
    public readonly contentType?: string,
    public readonly submittedAt?: Date,
    public readonly certificationId?: string,
    public readonly standard?: string,
    public readonly issuer?: string,
    public readonly validUntil?: string,
    public readonly criteria: SustainabilityCriterion[] = [],
    public readonly reasonCodes: string[] = [],
    public readonly decidedAt?: Date,
  ) {}

  static none(): SustainabilityCertification {
    return new SustainabilityCertification(
      SustainabilityCertificationStatus.NONE,
    );
  }

  /**
   * Una subida nueva, a la espera de la decisión del risk-service.
   * La clave tiene que estar en la carpeta de sostenibilidad de la propia empresa:
   * el risk-service descargará exactamente ese objeto.
   */
  static submitted(
    companyId: string,
    submissionId: string,
    objectKey: string,
    submittedAt: Date,
  ): SustainabilityCertification {
    const match = OBJECT_KEY_PATTERN.exec(objectKey);
    if (!match || !objectKey.startsWith(`companies/${companyId}/`)) {
      throw new Error(
        'El certificado debe estar en la carpeta de sostenibilidad de la empresa.',
      );
    }
    return new SustainabilityCertification(
      SustainabilityCertificationStatus.UNDER_REVIEW,
      submissionId,
      objectKey,
      CONTENT_TYPES[match[1]],
      submittedAt,
    );
  }

  /** Aplica la decisión, o devuelve null si es sobre una subida que ya no es la vigente. */
  decide(decision: SustainabilityDecision): SustainabilityCertification | null {
    if (!this.submissionId || decision.submissionId !== this.submissionId) {
      return null;
    }
    return new SustainabilityCertification(
      decision.green
        ? SustainabilityCertificationStatus.GREEN
        : SustainabilityCertificationStatus.NOT_GREEN,
      this.submissionId,
      this.objectKey,
      this.contentType,
      this.submittedAt,
      decision.certificationId,
      decision.standard ?? undefined,
      decision.issuer ?? undefined,
      decision.validUntil ?? undefined,
      decision.criteria,
      decision.reasonCodes,
      decision.decidedAt,
    );
  }

  get isGreen(): boolean {
    return this.status === SustainabilityCertificationStatus.GREEN;
  }
}
