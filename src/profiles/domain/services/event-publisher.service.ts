/** @author LiquiLabs */
export const EVENT_PUBLISHER_SERVICE = 'EVENT_PUBLISHER_SERVICE';

export interface IEventPublisherService {
  publish(topic: string, payload: Record<string, unknown>): Promise<void>;
}
