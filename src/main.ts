import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  const logger = new Logger('NestApplication');
  await app.listen(port);
  logger.log(`Vankoo Profile Service is running on: http://localhost:${port}`);
}
bootstrap();
