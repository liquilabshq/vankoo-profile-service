/** @author LiquiLabs */
export const DNI_VERIFICATION_SERVICE = 'DNI_VERIFICATION_SERVICE';

export type DniVerificationStatus = 'VERIFIED' | 'NAME_MISMATCH' | 'NOT_FOUND';

export interface DniVerificationRequest {
  investorId: string;
  dni: string;
  firstName: string;
  lastName: string;
}

export interface DniVerificationResult {
  status: DniVerificationStatus;
  /** Fuente consultada (p. ej. "eldni.com"); solo informativa. */
  source: string;
}

/** La fuente no pudo consultarse: el KYC debe quedar pendiente para revisión manual. */
export class DniVerificationUnavailableError extends Error {}

/**
 * Verifica que un DNI exista y pertenezca al nombre declarado. La implementación real
 * llama a la función serverless `vankoo-dni-verification-function`.
 */
export interface IDniVerificationService {
  /** false cuando la verificación automática está apagada (DNI_VERIFICATION_ENABLED). */
  readonly enabled: boolean;

  /** @throws DniVerificationUnavailableError si no hay una respuesta confiable. */
  verify(request: DniVerificationRequest): Promise<DniVerificationResult>;
}
