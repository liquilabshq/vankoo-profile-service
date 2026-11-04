import {
  DniVerificationRequest,
  DniVerificationResult,
  DniVerificationStatus,
  DniVerificationUnavailableError,
  IDniVerificationService,
} from '../../domain/services/dni-verification.service';

const STATUSES: readonly DniVerificationStatus[] = [
  'VERIFIED',
  'NAME_MISMATCH',
  'NOT_FOUND',
];

/**
 * @author LiquiLabs
 * @summary Cliente HTTP de la función serverless de verificación de DNI (Azure Functions).
 * Autenticación: clave de función en el header `x-functions-key`.
 */
export class HttpDniVerificationService implements IDniVerificationService {
  readonly enabled = true;

  constructor(
    private readonly url: string,
    private readonly functionKey: string,
    private readonly timeoutMs: number,
  ) {}

  async verify(
    request: DniVerificationRequest,
  ): Promise<DniVerificationResult> {
    let response: Response;
    try {
      response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.functionKey ? { 'x-functions-key': this.functionKey } : {}),
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new DniVerificationUnavailableError(
        `No se pudo llamar a la función de verificación de DNI: ${String(error)}`,
      );
    }

    if (!response.ok) {
      // 400 (datos inválidos), 401 (clave), 502 (fuente caída)...: sin veredicto confiable.
      throw new DniVerificationUnavailableError(
        `La función de verificación de DNI respondió ${response.status}.`,
      );
    }

    const body = (await response.json().catch(() => null)) as {
      status?: string;
      source?: string;
    } | null;
    const status = STATUSES.find((candidate) => candidate === body?.status);
    if (!status) {
      throw new DniVerificationUnavailableError(
        'La función de verificación de DNI devolvió una respuesta inesperada.',
      );
    }
    return { status, source: body?.source ?? 'desconocida' };
  }
}
