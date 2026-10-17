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
});
