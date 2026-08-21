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
  // Cliente "interno": usa MINIO_ENDPOINT/PORT (ej. el hostname `minio` dentro de la red de Docker).
  // Sirve para las tareas de arranque que sí necesitan conectividad real (bucketExists, makeBucket, setBucketPolicy).
  private readonly client: Minio.Client;
  // Cliente "de firma": usa la URL pública (MINIO_PUBLIC_URL) si está definida. Firmar una URL prefirmada
  // es puro cómputo local (no requiere red), así que este cliente puede usar un host distinto al interno
  // sin problema — y DEBE hacerlo, porque el "host" firmado tiene que coincidir con el host real que va a
  // usar quien suba el archivo (browser/Postman/etc.), o MinIO rechaza la subida con SignatureDoesNotMatch.
  private readonly signingClient: Minio.Client;
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
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY') || '';
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY') || '';

    this.bucketName =
      this.configService.get<string>('MINIO_BUCKET_NAME') ||
      'vankoo-profile-documents';
    this.expiryInSeconds = parseInt(
      this.configService.get<string>('MINIO_PRESIGNED_EXPIRY_SECONDS') || '300',
      10,
    );

    // region fijo: evita que el SDK intente autodetectarlo llamando a GetBucketLocation
    // (esa llamada de red fallaría para el signingClient, cuyo endpoint público no es
    // alcanzable desde dentro del contenedor — firmar una URL no debería depender de red).
    const region = 'us-east-1';

    this.client = new Minio.Client({ endPoint, port, useSSL, accessKey, secretKey, region });

    const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL');
    this.publicBaseUrl =
      publicUrl || `${useSSL ? 'https' : 'http'}://${endPoint}:${port}/${this.bucketName}`;

    if (publicUrl) {
      const parsedPublicUrl = new URL(publicUrl);
      const publicUseSSL = parsedPublicUrl.protocol === 'https:';
      this.signingClient = new Minio.Client({
        endPoint: parsedPublicUrl.hostname,
        port: parsedPublicUrl.port
          ? parseInt(parsedPublicUrl.port, 10)
          : publicUseSSL
            ? 443
            : 80,
        useSSL: publicUseSSL,
        accessKey,
        secretKey,
        region,
      });
    } else {
      // Sin override: el host interno y el público coinciden (caso típico de desarrollo local).
      this.signingClient = this.client;
    }
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
    const uploadUrl = await this.signingClient.presignedPutObject(
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
