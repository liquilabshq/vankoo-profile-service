import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  const logger = new Logger('NestApplication');

  // 1. Configurar prefijo global y Versionamiento (Para que las rutas sean /api/v1/...)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // Agrega la 'v1' automáticamente
  });

  // 2. Activar class-validator y class-transformer globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos basura que el cliente envíe
      forbidNonWhitelisted: true, // Lanza error 400 si envían campos no permitidos
      transform: true, // Transforma los payloads automáticamente
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

  // 4. Integrar Scalar (Documentación interactiva)
  app.use(
    '/reference',
    apiReference({
      spec: { content: document },
      theme: 'purple', // Tema de color para Scalar
    } as any),
  );

  await app.listen(port);
  logger.log(`Vankoo Profile Service is running on: http://localhost:${port}`);
  logger.log(`📚 Documentación lista en: http://localhost:${port}/reference`);
}
bootstrap();
