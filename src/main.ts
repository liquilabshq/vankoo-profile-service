import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('NestApplication');

  // Extraemos el servicio de configuración de forma nativa en NestJS
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const kafkaBrokers =
    configService.get<string>('KAFKA_BROKERS') || 'localhost:9092';

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

  // 3. Configurar Swagger (OpenAPI)
  const config = new DocumentBuilder()
    .setTitle('Vankoo Profile Service')
    .setDescription(
      'Microservicio de gestión de perfiles para la plataforma Vankoo',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // 4. Integrar Scalar
  app.use(
    '/reference',
    apiReference({
      spec: { content: document },
      theme: 'purple',
    } as any),
  );

  // 🚨 5. CONFIGURACIÓN DE KAFKA SEGURA 🚨
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [kafkaBrokers], // 👈 Usamos la variable extraída arriba
      },
      consumer: {
        groupId: 'profile-service-consumer',
      },
    },
  });

  // 6. Arrancar ambos motores (Kafka y REST HTTP)
  await app.startAllMicroservices();
  await app.listen(port);

  logger.log(
    `🚀 Vankoo Profile Service is running on: http://localhost:${port}`,
  );
  logger.log(`📚 Documentación lista en: http://localhost:${port}/reference`);
  logger.log(`🎧 Conectado a Kafka en el broker: ${kafkaBrokers}`);
}
bootstrap();
