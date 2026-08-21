import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FILE_STORAGE_SERVICE } from '../../domain/services/file-storage.service';
import { MinioFileStorageService } from './minio-file-storage.service';
import { S3FileStorageService } from './s3-file-storage.service';

/**
 * @author LiquiLabs
 * @summary Módulo de infraestructura compartido que expone el adaptador de almacenamiento de archivos.
 * Elige el proveedor (MinIO para desarrollo local, S3 para despliegues reales) según STORAGE_PROVIDER.
 */
@Module({
  providers: [
    {
      provide: FILE_STORAGE_SERVICE,
      useFactory: (configService: ConfigService) => {
        const provider = (
          configService.get<string>('STORAGE_PROVIDER') || 'minio'
        ).toLowerCase();

        return provider === 's3'
          ? new S3FileStorageService(configService)
          : new MinioFileStorageService(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [FILE_STORAGE_SERVICE],
})
export class StorageModule {}
