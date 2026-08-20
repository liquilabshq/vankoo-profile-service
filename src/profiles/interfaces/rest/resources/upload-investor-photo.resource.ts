import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

/** @author LiquiLabs */
export class UploadInvestorPhotoResource {
  @ApiProperty({
    description: 'URL de la foto subida',
    example: 'http://minio/photos/photo.jpg',
  })
  @IsUrl(
    { require_tld: false },
    { message: 'La URL no tiene un formato válido' },
  )
  @IsNotEmpty()
  photoUrl: string;
}
