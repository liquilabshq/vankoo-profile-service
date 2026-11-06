import { UserRegisteredSubscriber } from './user-registered.subscriber';
import type { IInvestorCommandService } from '../../domain/services/investor-command.service';
import type { ICompanyCommandService } from '../../domain/services/company-command.service';

/** @author LiquiLabs */
describe('UserRegisteredSubscriber', () => {
  const USER = {
    id: '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10',
    email: 'mype@vankoo.test',
  };

  let handleCreateInvestor: jest.Mock;
  let handleCreateCompany: jest.Mock;
  let subscriber: UserRegisteredSubscriber;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    handleCreateInvestor = jest.fn().mockResolvedValue(undefined);
    handleCreateCompany = jest.fn().mockResolvedValue(undefined);
    subscriber = new UserRegisteredSubscriber(
      { handleCreateInvestor } as unknown as IInvestorCommandService,
      { handleCreateCompany } as unknown as ICompanyCommandService,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('crea la empresa de un usuario MYPE', async () => {
    await subscriber.handleUserRegisteredEvent({
      ...USER,
      roles: ['ROLE_MYPE'],
    });

    expect(handleCreateCompany).toHaveBeenCalledTimes(1);
    expect(handleCreateInvestor).not.toHaveBeenCalled();
  });

  it('crea el inversor aunque el evento llegue envuelto en "value"', async () => {
    await subscriber.handleUserRegisteredEvent({
      value: { ...USER, roles: ['ROLE_INVESTOR'] },
    });

    expect(handleCreateInvestor).toHaveBeenCalledTimes(1);
    expect(handleCreateCompany).not.toHaveBeenCalled();
  });

  it('ignora el evento si no trae roles conocidos', async () => {
    await subscriber.handleUserRegisteredEvent({ ...USER });

    expect(handleCreateInvestor).not.toHaveBeenCalled();
    expect(handleCreateCompany).not.toHaveBeenCalled();
  });

  it('no propaga el error si falla la creación', async () => {
    handleCreateCompany.mockRejectedValue(new Error('db caída'));

    await expect(
      subscriber.handleUserRegisteredEvent({ ...USER, roles: ['ROLE_MYPE'] }),
    ).resolves.toBeUndefined();
  });
});
