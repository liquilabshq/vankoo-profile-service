import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DNI_VERIFICATION_SERVICE } from '../../domain/services/dni-verification.service';
import { DisabledDniVerificationService } from './disabled-dni-verification.service';
import { HttpDniVerificationService } from './http-dni-verification.service';

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * @author LiquiLabs
 * @summary Módulo de infraestructura que expone la verificación automática del DNI del inversor.
 * Con DNI_VERIFICATION_ENABLED=true llama a la función serverless en DNI_VERIFICATION_URL;
 * en cualquier otro caso (default) queda apagada y el KYC sigue siendo manual.
 */
@Module({
  providers: [
    {
      provide: DNI_VERIFICATION_SERVICE,
      useFactory: (configService: ConfigService) => {
        const enabled =
          configService.get<string>('DNI_VERIFICATION_ENABLED') === 'true';
        const url = configService.get<string>('DNI_VERIFICATION_URL');
        if (!enabled || !url) {
          return new DisabledDniVerificationService();
        }
        return new HttpDniVerificationService(
          url,
          configService.get<string>('DNI_VERIFICATION_KEY') ?? '',
          Number(
            configService.get<string>('DNI_VERIFICATION_TIMEOUT_MS') ??
              DEFAULT_TIMEOUT_MS,
          ),
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: [DNI_VERIFICATION_SERVICE],
})
export class DniVerificationModule {}
