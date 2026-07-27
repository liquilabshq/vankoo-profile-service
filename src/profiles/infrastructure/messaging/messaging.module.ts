import { Module } from '@nestjs/common';
import { EVENT_PUBLISHER_SERVICE } from '../../domain/services/event-publisher.service';
import { KafkaEventPublisherService } from './kafka-event-publisher.service';

/**
 * @author LiquiLabs
 * @summary Módulo de infraestructura compartido que expone el publicador de eventos de dominio.
 */
@Module({
  providers: [
    { provide: EVENT_PUBLISHER_SERVICE, useClass: KafkaEventPublisherService },
  ],
  exports: [EVENT_PUBLISHER_SERVICE],
})
export class MessagingModule {}
