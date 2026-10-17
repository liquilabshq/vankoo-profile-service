/** @author LiquiLabs */
export const EVENT_PUBLISHER_SERVICE = 'EVENT_PUBLISHER_SERVICE';

export interface IEventPublisherService {
  /** key: clave del mensaje de Kafka; los mensajes con la misma clave conservan su orden. */
  publish(
    topic: string,
    payload: Record<string, unknown>,
    key?: string,
  ): Promise<void>;
}
