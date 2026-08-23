import { CompanyQueryServiceImpl } from './company-query.service.impl';
import { Company } from '../../../domain/model/aggregates/company.aggregate';
import { CompanyId } from '../../../domain/model/valueobjects/company-id.vo';
import { UserId } from '../../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../../domain/model/valueobjects/email.vo';
import type { ICompanyRepository } from '../../../domain/repositories/company.repository';
import { GetCompanyByIdQuery } from '../../../domain/model/queries/get-company-by-id.query';

describe('CompanyQueryServiceImpl', () => {
  let companyRepository: jest.Mocked<ICompanyRepository>;
  let service: CompanyQueryServiceImpl;

  beforeEach(() => {
    companyRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    service = new CompanyQueryServiceImpl(companyRepository);
  });

  describe('handleGetCompanyById', () => {
    it('delegates to the repository and returns the found company', async () => {
      // Arrange
      const company = new Company(
        new CompanyId('company-1'),
        new UserId('user-1'),
        new Email('contact@vankoo.com'),
      );
      companyRepository.findById.mockResolvedValue(company);

      // Act
      const result = await service.handleGetCompanyById(
        new GetCompanyByIdQuery('company-1'),
      );

      // Assert
      expect(companyRepository.findById).toHaveBeenCalledWith('company-1');
      expect(result).toBe(company);
    });

    it('returns null when the company does not exist', async () => {
      // Arrange
      companyRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.handleGetCompanyById(
        new GetCompanyByIdQuery('missing-id'),
      );

      // Assert
      expect(result).toBeNull();
    });
  });
});
