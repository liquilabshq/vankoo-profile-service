import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { apiReference } from '@scalar/nestjs-api-reference';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  buildKafkaConfig,
  isKafkaEnabled,
} from './profiles/infrastructure/messaging/kafka.config';
import {
  createOpenApiConfig,
  OPENAPI_PATH,
} from './documentation/openapi.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('NestApplication');

  // Habilita los hooks de ciclo de vida (OnModuleDestroy) ante SIGINT/SIGTERM,
  // necesario para que EurekaClientService se desregistre del Discovery Server al apagar el proceso.
  app.enableShutdownHooks();

  // Extraemos el servicio de configuración de forma nativa en NestJS
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const kafkaEnabled = isKafkaEnabled(configService);
  const kafkaConfig = buildKafkaConfig(configService, 'profile-service');

  // 1. Configurar prefijo global y Versionamiento
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 2. Activar class-validator y class-transformer globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 3. Configurar Swagger (OpenAPI). El documento se publica también como JSON en
  // /openapi/v1.json para que el Scalar agregado del gateway lo lea.
  const document = SwaggerModule.createDocument(
    app,
    createOpenApiConfig(configService, port),
  );
  app
    .getHttpAdapter()
    .get(OPENAPI_PATH, (_request: Request, response: Response) => {
      response.json(document);
    });

  // 4. Integrar Scalar
  app.use(
    '/reference',
    apiReference({
      spec: { content: document },
      theme: 'purple',
    } as any),
  );

  // 5. Consumidor de Kafka. Con KAFKA_ENABLED=false (entornos sin broker, como Azure
  // mientras no exista el Event Hub) no se conecta y el servicio solo expone la API REST.
  if (kafkaEnabled) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: kafkaConfig,
        consumer: {
          groupId: 'profile-service-consumer',
        },
      },
    });
  }

  // 6. Arrancar ambos motores (Kafka, si está activo, y REST HTTP)
  await app.startAllMicroservices();
  await app.listen(port);

  logger.log(
    `🚀 Vankoo Profile Service is running on: http://localhost:${port}`,
  );
  logger.log(`📚 Documentación lista en: http://localhost:${port}/reference`);
  if (kafkaEnabled) {
    const brokers = Array.isArray(kafkaConfig.brokers)
      ? kafkaConfig.brokers.join(', ')
      : '';
    logger.log(`🎧 Conectado a Kafka en el broker: ${brokers}`);
  } else {
    logger.warn(
      'Kafka desactivado (KAFKA_ENABLED=false): no se consumen ni publican eventos',
    );
  }
}
bootstrap();
