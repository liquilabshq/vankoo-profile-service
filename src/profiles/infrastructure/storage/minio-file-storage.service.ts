import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import {
  IFileStorageService,
  UploadUrlResult,
} from '../../domain/services/file-storage.service';

/**
 * @author LiquiLabs
 * @summary Adaptador de infraestructura que implementa el puerto IFileStorageService usando MinIO.
 */
@Injectable()
export class MinioFileStorageService
  implements IFileStorageService, OnModuleInit
{
  private readonly logger = new Logger(MinioFileStorageService.name);
  private readonly client: Minio.Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;
  private readonly expiryInSeconds: number;

  constructor(private readonly configService: ConfigService) {
    const endPoint =
      this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
    const port = parseInt(
      this.configService.get<string>('MINIO_PORT') || '9100',
      10,
    );
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';

    this.bucketName =
      this.configService.get<string>('MINIO_BUCKET_NAME') ||
      'vankoo-profile-documents';
    this.expiryInSeconds = parseInt(
      this.configService.get<string>('MINIO_PRESIGNED_EXPIRY_SECONDS') || '300',
      10,
    );

    this.client = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || '',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || '',
    });

    this.publicBaseUrl =
      this.configService.get<string>('MINIO_PUBLIC_URL') ||
      `${useSSL ? 'https' : 'http'}://${endPoint}:${port}/${this.bucketName}`;
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName);
        this.logger.log(`Bucket "${this.bucketName}" creado en MinIO.`);
      }

      // Los buckets nacen privados por defecto (igual que en S3): forzamos
      // lectura pública para que el fileUrl devuelto sea accesible sin firmar,
      // consistente con el adaptador de S3 (que se configura público en la consola de AWS).
      await this.client.setBucketPolicy(
        this.bucketName,
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        }),
      );
    } catch (error) {
      this.logger.error(
        `No se pudo verificar/crear el bucket "${this.bucketName}" en MinIO: ${(error as Error).message}`,
      );
    }
  }

  async generateUploadUrl(objectKey: string): Promise<UploadUrlResult> {
    const uploadUrl = await this.client.presignedPutObject(
      this.bucketName,
      objectKey,
      this.expiryInSeconds,
    );

    return {
      uploadUrl,
      fileUrl: `${this.publicBaseUrl}/${objectKey}`,
      expiresInSeconds: this.expiryInSeconds,
    };
  }
}
