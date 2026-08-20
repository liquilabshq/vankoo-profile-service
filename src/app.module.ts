import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompaniesModule } from './profiles/companies.module';
import { InvestorsModule } from './profiles/investors.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { UserRegisteredSubscriber } from './profiles/interfaces/events/user-registered.subscriber';
import { DiscoveryModule } from './profiles/infrastructure/discovery/discovery.module';

@Module({
  imports: [
    // 1. Carga las variables del archivo .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Forzamos a que lea estrictamente este archivo
      ignoreEnvFile: false,
    }),

    // 2. Configuración de TypeORM conectándose a tu Docker
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // 1. Verificación rápida (luego puedes borrar estos console.log)
        console.log('--- LEYENDO VARIABLES DEL .ENV ---');
        console.log('HOST:', configService.get<string>('DB_HOST'));
        console.log('PORT:', configService.get<string>('DB_PORT'));
        console.log('DB:', configService.get<string>('DB_NAME'));

        // 2. Retornamos la configuración
        return {
          type: 'postgres',
          host: configService.get<string>('PROFILE_DB_HOST') || '127.0.0.1',
          port: parseInt(
            configService.get<string>('PROFILE_DB_PORT') || '5433',
            10,
          ),
          username: configService.get<string>('PROFILE_DB_USER') || 'admin',
          password: configService.get<string>('PROFILE_DB_PASS') || 'password',
          database:
            configService.get<string>('PROFILE_DB_NAME') ||
            'vankoo_profile_db_dev',
          autoLoadEntities: true,
          synchronize: true, // pasar a false en produccion
          logging: true,
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
    }),

    // 3. Tu Bounded Context
    CompaniesModule,
    InvestorsModule,

    // 4. Descubrimiento de servicios (Eureka)
    DiscoveryModule,
  ],
  controllers: [AppController, UserRegisteredSubscriber],
  providers: [AppService],
})
export class AppModule {}
