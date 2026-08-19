import { Module } from '@nestjs/common';
import { EurekaClientService } from './eureka-client.service';

/**
 * @author LiquiLabs
 * @summary Módulo de infraestructura que registra el servicio en el Discovery Server (Eureka).
 */
@Module({
  providers: [EurekaClientService],
})
export class DiscoveryModule {}
