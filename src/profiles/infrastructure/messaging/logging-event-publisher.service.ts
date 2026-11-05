import { Injectable, Logger } from '@nestjs/common';
import { IEventPublisherService } from '../../domain/services/event-publisher.service';

/**
 * @author LiquiLabs
 * @summary Publicador de eventos sin broker: solo registra en el log lo que se habría publicado.
 * Lo usa MessagingModule cuando KAFKA_ENABLED=false (p. ej. en Azure mientras no haya Event Hub).
 */
@Injectable()
export class LoggingEventPublisherService implements IEventPublisherService {
  private readonly logger = new Logger(LoggingEventPublisherService.name);

  publish(
    topic: string,
    payload: Record<string, unknown>,
    key?: string,
  ): Promise<void> {
    this.logger.warn(
      `Kafka desactivado (KAFKA_ENABLED=false): el evento del tópico "${topic}" no se publica` +
        (key ? ` (clave ${key})` : '') +
        `. Payload: ${JSON.stringify(payload)}`,
    );
    return Promise.resolve();
  }
}
