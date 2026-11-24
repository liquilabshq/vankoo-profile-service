import { ConfigService } from '@nestjs/config';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';
import { S3FileStorageService } from './s3-file-storage.service';

/**
 * @author LiquiLabs
 * @summary Pruebas de integración del adaptador de Amazon S3.
 *
 * La URL prefirmada se genera con el SDK real (la firma SigV4 se calcula en local,
 * sin red) y se verifica su contrato: host del bucket, método PUT, expiración y que
 * no incluya checksums automáticos. La única llamada de red (HeadBucket) se simula
 * con un stub de S3Client.send.
 */
const CONFIG = {
  AWS_REGION: 'us-east-2',
  AWS_S3_BUCKET: 'vankoo-test-bucket',
  AWS_S3_PRESIGNED_EXPIRY_SECONDS: '120',
  AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
  AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};

function createService(overrides: Record<string, string> = {}) {
  return new S3FileStorageService(
    new ConfigService({ ...CONFIG, ...overrides }),
  );
}

describe('S3FileStorageService', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('generateUploadUrl', () => {
    it('devuelve una URL prefirmada PUT para el bucket y la clave pedidos', async () => {
      const result = await createService().generateUploadUrl(
        'companies/123/ruc-card.pdf',
      );
      const url = new URL(result.uploadUrl);

      expect(url.protocol).toBe('https:');
      expect(url.host).toBe('vankoo-test-bucket.s3.us-east-2.amazonaws.com');
      expect(url.pathname).toBe('/companies/123/ruc-card.pdf');
      expect(url.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
      expect(url.searchParams.get('X-Amz-Credential')).toMatch(
        /^AKIAIOSFODNN7EXAMPLE\/\d{8}\/us-east-2\/s3\/aws4_request$/,
      );
      expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
    });

    it('respeta la expiración configurada', async () => {
      const result = await createService().generateUploadUrl('a/b.png');

      expect(new URL(result.uploadUrl).searchParams.get('X-Amz-Expires')).toBe(
        '120',
      );
      expect(result.expiresInSeconds).toBe(120);
    });

    it('no firma checksums automáticos, para que un navegador pueda subir directo', async () => {
      const result = await createService().generateUploadUrl('a/b.png');
      const url = new URL(result.uploadUrl);

      const amzParams = [...url.searchParams.keys()].map((k) =>
        k.toLowerCase(),
      );
      expect(amzParams.some((k) => k.startsWith('x-amz-checksum'))).toBe(false);
      expect(amzParams).not.toContain('x-amz-sdk-checksum-algorithm');
      expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('host');
    });

    it('nunca expone la clave secreta en la URL', async () => {
      const result = await createService().generateUploadUrl('a/b.png');

      expect(result.uploadUrl).not.toContain(CONFIG.AWS_SECRET_ACCESS_KEY);
      expect(result.uploadUrl).not.toContain(
        encodeURIComponent(CONFIG.AWS_SECRET_ACCESS_KEY),
      );
    });

    it('devuelve la URL pública del archivo (por defecto la del bucket)', async () => {
      const result = await createService().generateUploadUrl('a/b.png');

      expect(result.fileUrl).toBe(
        'https://vankoo-test-bucket.s3.us-east-2.amazonaws.com/a/b.png',
      );
    });

    it('usa AWS_S3_PUBLIC_URL cuando hay una CDN delante del bucket', async () => {
      const result = await createService({
        AWS_S3_PUBLIC_URL: 'https://cdn.vankoo.test',
      }).generateUploadUrl('a/b.png');

      expect(result.fileUrl).toBe('https://cdn.vankoo.test/a/b.png');
    });

    it('cada URL firma solo su propia clave', async () => {
      const service = createService();
      const first = await service.generateUploadUrl('a/1.png');
      const second = await service.generateUploadUrl('a/2.png');

      expect(
        new URL(first.uploadUrl).searchParams.get('X-Amz-Signature'),
      ).not.toBe(new URL(second.uploadUrl).searchParams.get('X-Amz-Signature'));
    });
  });

  describe('resolveObjectKey', () => {
    const service = createService();

    it.each([
      [
        'https://vankoo-test-bucket.s3.us-east-2.amazonaws.com/a/b.png',
        'a/b.png',
      ],
      ['https://otro-bucket.s3.us-east-2.amazonaws.com/a/b.png', null],
      [
        'https://vankoo-test-bucket.s3.us-east-2.amazonaws.com/../secreto',
        null,
      ],
      [
        'https://vankoo-test-bucket.s3.us-east-2.amazonaws.com/a/b.png?x=1',
        null,
      ],
      ['https://vankoo-test-bucket.s3.us-east-2.amazonaws.com/', null],
    ])('%s -> %s', (fileUrl, expected) => {
      expect(service.resolveObjectKey(fileUrl)).toBe(expected);
    });
  });

  describe('onModuleInit (HeadBucket)', () => {
    it('comprueba el acceso al bucket configurado', async () => {
      const send = jest
        .spyOn(S3Client.prototype, 'send')
        .mockResolvedValue({} as never);

      await createService().onModuleInit();

      expect(send).toHaveBeenCalledTimes(1);
      const command = send.mock.calls[0][0] as HeadBucketCommand;
      expect(command).toBeInstanceOf(HeadBucketCommand);
      expect(command.input).toEqual({ Bucket: 'vankoo-test-bucket' });
    });

    it('si S3 no responde, registra el error pero no impide arrancar el servicio', async () => {
      jest
        .spyOn(S3Client.prototype, 'send')
        .mockRejectedValue(new Error('AccessDenied') as never);
      const logError = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      await expect(createService().onModuleInit()).resolves.toBeUndefined();
      expect(logError).toHaveBeenCalledWith(
        expect.stringContaining('vankoo-test-bucket'),
      );
    });
  });
});
