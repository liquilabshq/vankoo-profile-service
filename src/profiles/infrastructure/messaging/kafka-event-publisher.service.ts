import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { IEventPublisherService } from '../../domain/services/event-publisher.service';

/**
 * @author LiquiLabs
 * @summary Adaptador de infraestructura que publica eventos de dominio en Kafka.
 */
@Injectable()
export class KafkaEventPublisherService
  implements IEventPublisherService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(KafkaEventPublisherService.name);
  private readonly producer: Producer;

  constructor(private readonly configService: ConfigService) {
    const brokers = [
      this.configService.get<string>('KAFKA_BROKERS') || 'localhost:9092',
    ];

    const kafka = new Kafka({
      clientId: 'profile-service-producer',
      brokers,
    });
    this.producer = kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(
    topic: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(payload) }],
      });
    } catch (error) {
      this.logger.error(
        `No se pudo publicar el evento en el tópico "${topic}": ${(error as Error).message}`,
      );
    }
  }
}
