import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { randomUUID } from 'crypto';

import { InvestorEntity } from '../../src/profiles/infrastructure/persistence/typeorm/entities/investor.entity';
import { BankAccountEntity } from '../../src/profiles/infrastructure/persistence/typeorm/entities/bank-account.entity';
import { InvestorRepositoryImpl } from '../../src/profiles/infrastructure/persistence/typeorm/repositories/investor.repository.impl';
import { Investor } from '../../src/profiles/domain/model/aggregates/investor.aggregate';
import { InvestorId } from '../../src/profiles/domain/model/valueobjects/investor-id.vo';
import { UserId } from '../../src/profiles/domain/model/valueobjects/user-id.vo';
import { Email } from '../../src/profiles/domain/model/valueobjects/email.vo';

describe('InvestorRepositoryImpl (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let moduleRef: TestingModule;
  let repository: InvestorRepositoryImpl;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15').start();

    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getPort(),
          username: container.getUsername(),
          password: container.getPassword(),
          database: container.getDatabase(),
          entities: [InvestorEntity, BankAccountEntity],
          autoLoadEntities: true,
          synchronize: true,
          namingStrategy: new SnakeNamingStrategy(),
        }),
        TypeOrmModule.forFeature([InvestorEntity, BankAccountEntity]),
      ],
      providers: [InvestorRepositoryImpl],
    }).compile();

    repository = moduleRef.get(InvestorRepositoryImpl);
  });

  afterAll(async () => {
    await moduleRef.close();
    await container.stop();
  });

  it('persists an Investor and rehydrates it with the same value objects', async () => {
    // Arrange
    const investor = new Investor(
      new InvestorId(randomUUID()),
      new UserId(randomUUID()),
      new Email('investor@vankoo.com'),
    );
    investor.completeProfile('87654321', 'Ana', 'Torres', '+51987654321', {
      street: 'Jr. de la Union 500',
      city: 'Lima',
      state: 'Lima',
      postalCode: '15001',
      country: 'PE',
    });
    investor.rejectKyc('Documentación incompleta');

    // Act
    await repository.save(investor);
    const found = await repository.findById(investor.id.value);

    // Assert
    expect(found).not.toBeNull();
    expect(found?.id.value).toBe(investor.id.value);
    expect(found?.contactEmail.address).toBe('investor@vankoo.com');
    expect(found?.dni?.value).toBe('87654321');
    expect(found?.fullName?.firstName).toBe('Ana');
    expect(found?.fullName?.lastName).toBe('Torres');
    expect(found?.billingAddress?.city).toBe('Lima');
    expect(found?.getKycStatus()).toBe('REJECTED');
    expect(found?.getKycRejectionReason()?.value).toBe(
      'Documentación incompleta',
    );
  });

  it('returns null when the investor does not exist', async () => {
    // Arrange
    const missingId = randomUUID();

    // Act
    const found = await repository.findById(missingId);

    // Assert
    expect(found).toBeNull();
  });
});
