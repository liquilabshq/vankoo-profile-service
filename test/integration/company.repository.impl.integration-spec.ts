import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { randomUUID } from 'crypto';

import { CompanyEntity } from '../../src/profiles/infrastructure/persistence/typeorm/entities/company.entity';
import { CompanyRepositoryImpl } from '../../src/profiles/infrastructure/persistence/typeorm/repositories/company.repository.impl';
import { Company } from '../../src/profiles/domain/model/aggregates/company.aggregate';
import { CompanyId } from '../../src/profiles/domain/model/valueobjects/company-id.vo';
import { UserId } from '../../src/profiles/domain/model/valueobjects/user-id.vo';
import { Email } from '../../src/profiles/domain/model/valueobjects/email.vo';

describe('CompanyRepositoryImpl (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let moduleRef: TestingModule;
  let repository: CompanyRepositoryImpl;

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
          entities: [CompanyEntity],
          autoLoadEntities: true,
          synchronize: true,
          namingStrategy: new SnakeNamingStrategy(),
        }),
        TypeOrmModule.forFeature([CompanyEntity]),
      ],
      providers: [CompanyRepositoryImpl],
    }).compile();

    repository = moduleRef.get(CompanyRepositoryImpl);
  });

  afterAll(async () => {
    await moduleRef.close();
    await container.stop();
  });

  it('persists a Company and rehydrates it with the same value objects', async () => {
    // Arrange
    const company = new Company(
      new CompanyId(randomUUID()),
      new UserId(randomUUID()),
      new Email('contact@vankoo.com'),
    );
    company.completeProfile('20123456789', 'Vankoo SAC', 'TECHNOLOGY', '+51987654321', {
      street: 'Av. Siempre Viva 742',
      city: 'Lima',
      state: 'Lima',
      postalCode: '15001',
      country: 'PE',
    });
    company.verifyKyc();

    // Act
    await repository.save(company);
    const found = await repository.findById(company.id.value);

    // Assert
    expect(found).not.toBeNull();
    expect(found?.id.value).toBe(company.id.value);
    expect(found?.userId.value).toBe(company.userId.value);
    expect(found?.contactEmail.address).toBe('contact@vankoo.com');
    expect(found?.rucNumber?.value).toBe('20123456789');
    expect(found?.businessName?.value).toBe('Vankoo SAC');
    expect(found?.industrySector).toBe('TECHNOLOGY');
    expect(found?.contactPhone?.value).toBe('+51987654321');
    expect(found?.legalAddress?.street).toBe('Av. Siempre Viva 742');
    expect(found?.legalAddress?.country).toBe('PE');
    expect(found?.getKycStatus()).toBe('VERIFIED');
  });

  it('returns null when the company does not exist', async () => {
    // Arrange
    const missingId = randomUUID();

    // Act
    const found = await repository.findById(missingId);

    // Assert
    expect(found).toBeNull();
  });
});
