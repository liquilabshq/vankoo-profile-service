import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

/** Ruta del documento OpenAPI; el gateway la lee en `/profile/openapi/v1.json`. */
export const OPENAPI_PATH = '/openapi/v1.json';

/** Nombre del esquema de seguridad Bearer (JWT de IAM) en el documento. */
export const BEARER_AUTH = 'bearerAuth';

/**
 * @author LiquiLabs
 * @summary Cabecera del documento OpenAPI de Profile (info, servers y seguridad).
 *
 * Los servers son URLs absolutas para que el "Send" de Scalar funcione igual desde el
 * Scalar agregado del gateway que desde el propio del servicio (/reference). El primero
 * es el API Gateway, por donde entran las peticiones reales: valida el JWT y pone
 * X-User-Id. Las rutas del documento ya llevan el prefijo /api/v1.
 */
export function createOpenApiConfig(
  configService: ConfigService,
  port: number,
): Omit<OpenAPIObject, 'paths'> {
  const gatewayUrl =
    configService.get<string>('DOCUMENTATION_GATEWAY_URL') ||
    'http://localhost:8080/profile';
  const serverUrl =
    configService.get<string>('DOCUMENTATION_SERVER_URL') ||
    `http://localhost:${port}`;

  return new DocumentBuilder()
    .setTitle('Vankoo Profile Service')
    .setDescription(
      'Microservicio de gestión de perfiles para la plataforma Vankoo',
    )
    .setVersion('1.0')
    .addServer(gatewayUrl, 'A través del API Gateway (valida el JWT)')
    .addServer(serverUrl, 'Directo al servicio (sin gateway: X-User-Id a mano)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT de IAM. Lo valida el API Gateway, que reenvía X-User-Id',
      },
      BEARER_AUTH,
    )
    .build();
}
