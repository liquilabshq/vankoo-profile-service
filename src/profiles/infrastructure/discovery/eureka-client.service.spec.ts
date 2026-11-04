import { ConfigService } from '@nestjs/config';
import { EurekaClientService } from './eureka-client.service';

const mockStart = jest.fn();
const mockStop = jest.fn();

jest.mock('eureka-js-client', () => ({
  Eureka: jest.fn().mockImplementation(() => ({
    start: mockStart,
    stop: mockStop,
  })),
}));

/** @author LiquiLabs */
describe('EurekaClientService', () => {
  beforeEach(() => {
    mockStart.mockReset();
    mockStop.mockReset();
  });

  it('no se registra con EUREKA_ENABLED=false', async () => {
    const service = new EurekaClientService(
      new ConfigService({ EUREKA_ENABLED: 'false' }),
    );

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(mockStart).not.toHaveBeenCalled();
    expect(mockStop).not.toHaveBeenCalled();
  });

  it('se registra por defecto', async () => {
    mockStart.mockImplementation((callback: (error?: Error) => void) =>
      callback(),
    );
    const service = new EurekaClientService(new ConfigService({}));

    await service.onModuleInit();

    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});
