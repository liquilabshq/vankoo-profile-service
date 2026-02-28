import { ProfileRepositoryImpl } from './infrastructure/persistence/typeorm/repositories/profile.repository.impl';
import { PROFILE_REPOSITORY } from './domain/repositories/profile.repository';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infraestructura
import { ProfileEntity } from './infrastructure/persistence/typeorm/entities/profile.entity';

// Interfaces (REST)
import { ProfilesController } from './interfaces/rest/profiles.controller';

// Dominio (Contratos)
import { PROFILE_COMMAND_SERVICE } from './domain/services/profile-command.service';

// Aplicación (Implementaciones)
import { ProfileCommandServiceImpl } from './application/internal/commandservices/profile-command.service.impl';

/**
 * @author LiquiLabs
 * @summary Módulo principal del Bounded Context de Perfiles para Vankoo.
 * Conecta la infraestructura (TypeORM), los controladores REST y los servicios de aplicación.
 */
@Module({
  imports: [
    // Registramos la entidad para que TypeORM cree el repositorio inyectable
    TypeOrmModule.forFeature([ProfileEntity]),
  ],
  controllers: [
    // Registramos nuestros endpoints REST
    ProfilesController,
  ],
  providers: [
    // 1. Vinculamos tu nuevo Repositorio
    {
      provide: PROFILE_REPOSITORY,
      useClass: ProfileRepositoryImpl,
    },
    // 2. Vinculamos tu Command Service
    {
      provide: PROFILE_COMMAND_SERVICE,
      useClass: ProfileCommandServiceImpl,
    },
  ],
})
export class ProfilesModule {}
