import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { ALLOWED_CONTENT_TYPES } from '../../../domain/services/file-storage.service';

/** @author LiquiLabs */
export class RequestUploadUrlResource {
  @ApiProperty({
    description: 'Tipo MIME del archivo que se va a subir',
    example: 'image/jpeg',
    enum: ALLOWED_CONTENT_TYPES,
  })
  @IsIn(ALLOWED_CONTENT_TYPES, {
    message: `El contentType debe ser uno de: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
  })
  @IsNotEmpty()
  contentType: string;
}
