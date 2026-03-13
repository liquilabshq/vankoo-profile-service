import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infraestructura
import { CompanyEntity } from './infrastructure/persistence/typeorm/entities/company.entity';
import { CompanyRepositoryImpl } from './infrastructure/persistence/typeorm/repositories/company.repository.impl';

// Dominio (Contratos)
import { COMPANY_REPOSITORY } from './domain/repositories/company.repository';
import { COMPANY_COMMAND_SERVICE } from './domain/services/company-command.service';
import { COMPANY_QUERY_SERVICE } from './domain/services/company-query.service';

// Aplicación (Implementaciones)
import { CompanyCommandServiceImpl } from './application/internal/commandservices/company-command.service.impl';
import { CompanyQueryServiceImpl } from './application/internal/queryservices/company-query.service.impl';

// Interfaces (REST)
import { CompaniesController } from './interfaces/rest/companies.controller';

/**
 * @author LiquiLabs
 * @summary Módulo principal del Bounded Context de Empresas (Companies).
 */
@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  controllers: [CompaniesController],
  providers: [
    { provide: COMPANY_REPOSITORY, useClass: CompanyRepositoryImpl },
    { provide: COMPANY_COMMAND_SERVICE, useClass: CompanyCommandServiceImpl },
    // El Query Service se agregará aquí
    { provide: COMPANY_QUERY_SERVICE, useClass: CompanyQueryServiceImpl },
  ],
  exports: [COMPANY_COMMAND_SERVICE],
})
export class CompaniesModule {}
