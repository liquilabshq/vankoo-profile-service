import { InvestorQueryServiceImpl } from './investor-query.service.impl';
import { Investor } from '../../../domain/model/aggregates/investor.aggregate';
import { InvestorId } from '../../../domain/model/valueobjects/investor-id.vo';
import { UserId } from '../../../domain/model/valueobjects/user-id.vo';
import { Email } from '../../../domain/model/valueobjects/email.vo';
import type { IInvestorRepository } from '../../../domain/repositories/investor.repository';
import { GetInvestorByIdQuery } from '../../../domain/model/queries/get-investor-by-id.query';

describe('InvestorQueryServiceImpl', () => {
  let investorRepository: jest.Mocked<IInvestorRepository>;
  let service: InvestorQueryServiceImpl;

  beforeEach(() => {
    investorRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    service = new InvestorQueryServiceImpl(investorRepository);
  });

  describe('handleGetInvestorById', () => {
    it('delegates to the repository and returns the found investor', async () => {
      // Arrange
      const investor = new Investor(
        new InvestorId('investor-1'),
        new UserId('user-1'),
        new Email('investor@vankoo.com'),
      );
      investorRepository.findById.mockResolvedValue(investor);

      // Act
      const result = await service.handleGetInvestorById(
        new GetInvestorByIdQuery('investor-1'),
      );

      // Assert
      expect(investorRepository.findById).toHaveBeenCalledWith('investor-1');
      expect(result).toBe(investor);
    });

    it('returns null when the investor does not exist', async () => {
      // Arrange
      investorRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.handleGetInvestorById(
        new GetInvestorByIdQuery('missing-id'),
      );

      // Assert
      expect(result).toBeNull();
    });
  });
});
