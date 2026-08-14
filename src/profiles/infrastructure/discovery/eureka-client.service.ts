import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Eureka } from 'eureka-js-client';

/**
 * @author LiquiLabs
 * @summary Registra el servicio en el Discovery Server (Eureka) para que sea descubierto por el resto del ecosistema Vankoo.
 */
@Injectable()
export class EurekaClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EurekaClientService.name);
  private readonly client: Eureka;

  constructor(private readonly configService: ConfigService) {
    const port = this.configService.get<number>('PORT') || 3000;
    const hostName =
      this.configService.get<string>('INSTANCE_HOSTNAME') || 'localhost';
    const eurekaHost =
      this.configService.get<string>('EUREKA_HOST') || 'localhost';
    const eurekaPort = this.configService.get<number>('EUREKA_PORT') || 8761;

    this.client = new Eureka({
      instance: {
        app: 'profile-service',
        hostName,
        ipAddr: hostName,
        port: { $: port, '@enabled': 'true' },
        vipAddress: 'profile-service',
        statusPageUrl: `http://${hostName}:${port}/`,
        healthCheckUrl: `http://${hostName}:${port}/`,
        dataCenterInfo: {
          '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          name: 'MyOwn',
        },
      },
      eureka: {
        host: eurekaHost,
        port: eurekaPort,
        servicePath: '/eureka/apps/',
      },
    });
  }

  async onModuleInit(): Promise<void> {
    return new Promise((resolve) => {
      this.client.start((error) => {
        if (error) {
          this.logger.error(
            `No se pudo registrar en el Discovery Server: ${error.message}`,
          );
        } else {
          this.logger.log('✅ Registrado en el Discovery Server (Eureka)');
        }
        resolve();
      });
    });
  }

  async onModuleDestroy(): Promise<void> {
    return new Promise((resolve) => {
      this.client.stop(() => resolve());
    });
  }
}
