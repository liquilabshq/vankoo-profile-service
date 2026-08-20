import { ApiProperty } from '@nestjs/swagger';

/** @author LiquiLabs */
export class UploadUrlResource {
  @ApiProperty({
    description:
      'URL firmada temporal para subir el archivo directamente a MinIO (PUT)',
  })
  uploadUrl: string;

  @ApiProperty({
    description:
      'URL final del archivo una vez subido. Debe confirmarse luego con el endpoint correspondiente (ej. PATCH /dni)',
  })
  fileUrl: string;

  @ApiProperty({
    description: 'Segundos que la uploadUrl permanece válida',
  })
  expiresInSeconds: number;
}
