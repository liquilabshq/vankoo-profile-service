import { Module } from '@nestjs/common';
import { FILE_STORAGE_SERVICE } from '../../domain/services/file-storage.service';
import { MinioFileStorageService } from './minio-file-storage.service';

/**
 * @author LiquiLabs
 * @summary Módulo de infraestructura compartido que expone el adaptador de almacenamiento de archivos.
 */
@Module({
  providers: [
    { provide: FILE_STORAGE_SERVICE, useClass: MinioFileStorageService },
  ],
  exports: [FILE_STORAGE_SERVICE],
})
export class StorageModule {}
