import { ConfigService } from '@nestjs/config';
import { BEARER_AUTH, createOpenApiConfig } from './openapi.config';

/** @author LiquiLabs */
describe('createOpenApiConfig', () => {
  it('usa el gateway y el servicio locales por defecto', () => {
    const config = createOpenApiConfig(new ConfigService({}), 3000);

    expect(config.servers?.map((server) => server.url)).toEqual([
      'http://localhost:8080/profile',
      'http://localhost:3000',
    ]);
  });

  it('toma las URLs de los servers de DOCUMENTATION_*', () => {
    const config = createOpenApiConfig(
      new ConfigService({
        DOCUMENTATION_GATEWAY_URL: 'https://gateway.example/profile',
        DOCUMENTATION_SERVER_URL: 'https://profile.internal.example',
      }),
      3000,
    );

    expect(config.servers?.map((server) => server.url)).toEqual([
      'https://gateway.example/profile',
      'https://profile.internal.example',
    ]);
  });

  it('declara el esquema Bearer del JWT de IAM', () => {
    const config = createOpenApiConfig(new ConfigService({}), 3000);

    expect(config.components?.securitySchemes?.[BEARER_AUTH]).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
  });
});
