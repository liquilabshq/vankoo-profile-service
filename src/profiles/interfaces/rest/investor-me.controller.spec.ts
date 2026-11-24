/* eslint-disable @typescript-eslint/unbound-method -- expect(mock.method) on jest mocks */
import type { Response } from 'express';
import { InvestorMeController } from './investor-me.controller';
import { Investor } from '../../domain/model/aggregates/investor.aggregate';
import { InvestorId } from '../../domain/model/valueobjects/investor-id.vo';
import { UserId } from '../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../domain/model/valueobjects/email.vo';
import { DocumentUrl } from '../../domain/model/valueobjects/document-url.vo';
import { IInvestorCommandService } from '../../domain/services/investor-command.service';
import { IInvestorQueryService } from '../../domain/services/investor-query.service';

const USER_ID = '7a1e2b3a-1111-4222-8333-444455556666';
const INVESTOR_ID = '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10';

const PROFILE = {
  dni: '44556677',
  firstName: 'Andrés',
  lastName: 'Mendoza',
  contactPhone: '+51 988776655',
  billingAddress: {
    street: 'Calle Los Pinos 456',
    city: 'Lima',
    state: 'Lima',
    postalCode: '15074',
    country: 'Perú',
  },
};

function response() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

function shell(): Investor {
  return new Investor(
    new InvestorId(INVESTOR_ID),
    new UserId(USER_ID),
    new Email('inversor@vankoo.test'),
  );
}

function setUp(
  investor: Investor | null,
  commands: Partial<IInvestorCommandService> = {},
) {
  const queries: jest.Mocked<IInvestorQueryService> = {
    handleGetInvestorById: jest.fn(),
    handleGetInvestorByUserId: jest.fn().mockResolvedValue(investor),
  };
  const subject = new InvestorMeController(
    commands as IInvestorCommandService,
    queries,
  );
  return { subject, queries };
}

describe('InvestorMeController', () => {
  it('returns the caller investor, found by the user id of the token', async () => {
    const { subject, queries } = setUp(shell());
    const res = response();

    await subject.getMine(USER_ID, res as unknown as Response);

    expect(queries.handleGetInvestorByUserId).toHaveBeenCalledWith({
      userId: USER_ID,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: INVESTOR_ID,
        contactEmail: 'inversor@vankoo.test',
        profileComplete: false,
        kycStatus: 'PENDING',
      }),
    );
  });

  it('answers 401 without X-User-Id and 404 without an investor', async () => {
    const missing = response();
    await setUp(null).subject.getMine(
      undefined,
      missing as unknown as Response,
    );
    expect(missing.status).toHaveBeenCalledWith(401);

    const blank = response();
    await setUp(null).subject.getMine('  ', blank as unknown as Response);
    expect(blank.status).toHaveBeenCalledWith(401);

    const other = response();
    await setUp(null).subject.getMine(USER_ID, other as unknown as Response);
    expect(other.status).toHaveBeenCalledWith(404);
  });

  it('refuses the profile until the DNI photo is uploaded', async () => {
    const complete = jest.fn();
    const { subject } = setUp(shell(), { handleCompleteProfile: complete });
    const res = response();

    await subject.submitProfile(USER_ID, PROFILE, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(complete).not.toHaveBeenCalled();
  });

  it('completes the profile of the caller, never of an id from the URL', async () => {
    const investor = shell();
    investor.updateDniDocument(new DocumentUrl('http://storage/dni.jpg'));
    const complete = jest.fn().mockImplementation(() => {
      investor.completeProfile(
        PROFILE.dni,
        PROFILE.firstName,
        PROFILE.lastName,
        PROFILE.contactPhone,
        PROFILE.billingAddress,
      );
      return Promise.resolve(investor);
    });
    const { subject } = setUp(investor, { handleCompleteProfile: complete });
    const res = response();

    await subject.submitProfile(USER_ID, PROFILE, res as unknown as Response);

    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({ investorId: INVESTOR_ID, dni: '44556677' }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        profileComplete: true,
        firstName: 'Andrés',
        lastName: 'Mendoza',
        billingAddress: PROFILE.billingAddress,
        dniDocumentUrl: 'http://storage/dni.jpg',
      }),
    );
  });

  it('asks for the DNI upload URL with the caller investor id', async () => {
    const request = jest.fn().mockResolvedValue({
      uploadUrl: 'http://storage/put',
      fileUrl: 'http://storage/dni.jpg',
      expiresInSeconds: 300,
    });
    const { subject } = setUp(shell(), { handleRequestDniUploadUrl: request });
    const res = response();

    await subject.requestDniUploadUrl(
      USER_ID,
      { contentType: 'image/jpeg' },
      res as unknown as Response,
    );

    expect(request).toHaveBeenCalledWith({
      investorId: INVESTOR_ID,
      contentType: 'image/jpeg',
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ fileUrl: 'http://storage/dni.jpg' }),
    );
  });

  it('records the uploaded DNI photo on the caller investor', async () => {
    const investor = shell();
    const upload = jest.fn().mockImplementation(() => {
      investor.updateDniDocument(new DocumentUrl('http://storage/dni.jpg'));
      return Promise.resolve(investor);
    });
    const { subject } = setUp(investor, { handleUploadDni: upload });
    const res = response();

    await subject.uploadDni(
      USER_ID,
      { dniDocumentUrl: 'http://storage/dni.jpg' },
      res as unknown as Response,
    );

    expect(upload).toHaveBeenCalledWith({
      investorId: INVESTOR_ID,
      dniDocumentUrl: 'http://storage/dni.jpg',
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ dniDocumentUrl: 'http://storage/dni.jpg' }),
    );
  });

  it('turns a resolved KYC into a 400 instead of rewriting the DNI', async () => {
    const investor = shell();
    investor.updateDniDocument(new DocumentUrl('http://storage/dni.jpg'));
    investor.verifyKyc();
    const complete = jest.fn().mockImplementation(() => {
      investor.completeProfile(
        PROFILE.dni,
        PROFILE.firstName,
        PROFILE.lastName,
        PROFILE.contactPhone,
        PROFILE.billingAddress,
      );
      return Promise.resolve(investor);
    });
    const { subject } = setUp(investor, { handleCompleteProfile: complete });
    const res = response();

    await subject.submitProfile(USER_ID, PROFILE, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(investor.dni).toBeUndefined();
  });
});
