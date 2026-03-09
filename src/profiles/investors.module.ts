import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infraestructura (Base de datos)
import { InvestorEntity } from './infrastructure/persistence/typeorm/entities/investor.entity';
import { BankAccountEntity } from './infrastructure/persistence/typeorm/entities/bank-account.entity';
import { InvestorRepositoryImpl } from './infrastructure/persistence/typeorm/repositories/investor.repository.impl';

// Dominio (Contratos)
import { INVESTOR_REPOSITORY } from './domain/repositories/investor.repository';
import { INVESTOR_COMMAND_SERVICE } from './domain/services/investor-command.service';
import { INVESTOR_QUERY_SERVICE } from './domain/services/investor-query.service';

// Aplicación (Implementaciones)
import { InvestorCommandServiceImpl } from './application/internal/commandservices/investor-command.service.impl';
import { InvestorQueryServiceImpl } from './application/internal/queryservices/investor-query.service.impl';

// Interfaces (REST)
import { InvestorsController } from './interfaces/rest/investors.controller';

/**
 * @author LiquiLabs
 * @summary Módulo principal del Bounded Context de Inversores (Investors).
 */
@Module({
  imports: [
    // Importante: Inversores necesita registrar ambas tablas
    TypeOrmModule.forFeature([InvestorEntity, BankAccountEntity]),
  ],
  controllers: [InvestorsController],
  providers: [
    { provide: INVESTOR_REPOSITORY, useClass: InvestorRepositoryImpl },
    { provide: INVESTOR_COMMAND_SERVICE, useClass: InvestorCommandServiceImpl },
    { provide: INVESTOR_QUERY_SERVICE, useClass: InvestorQueryServiceImpl },
  ],
})
export class InvestorsModule {}
