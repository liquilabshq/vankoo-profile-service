import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

/** @author LiquiLabs */
export class UploadInvestorDniResource {
  @ApiProperty({
    description: 'URL del documento DNI subido',
    example: 'http://minio/dnis/dni.jpg',
  })
  @IsUrl(
    { require_tld: false },
    { message: 'La URL no tiene un formato válido' },
  )
  @IsNotEmpty()
  dniDocumentUrl: string;
}
