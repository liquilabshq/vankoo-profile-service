import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  FILE_STORAGE_SERVICE,
  IFileStorageService,
} from '../../domain/services/file-storage.service';
import { MinioFileStorageService } from './minio-file-storage.service';
import { S3FileStorageService } from './s3-file-storage.service';
import { StorageModule } from './storage.module';

/**
 * @author LiquiLabs
 * @summary Verifica que STORAGE_PROVIDER elige el adaptador correcto: S3 en la
 * nube y MinIO en desarrollo local, sin que el resto del servicio lo note.
 */
async function resolveStorage(env: Record<string, string>) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [() => env],
      }),
      StorageModule,
    ],
  }).compile();
  return moduleRef.get<IFileStorageService>(FILE_STORAGE_SERVICE);
}

describe('StorageModule', () => {
  it.each([
    [{ STORAGE_PROVIDER: 's3' }, S3FileStorageService],
    [{ STORAGE_PROVIDER: 'S3' }, S3FileStorageService],
    [{ STORAGE_PROVIDER: 'minio' }, MinioFileStorageService],
    [{}, MinioFileStorageService],
  ])('STORAGE_PROVIDER=%j -> %p', async (env, expected) => {
    expect(await resolveStorage(env)).toBeInstanceOf(expected);
  });
});
