import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EVENT_PUBLISHER_SERVICE } from '../../domain/services/event-publisher.service';
import { KafkaEventPublisherService } from './kafka-event-publisher.service';
import { LoggingEventPublisherService } from './logging-event-publisher.service';
import { isKafkaEnabled } from './kafka.config';

/**
 * @author LiquiLabs
 * @summary Módulo de infraestructura compartido que expone el publicador de eventos de dominio.
 * Con KAFKA_ENABLED=false usa un publicador que solo escribe en el log, sin conectarse a ningún broker.
 */
@Module({
  providers: [
    {
      provide: EVENT_PUBLISHER_SERVICE,
      useFactory: (configService: ConfigService) =>
        isKafkaEnabled(configService)
          ? new KafkaEventPublisherService(configService)
          : new LoggingEventPublisherService(),
      inject: [ConfigService],
    },
  ],
  exports: [EVENT_PUBLISHER_SERVICE],
})
export class MessagingModule {}
