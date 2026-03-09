import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * @author LiquiLabs
 * @summary Clases auxiliares (Embeddables) para aplanar los Value Objects compuestos.
 */
export class AddressEmbeddable {
  @Column({ name: 'street' }) street: string;
  @Column({ name: 'city' }) city: string;
  @Column({ name: 'state' }) state: string;
  @Column({ name: 'postal_code' }) postalCode: string;
  @Column({ name: 'country' }) country: string;
}

export class SustainabilityEmbeddable {
  @Column({ name: 'is_green', default: false }) isGreen: boolean;
  @Column({ name: 'verification_date', type: 'timestamp', nullable: true })
  verificationDate: Date | null;
}

/**
 * @author LiquiLabs
 * @summary Entidad de infraestructura para persistir Company en PostgreSQL.
 */
@Entity('companies')
export class CompanyEntity {
  @PrimaryColumn('uuid')
  id: string; // Representa CompanyId

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string; // Representa UserId

  @Column({ name: 'ruc_number', length: 11, unique: true })
  rucNumber: string;

  @Column({ name: 'business_name' })
  businessName: string;

  @Column({ name: 'industry_sector', type: 'varchar' })
  industrySector: string; // Guardamos el Enum IndustrySector como texto

  @Column({ name: 'contact_email' })
  contactEmail: string;

  @Column({ name: 'contact_phone', type: 'varchar', nullable: true }) //
  contactPhone: string | null;

  // 👇 Magia de TypeORM: Aplana la dirección en 5 columnas (legal_address_street, etc.)
  @Column(() => AddressEmbeddable, { prefix: 'legal_address' })
  legalAddress: AddressEmbeddable;

  // 👇 Aplana la sostenibilidad en 2 columnas (sustainability_is_green, etc.)
  @Column(() => SustainabilityEmbeddable, { prefix: 'sustainability' })
  sustainabilityStatus: SustainabilityEmbeddable;

  @Column({ name: 'kyc_status', default: 'PENDING' })
  kycStatus: string;

  // Enlaces de documentos subidos a MinIO (nacen vacíos/nulos)
  @Column({ name: 'logo_url', type: 'varchar', nullable: true }) //
  logoUrl: string | null;

  @Column({ name: 'ruc_document_url', type: 'varchar', nullable: true }) //
  rucDocumentUrl: string | null;
}
