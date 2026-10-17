import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { COMPANY_COMMAND_SERVICE } from '../../domain/services/company-command.service';
import type { ICompanyCommandService } from '../../domain/services/company-command.service';
import { RecordSustainabilityDecisionCommand } from '../../domain/model/commands/record-sustainability-decision.command';
import { SustainabilityCriterion } from '../../domain/model/valueobjects/sustainability-certification.vo';

const GREEN_CERTIFICATIONS_TOPIC = 'risk.green-certifications.v1';
const SCHEMA_VERSION = 1;

interface GreenCertificationIssuedData {
  certificationId: string;
  submissionId: string;
  companyId: string;
  decision: 'GREEN' | 'NOT_GREEN';
  standard: string | null;
  issuer: string | null;
  validUntil: string | null;
  criteria: SustainabilityCriterion[];
  reasonCodes: string[];
  decidedAt: string;
}

interface GreenCertificationIssuedEvent {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  data: GreenCertificationIssuedData;
}

/**
 * @author LiquiLabs
 * @summary Guarda la decisión del risk-service sobre el certificado verde de una empresa.
 *
 * Contrato: docs/contracts/green-certifications/v1 en vankoo-risk-service. Aplicar dos
 * veces la misma decisión no cambia nada, así que un mensaje repetido es inofensivo; y
 * una decisión sobre una subida anterior se ignora.
 */
@Controller()
export class GreenCertificationIssuedSubscriber {
  private readonly logger = new Logger(GreenCertificationIssuedSubscriber.name);

  constructor(
    @Inject(COMPANY_COMMAND_SERVICE)
    private readonly companyCommandService: ICompanyCommandService,
  ) {}

  @EventPattern(GREEN_CERTIFICATIONS_TOPIC)
  async handle(@Payload() message: unknown): Promise<void> {
    const event = this.read(message);
    if (!event) return;
    const { data } = event;
    try {
      const company =
        await this.companyCommandService.handleRecordSustainabilityDecision(
          new RecordSustainabilityDecisionCommand(data.companyId, {
            submissionId: data.submissionId,
            certificationId: data.certificationId,
            green: data.decision === 'GREEN',
            standard: data.standard,
            issuer: data.issuer,
            validUntil: data.validUntil,
            criteria: data.criteria ?? [],
            reasonCodes: data.reasonCodes ?? [],
            decidedAt: new Date(data.decidedAt),
          }),
        );
      if (company) {
        this.logger.log(
          `Certificado de la empresa ${data.companyId}: ${data.decision}`,
        );
      } else {
        this.logger.warn(
          `Decisión ${data.certificationId} ignorada: la subida ${data.submissionId} ya no es la vigente`,
        );
      }
    } catch (error) {
      this.logger.error(
        `No se pudo guardar la decisión ${data.certificationId}: ${(error as Error).message}`,
      );
    }
  }

  private read(message: unknown): GreenCertificationIssuedEvent | null {
    // NestJS a veces entrega el JSON de Kafka dentro de "value".
    const raw =
      message && typeof message === 'object' && 'value' in message
        ? (message as { value: unknown }).value
        : message;
    const event = raw as Partial<GreenCertificationIssuedEvent> | null;
    if (
      !event ||
      event.eventType !== 'GreenCertificationIssued' ||
      event.schemaVersion !== SCHEMA_VERSION ||
      !event.data?.companyId ||
      !event.data.submissionId
    ) {
      this.logger.warn(
        `Mensaje de ${GREEN_CERTIFICATIONS_TOPIC} ignorado: no es un GreenCertificationIssued v1`,
      );
      return null;
    }
    return event as GreenCertificationIssuedEvent;
  }
}
