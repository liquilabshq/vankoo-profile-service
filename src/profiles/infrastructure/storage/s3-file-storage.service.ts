import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IFileStorageService,
  UploadUrlResult,
} from '../../domain/services/file-storage.service';

/**
 * @author LiquiLabs
 * @summary Adaptador de infraestructura que implementa el puerto IFileStorageService usando Amazon S3.
 */
@Injectable()
export class S3FileStorageService implements IFileStorageService, OnModuleInit {
  private readonly logger = new Logger(S3FileStorageService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;
  private readonly expiryInSeconds: number;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';

    this.bucketName =
      this.configService.get<string>('AWS_S3_BUCKET') ||
      'vankoo-profile-documents';
    this.expiryInSeconds = parseInt(
      this.configService.get<string>('AWS_S3_PRESIGNED_EXPIRY_SECONDS') ||
        '300',
      10,
    );

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
      // Evita que el SDK agregue checksums automáticos (x-amz-checksum-*) a la URL
      // prefirmada: un cliente simple (navegador, curl) que sube el archivo directo
      // no los calcula, y S3 rechazaría la subida con AccessDenied si quedaran en la firma.
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });

    this.publicBaseUrl =
      this.configService.get<string>('AWS_S3_PUBLIC_URL') ||
      `https://${this.bucketName}.s3.${region}.amazonaws.com`;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
    } catch (error) {
      this.logger.error(
        `No se pudo verificar el acceso al bucket "${this.bucketName}" en S3: ${(error as Error).message}`,
      );
    }
  }

  async generateUploadUrl(objectKey: string): Promise<UploadUrlResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.expiryInSeconds,
    });

    return {
      uploadUrl,
      fileUrl: `${this.publicBaseUrl}/${objectKey}`,
      expiresInSeconds: this.expiryInSeconds,
    };
  }
}
