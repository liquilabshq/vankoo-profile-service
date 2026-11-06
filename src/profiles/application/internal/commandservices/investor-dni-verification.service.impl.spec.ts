/* eslint-disable @typescript-eslint/unbound-method -- expect(mock.method) on jest mocks */
import { InvestorCommandServiceImpl } from './investor-command.service.impl';
import { Investor } from '../../../domain/model/aggregates/investor.aggregate';
import { InvestorId } from '../../../domain/model/valueobjects/investor-id.vo';
import { UserId } from '../../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../../domain/model/valueobjects/email.vo';
import { KycStatus } from '../../../domain/model/valueobjects/kyc-status.enum';
import { IInvestorRepository } from '../../../domain/repositories/investor.repository';
import { IFileStorageService } from '../../../domain/services/file-storage.service';
import { IEventPublisherService } from '../../../domain/services/event-publisher.service';
import {
  DniVerificationUnavailableError,
  IDniVerificationService,
} from '../../../domain/services/dni-verification.service';
import { CompleteInvestorProfileCommand } from '../../../domain/model/commands/complete-investor-profile.command';

const INVESTOR_ID = '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10';
const USER_ID = '7a1e2b3a-1111-4222-8333-444455556666';

const COMMAND = new CompleteInvestorProfileCommand(
  INVESTOR_ID,
  '12345678',
  'Juan Carlos',
  'Perez Gomez',
  '+51 987654321',
  {
    street: 'Av. 1',
    city: 'Lima',
    state: 'Lima',
    postalCode: '15001',
    country: 'Perú',
  },
);

function setUp(enabled = true) {
  const investor = new Investor(
    new InvestorId(INVESTOR_ID),
    new UserId(USER_ID),
    new Email('inversor@vankoo.test'),
  );
  const repository: jest.Mocked<IInvestorRepository> = {
    findById: jest.fn().mockResolvedValue(investor),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const storage = {} as jest.Mocked<IFileStorageService>;
  const publisher: jest.Mocked<IEventPublisherService> = {
    publish: jest.fn().mockResolvedValue(undefined),
  };
  const verification: jest.Mocked<IDniVerificationService> = {
    enabled,
    verify: jest.fn(),
  };
  const service = new InvestorCommandServiceImpl(
    repository,
    storage,
    publisher,
    verification,
  );
  return { investor, repository, publisher, verification, service };
}

/** La verificación corre en segundo plano: espera a que termine antes de afirmar. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('Verificación automática del DNI del inversor', () => {
  it('verifica el KYC cuando la función confirma el DNI', async () => {
    const { investor, verification, publisher, service } = setUp();
    verification.verify.mockResolvedValue({
      status: 'VERIFIED',
      source: 'eldni.com',
    });

    await service.handleCompleteProfile(COMMAND);
    await settle();

    expect(verification.verify).toHaveBeenCalledWith({
      investorId: INVESTOR_ID,
      dni: '12345678',
      firstName: 'Juan Carlos',
      lastName: 'Perez Gomez',
    });
    expect(investor.getKycStatus()).toBe(KycStatus.VERIFIED);
    expect(publisher.publish).toHaveBeenCalledWith(
      'vankoo.profile.events',
      expect.objectContaining({ eventType: 'KycVerified' }),
    );
  });

  it('rechaza el KYC cuando el nombre no coincide', async () => {
    const { investor, verification, service } = setUp();
    verification.verify.mockResolvedValue({
      status: 'NAME_MISMATCH',
      source: 'eldni.com',
    });

    await service.handleCompleteProfile(COMMAND);
    await settle();

    expect(investor.getKycStatus()).toBe(KycStatus.REJECTED);
    expect(investor.getKycRejectionReason()?.value).toContain('nombre');
  });

  it('rechaza el KYC cuando el DNI no existe', async () => {
    const { investor, verification, service } = setUp();
    verification.verify.mockResolvedValue({
      status: 'NOT_FOUND',
      source: 'eldni.com',
    });

    await service.handleCompleteProfile(COMMAND);
    await settle();

    expect(investor.getKycStatus()).toBe(KycStatus.REJECTED);
    expect(investor.getKycRejectionReason()?.value).toContain('no existe');
  });

  it('deja el KYC pendiente si la función no está disponible', async () => {
    const { investor, verification, service } = setUp();
    verification.verify.mockRejectedValue(
      new DniVerificationUnavailableError('502'),
    );

    await expect(service.handleCompleteProfile(COMMAND)).resolves.toBe(
      investor,
    );
    await settle();

    expect(investor.getKycStatus()).toBe(KycStatus.PENDING);
  });

  it('no llama a la función cuando está apagada', async () => {
    const { investor, verification, service } = setUp(false);

    await service.handleCompleteProfile(COMMAND);
    await settle();

    expect(verification.verify).not.toHaveBeenCalled();
    expect(investor.getKycStatus()).toBe(KycStatus.PENDING);
  });

  it('no vuelve a verificar un KYC que ya fue procesado', async () => {
    const { investor, verification, service } = setUp();
    investor.verifyKyc();

    await service.handleCompleteProfile(COMMAND);
    await settle();

    expect(verification.verify).not.toHaveBeenCalled();
  });

  it('responde sin esperar a la función', async () => {
    const { verification, service } = setUp();
    let release: () => void = () => undefined;
    verification.verify.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ status: 'VERIFIED', source: 'eldni.com' });
      }),
    );

    await expect(service.handleCompleteProfile(COMMAND)).resolves.toBeDefined();

    release();
    await settle();
  });
});
