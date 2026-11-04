import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EVENT_PUBLISHER_SERVICE } from '../../domain/services/event-publisher.service';
import { MessagingModule } from './messaging.module';
import { LoggingEventPublisherService } from './logging-event-publisher.service';
import { KafkaEventPublisherService } from './kafka-event-publisher.service';

/** @author LiquiLabs */
async function resolvePublisher(env: Record<string, string>) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [() => env],
      }),
      MessagingModule,
    ],
  }).compile();

  return moduleRef.get<unknown>(EVENT_PUBLISHER_SERVICE);
}

describe('MessagingModule', () => {
  const originalKafkaEnabled = process.env.KAFKA_ENABLED;

  beforeEach(() => {
    delete process.env.KAFKA_ENABLED;
  });

  afterAll(() => {
    if (originalKafkaEnabled === undefined) delete process.env.KAFKA_ENABLED;
    else process.env.KAFKA_ENABLED = originalKafkaEnabled;
  });

  it('usa el publicador de log con KAFKA_ENABLED=false', async () => {
    const publisher = await resolvePublisher({ KAFKA_ENABLED: 'false' });

    expect(publisher).toBeInstanceOf(LoggingEventPublisherService);
  });

  it('usa el publicador de Kafka por defecto', async () => {
    // compile() no ejecuta onModuleInit, así que no intenta conectarse al broker.
    const publisher = await resolvePublisher({});

    expect(publisher).toBeInstanceOf(KafkaEventPublisherService);
  });
});

describe('LoggingEventPublisherService', () => {
  it('no falla al publicar: solo registra el evento', async () => {
    const publisher = new LoggingEventPublisherService();

    await expect(
      publisher.publish('vankoo.profile.events', { id: '1' }, 'key'),
    ).resolves.toBeUndefined();
  });
});
