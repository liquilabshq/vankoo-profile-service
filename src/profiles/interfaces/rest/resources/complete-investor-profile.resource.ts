import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressResource {
  @ApiProperty({ example: 'Calle Los Pinos 456' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Lima' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Lima' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '15074' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'Perú' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CompleteInvestorProfileResource {
  @ApiProperty({ example: '44556677' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{8}$/, {
    message: 'El DNI debe tener exactamente 8 dígitos.',
  })
  dni: string;

  @ApiProperty({ example: 'Andrés' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Mendoza' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '+51 988776655' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  // 👇 Magia negra de NestJS para validar objetos anidados 👇
  @ApiProperty()
  @ValidateNested()
  @Type(() => AddressResource)
  billingAddress: AddressResource;
}
