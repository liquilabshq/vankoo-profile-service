import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CompanyAddressResource {
  @ApiProperty({ example: 'Av. Los Constructores 456' })
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

  @ApiProperty({ example: '15023' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'Perú' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CompleteCompanyProfileResource {
  @ApiProperty({ example: '20123456789' })
  @IsString()
  @IsNotEmpty()
  rucNumber: string;

  @ApiProperty({ example: 'Tech Solutions SAC' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ example: 'TECHNOLOGY' })
  @IsString()
  @IsNotEmpty()
  industrySector: string;

  @ApiProperty({ example: '+51 987654321' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  // 👇 Magia negra de NestJS para validar objetos anidados 👇
  @ApiProperty()
  @ValidateNested()
  @Type(() => CompanyAddressResource)
  legalAddress: CompanyAddressResource;
}
