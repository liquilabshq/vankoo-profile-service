import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { randomUUID } from 'crypto';
import request from 'supertest';
import type { App } from 'supertest/types';

import { InvestorsModule } from '../../src/profiles/investors.module';
import { InvestorEntity } from '../../src/profiles/infrastructure/persistence/typeorm/entities/investor.entity';
import { BankAccountEntity } from '../../src/profiles/infrastructure/persistence/typeorm/entities/bank-account.entity';
import { INVESTOR_REPOSITORY } from '../../src/profiles/domain/repositories/investor.repository';
import type { IInvestorRepository } from '../../src/profiles/domain/repositories/investor.repository';
import { FILE_STORAGE_SERVICE } from '../../src/profiles/domain/services/file-storage.service';
import { EVENT_PUBLISHER_SERVICE } from '../../src/profiles/domain/services/event-publisher.service';
import { Investor } from '../../src/profiles/domain/model/aggregates/investor.aggregate';
import { InvestorId } from '../../src/profiles/domain/model/valueobjects/investor-id.vo';
import { UserId } from '../../src/profiles/domain/model/valueobjects/user-id.vo';
import { Email } from '../../src/profiles/domain/model/valueobjects/email.vo';

describe('InvestorsController (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let moduleRef: TestingModule;
  let app: INestApplication<App>;
  let investorRepository: IInvestorRepository;

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
        InvestorsModule,
      ],
    })
      .overrideProvider(FILE_STORAGE_SERVICE)
      .useValue({ generateUploadUrl: jest.fn() })
      .overrideProvider(EVENT_PUBLISHER_SERVICE)
      .useValue({ publish: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    investorRepository = moduleRef.get(INVESTOR_REPOSITORY);
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  async function seedInvestor(): Promise<string> {
    const investor = new Investor(
      new InvestorId(randomUUID()),
      new UserId(randomUUID()),
      new Email('investor@vankoo.com'),
    );
    await investorRepository.save(investor);
    return investor.id.value;
  }

  it('completes the profile, rejects KYC and returns the updated investor via GET', async () => {
    // Arrange
    const investorId = await seedInvestor();

    // Act & Assert: complete profile
    await request(app.getHttpServer())
      .patch(`/investors/${investorId}/profile`)
      .send({
        dni: '87654321',
        firstName: 'Ana',
        lastName: 'Torres',
        contactPhone: '+51987654321',
        billingAddress: {
          street: 'Jr. de la Union 500',
          city: 'Lima',
          state: 'Lima',
          postalCode: '15001',
          country: 'PE',
        },
      })
      .expect(200);

    // Act & Assert: reject KYC
    await request(app.getHttpServer())
      .patch(`/investors/${investorId}/kyc/reject`)
      .send({ reason: 'Documentación incompleta' })
      .expect(200)
      .expect((res) => {
        expect(res.body.investor.kycStatus).toBe('REJECTED');
      });

    // Act & Assert: fetch the updated investor
    const getResponse = await request(app.getHttpServer())
      .get(`/investors/${investorId}`)
      .expect(200);

    expect(getResponse.body.id).toBe(investorId);
    expect(getResponse.body.kycStatus).toBe('REJECTED');
  });

  it('rejects re-rejecting an already rejected KYC with 400 and the domain error message', async () => {
    // Arrange
    const investorId = await seedInvestor();
    await request(app.getHttpServer())
      .patch(`/investors/${investorId}/kyc/reject`)
      .send({ reason: 'Documentación incompleta' })
      .expect(200);

    // Act & Assert
    await request(app.getHttpServer())
      .patch(`/investors/${investorId}/kyc/reject`)
      .send({ reason: 'Otro motivo' })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toMatch(/El KYC de este perfil ya fue procesado/);
      });
  });

  it('returns 404 when getting an investor that does not exist', async () => {
    // Arrange
    const missingId = randomUUID();

    // Act & Assert
    await request(app.getHttpServer())
      .get(`/investors/${missingId}`)
      .expect(404);
  });
});
