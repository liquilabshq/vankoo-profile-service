import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { randomUUID } from 'crypto';
import request from 'supertest';
import type { App } from 'supertest/types';

import { CompaniesModule } from '../../src/profiles/companies.module';
import { CompanyEntity } from '../../src/profiles/infrastructure/persistence/typeorm/entities/company.entity';
import { COMPANY_REPOSITORY } from '../../src/profiles/domain/repositories/company.repository';
import type { ICompanyRepository } from '../../src/profiles/domain/repositories/company.repository';
import { FILE_STORAGE_SERVICE } from '../../src/profiles/domain/services/file-storage.service';
import { EVENT_PUBLISHER_SERVICE } from '../../src/profiles/domain/services/event-publisher.service';
import { Company } from '../../src/profiles/domain/model/aggregates/company.aggregate';
import { CompanyId } from '../../src/profiles/domain/model/valueobjects/company-id.vo';
import { UserId } from '../../src/profiles/domain/model/valueobjects/user-id.vo';
import { Email } from '../../src/profiles/domain/model/valueobjects/email.vo';

describe('CompaniesController (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let moduleRef: TestingModule;
  let app: INestApplication<App>;
  let companyRepository: ICompanyRepository;

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
        CompaniesModule,
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

    companyRepository = moduleRef.get(COMPANY_REPOSITORY);
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  async function seedCompany(): Promise<string> {
    const company = new Company(
      new CompanyId(randomUUID()),
      new UserId(randomUUID()),
      new Email('contact@vankoo.com'),
    );
    await companyRepository.save(company);
    return company.id.value;
  }

  it('completes the profile, verifies KYC and returns the updated company via GET', async () => {
    // Arrange
    const companyId = await seedCompany();

    // Act & Assert: complete profile
    await request(app.getHttpServer())
      .patch(`/companies/${companyId}/profile`)
      .send({
        rucNumber: '20123456789',
        businessName: 'Vankoo SAC',
        industrySector: 'TECHNOLOGY',
        contactPhone: '+51987654321',
        legalAddress: {
          street: 'Av. Siempre Viva 742',
          city: 'Lima',
          state: 'Lima',
          postalCode: '15001',
          country: 'PE',
        },
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.company.businessName).toBe('Vankoo SAC');
        expect(res.body.company.kycStatus).toBe('PENDING');
      });

    // Act & Assert: verify KYC
    await request(app.getHttpServer())
      .patch(`/companies/${companyId}/kyc/verify`)
      .expect(200)
      .expect((res) => {
        expect(res.body.company.kycStatus).toBe('VERIFIED');
      });

    // Act & Assert: fetch the updated company
    const getResponse = await request(app.getHttpServer())
      .get(`/companies/${companyId}`)
      .expect(200);

    expect(getResponse.body.id).toBe(companyId);
    expect(getResponse.body.kycStatus).toBe('VERIFIED');
    expect(getResponse.body.rucNumber).toBe('20123456789');
  });

  it('rejects re-verifying an already verified KYC with 400 and the domain error message', async () => {
    // Arrange
    const companyId = await seedCompany();
    await request(app.getHttpServer())
      .patch(`/companies/${companyId}/kyc/verify`)
      .expect(200);

    // Act & Assert
    await request(app.getHttpServer())
      .patch(`/companies/${companyId}/kyc/verify`)
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toMatch(/El KYC de este perfil ya fue procesado/);
      });
  });

  it('returns 404 when getting a company that does not exist', async () => {
    // Arrange
    const missingId = randomUUID();

    // Act & Assert
    await request(app.getHttpServer())
      .get(`/companies/${missingId}`)
      .expect(404);
  });

  it('returns 404 when completing the profile of a company that does not exist', async () => {
    // Arrange
    const missingId = randomUUID();

    // Act & Assert
    await request(app.getHttpServer())
      .patch(`/companies/${missingId}/profile`)
      .send({
        rucNumber: '20123456789',
        businessName: 'Vankoo SAC',
        industrySector: 'TECHNOLOGY',
        contactPhone: '+51987654321',
        legalAddress: {
          street: 'Av. Siempre Viva 742',
          city: 'Lima',
          state: 'Lima',
          postalCode: '15001',
          country: 'PE',
        },
      })
      .expect(404);
  });
});
