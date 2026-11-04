import { ConfigService } from '@nestjs/config';
import { KafkaConfig, SASLOptions } from 'kafkajs';

const SUPPORTED_SASL_MECHANISMS = ['plain', 'scram-sha-256', 'scram-sha-512'];

/**
 * @author LiquiLabs
 * @summary Indica si el servicio debe conectarse a Kafka (KAFKA_ENABLED, true por defecto).
 * Con false no se conecta ni el consumidor ni el productor: sirve para entornos sin broker,
 * como Azure mientras no exista el Event Hub. Los eventos salientes solo se registran en el log.
 */
export function isKafkaEnabled(configService: ConfigService): boolean {
  const value = configService.get<string>('KAFKA_ENABLED') ?? 'true';
  return value.trim().toLowerCase() !== 'false';
}

/**
 * @author LiquiLabs
 * @summary Configuración de kafkajs compartida por el consumidor (main.ts) y el productor.
 * Sin KAFKA_SSL ni KAFKA_SASL_* se conecta a un Kafka normal (el del compose); con ellos,
 * a un broker gestionado como Azure Event Hubs (SASL_SSL con mecanismo plain).
 */
export function buildKafkaConfig(
  configService: ConfigService,
  clientId: string,
): KafkaConfig {
  // Admite varios brokers separados por comas.
  const brokers = (
    configService.get<string>('KAFKA_BROKERS') || 'localhost:9092'
  )
    .split(',')
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0);

  const ssl =
    (configService.get<string>('KAFKA_SSL') ?? 'false').trim().toLowerCase() ===
    'true';

  const config: KafkaConfig = { clientId, brokers, ssl };

  const username = configService.get<string>('KAFKA_SASL_USERNAME');
  const password = configService.get<string>('KAFKA_SASL_PASSWORD');
  if (username && password) {
    const mechanism = (
      configService.get<string>('KAFKA_SASL_MECHANISM') || 'plain'
    )
      .trim()
      .toLowerCase();

    if (!SUPPORTED_SASL_MECHANISMS.includes(mechanism)) {
      throw new Error(
        `KAFKA_SASL_MECHANISM no soportado: "${mechanism}". Usa uno de: ${SUPPORTED_SASL_MECHANISMS.join(', ')}`,
      );
    }

    config.sasl = { mechanism, username, password } as SASLOptions;
  }

  return config;
}
