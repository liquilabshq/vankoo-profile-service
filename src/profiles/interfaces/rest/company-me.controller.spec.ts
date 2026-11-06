/* eslint-disable @typescript-eslint/unbound-method -- expect(mock.method) on jest mocks */
import type { Response } from 'express';
import { CompanyMeController } from './company-me.controller';
import { Company } from '../../domain/model/aggregates/company.aggregate';
import { CompanyId } from '../../domain/model/valueobjects/company-id.vo';
import { UserId } from '../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../domain/model/valueobjects/email.vo';
import { ICompanyCommandService } from '../../domain/services/company-command.service';
import { ICompanyQueryService } from '../../domain/services/company-query.service';

const USER_ID = '7a1e2b3a-1111-4222-8333-444455556666';

function response() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

function controller(company: Company | null) {
  const queries: jest.Mocked<ICompanyQueryService> = {
    handleGetCompanyById: jest.fn(),
    handleGetCompanyByUserId: jest.fn().mockResolvedValue(company),
  };
  return {
    controller: new CompanyMeController({} as ICompanyCommandService, queries),
    queries,
  };
}

describe('CompanyMeController', () => {
  it('returns the caller company, found by the user id of the token', async () => {
    const company = new Company(
      new CompanyId('0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10'),
      new UserId(USER_ID),
      new Email('mype@vankoo.test'),
    );
    const { controller: subject, queries } = controller(company);
    const res = response();

    await subject.getMine(USER_ID, res as unknown as Response);

    expect(queries.handleGetCompanyByUserId).toHaveBeenCalledWith({
      userId: USER_ID,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10',
        contactEmail: 'mype@vankoo.test',
        profileComplete: false,
        sustainability: expect.objectContaining({ status: 'NONE' }) as unknown,
        kyc: expect.objectContaining({
          status: 'PENDING',
          demo: false,
          attempts: 0,
          fieldErrors: [],
        }) as unknown,
      }),
    );
  });

  it('answers 401 without X-User-Id and 404 without a company', async () => {
    const res = response();
    await controller(null).controller.getMine(
      undefined,
      res as unknown as Response,
    );
    expect(res.status).toHaveBeenCalledWith(401);

    const other = response();
    await controller(null).controller.getMine(
      USER_ID,
      other as unknown as Response,
    );
    expect(other.status).toHaveBeenCalledWith(404);
  });

  it('sends the profile with its ficha RUC for verification', async () => {
    const company = new Company(
      new CompanyId('0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10'),
      new UserId(USER_ID),
      new Email('mype@vankoo.test'),
    );
    const submit = jest.fn().mockResolvedValue(company);
    const queries = {
      handleGetCompanyById: jest.fn(),
      handleGetCompanyByUserId: jest.fn().mockResolvedValue(company),
    };
    const subject = new CompanyMeController(
      {
        handleSubmitForVerification: submit,
      } as unknown as ICompanyCommandService,
      queries,
    );
    const res = response();
    const legalAddress = {
      street: 'Av. 1',
      city: 'Lima',
      state: 'Lima',
      postalCode: '15001',
      country: 'Perú',
    };

    await subject.submitProfile(
      USER_ID,
      {
        rucNumber: '20601234567',
        businessName: 'Textiles Andinos S.A.C.',
        industrySector: 'MANUFACTURING',
        contactPhone: '+51 987654321',
        legalAddress,
        rucDocumentUrl: 'http://storage/ficha.pdf',
      },
      res as unknown as Response,
    );

    expect(submit).toHaveBeenCalledWith({
      companyId: '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10',
      data: expect.objectContaining({
        rucNumber: '20601234567',
        legalAddress,
      }) as unknown,
      rucDocumentUrl: 'http://storage/ficha.pdf',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('answers 400 with the reason when the profile cannot be sent', async () => {
    const company = new Company(
      new CompanyId('0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10'),
      new UserId(USER_ID),
      new Email('mype@vankoo.test'),
    );
    const subject = new CompanyMeController(
      {
        handleUpdateContact: jest
          .fn()
          .mockRejectedValue(
            new Error(
              'Solo una empresa verificada puede editar sus datos de contacto.',
            ),
          ),
      } as unknown as ICompanyCommandService,
      {
        handleGetCompanyById: jest.fn(),
        handleGetCompanyByUserId: jest.fn().mockResolvedValue(company),
      },
    );
    const res = response();

    await subject.updateContact(
      USER_ID,
      {
        industrySector: 'RETAIL',
        contactPhone: '+51 911111111',
        legalAddress: {
          street: 'Av. 1',
          city: 'Lima',
          state: 'Lima',
          postalCode: '15001',
          country: 'Perú',
        },
      },
      res as unknown as Response,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        'Solo una empresa verificada puede editar sus datos de contacto.',
    });
  });
});
