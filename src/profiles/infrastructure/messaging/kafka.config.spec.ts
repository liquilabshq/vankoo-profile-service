import { ConfigService } from '@nestjs/config';
import { buildKafkaConfig, isKafkaEnabled } from './kafka.config';

/** @author LiquiLabs */
function configWith(values: Record<string, string>): ConfigService {
  return new ConfigService(values);
}

describe('isKafkaEnabled', () => {
  it('está activo por defecto, para no cambiar el comportamiento en local', () => {
    expect(isKafkaEnabled(configWith({}))).toBe(true);
  });

  it('se desactiva con KAFKA_ENABLED=false, sin importar mayúsculas ni espacios', () => {
    expect(isKafkaEnabled(configWith({ KAFKA_ENABLED: ' FALSE ' }))).toBe(
      false,
    );
  });

  it('sigue activo con KAFKA_ENABLED=true', () => {
    expect(isKafkaEnabled(configWith({ KAFKA_ENABLED: 'true' }))).toBe(true);
  });
});

describe('buildKafkaConfig', () => {
  it('usa localhost:9092 sin SSL ni SASL cuando no hay variables', () => {
    const config = buildKafkaConfig(configWith({}), 'client');

    expect(config).toEqual({
      clientId: 'client',
      brokers: ['localhost:9092'],
      ssl: false,
    });
  });

  it('separa los brokers por comas', () => {
    const config = buildKafkaConfig(
      configWith({ KAFKA_BROKERS: 'kafka-1:9092, kafka-2:9092,' }),
      'client',
    );

    expect(config.brokers).toEqual(['kafka-1:9092', 'kafka-2:9092']);
  });

  it('configura SASL_SSL para Azure Event Hubs', () => {
    const config = buildKafkaConfig(
      configWith({
        KAFKA_BROKERS: 'vankoo.servicebus.windows.net:9093',
        KAFKA_SSL: 'true',
        KAFKA_SASL_USERNAME: '$ConnectionString',
        KAFKA_SASL_PASSWORD: 'Endpoint=sb://vankoo/;SharedAccessKey=x',
      }),
      'client',
    );

    expect(config.ssl).toBe(true);
    expect(config.sasl).toEqual({
      mechanism: 'plain',
      username: '$ConnectionString',
      password: 'Endpoint=sb://vankoo/;SharedAccessKey=x',
    });
  });

  it('no configura SASL si falta la contraseña', () => {
    const config = buildKafkaConfig(
      configWith({ KAFKA_SASL_USERNAME: 'user' }),
      'client',
    );

    expect(config.sasl).toBeUndefined();
  });

  it('rechaza un mecanismo SASL no soportado', () => {
    expect(() =>
      buildKafkaConfig(
        configWith({
          KAFKA_SASL_USERNAME: 'user',
          KAFKA_SASL_PASSWORD: 'pass',
          KAFKA_SASL_MECHANISM: 'oauthbearer',
        }),
        'client',
      ),
    ).toThrow('KAFKA_SASL_MECHANISM no soportado');
  });
});
