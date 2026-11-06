import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { COMPANY_COMMAND_SERVICE } from '../../domain/services/company-command.service';
import type { ICompanyCommandService } from '../../domain/services/company-command.service';
import { RecordCompanyVerificationCommand } from '../../domain/model/commands/record-company-verification.command';
import {
  KycCheck,
  KycEvidence,
  KycFieldError,
  VerificationDecisionValue,
} from '../../domain/model/valueobjects/kyc-review.vo';

const COMPANY_VERIFICATIONS_TOPIC = 'risk.company-verifications.v1';
const SCHEMA_VERSION = 1;
const DECISIONS: VerificationDecisionValue[] = [
  'VERIFIED',
  'REJECTED',
  'CORRECTION_REQUIRED',
];

interface CompanyVerificationIssuedData {
  verificationId: string;
  requestId: string;
  companyId: string;
  decision: VerificationDecisionValue;
  checks: KycCheck[];
  reasonCodes: string[];
  fieldErrors: KycFieldError[];
  evidence: KycEvidence[];
  demo: boolean;
  decidedAt: string;
}

interface CompanyVerificationIssuedEvent {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  data: CompanyVerificationIssuedData;
}

/**
 * @author LiquiLabs
 * @summary Aplica la recomendación del risk-service sobre el KYC de una empresa.
 *
 * Contrato: docs/contracts/company-verifications/v1 en vankoo-risk-service. Una
 * decisión sobre una solicitud anterior, o que llega cuando el perfil ya no está en
 * revisión (un mensaje repetido, por ejemplo), se ignora.
 */
@Controller()
export class CompanyVerificationIssuedSubscriber {
  private readonly logger = new Logger(
    CompanyVerificationIssuedSubscriber.name,
  );

  constructor(
    @Inject(COMPANY_COMMAND_SERVICE)
    private readonly companyCommandService: ICompanyCommandService,
  ) {}

  @EventPattern(COMPANY_VERIFICATIONS_TOPIC)
  async handle(@Payload() message: unknown): Promise<void> {
    const event = this.read(message);
    if (!event) return;
    const { data } = event;
    try {
      const company = await this.companyCommandService.handleRecordVerification(
        new RecordCompanyVerificationCommand(data.companyId, {
          requestId: data.requestId,
          verificationId: data.verificationId,
          decision: data.decision,
          checks: data.checks ?? [],
          reasonCodes: data.reasonCodes ?? [],
          fieldErrors: data.fieldErrors ?? [],
          evidence: data.evidence ?? [],
          demo: data.demo === true,
          decidedAt: new Date(data.decidedAt),
        }),
      );
      if (company) {
        this.logger.log(
          `KYC de la empresa ${data.companyId}: ${data.decision}${data.demo ? ' (demo)' : ''}`,
        );
      } else {
        this.logger.warn(
          `Decisión ${data.verificationId} ignorada: la solicitud ${data.requestId} ya no está en revisión`,
        );
      }
    } catch (error) {
      this.logger.error(
        `No se pudo guardar la decisión ${data.verificationId}: ${(error as Error).message}`,
      );
    }
  }

  private read(message: unknown): CompanyVerificationIssuedEvent | null {
    // NestJS a veces entrega el JSON de Kafka dentro de "value".
    const raw =
      message && typeof message === 'object' && 'value' in message
        ? (message as { value: unknown }).value
        : message;
    const event = raw as Partial<CompanyVerificationIssuedEvent> | null;
    if (
      !event ||
      event.eventType !== 'CompanyVerificationIssued' ||
      event.schemaVersion !== SCHEMA_VERSION ||
      !event.data?.companyId ||
      !event.data.requestId ||
      !DECISIONS.includes(event.data.decision)
    ) {
      this.logger.warn(
        `Mensaje de ${COMPANY_VERIFICATIONS_TOPIC} ignorado: no es un CompanyVerificationIssued v1`,
      );
      return null;
    }
    return event as CompanyVerificationIssuedEvent;
  }
}
