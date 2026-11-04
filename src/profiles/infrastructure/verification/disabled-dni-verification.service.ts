import {
  DniVerificationResult,
  DniVerificationUnavailableError,
  IDniVerificationService,
} from '../../domain/services/dni-verification.service';

/**
 * @author LiquiLabs
 * @summary Verificación automática apagada: el KYC del inversor sigue siendo manual.
 */
export class DisabledDniVerificationService implements IDniVerificationService {
  readonly enabled = false;

  verify(): Promise<DniVerificationResult> {
    return Promise.reject(
      new DniVerificationUnavailableError(
        'La verificación automática de DNI está desactivada.',
      ),
    );
  }
}
