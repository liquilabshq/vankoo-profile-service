import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * @author LiquiLabs
 * @summary Clases auxiliares (Embeddables) para aplanar los Value Objects compuestos.
 */
export class AddressEmbeddable {
  @Column({ name: 'street', nullable: true }) street: string;
  @Column({ name: 'city', nullable: true }) city: string;
  @Column({ name: 'state', nullable: true }) state: string;
  @Column({ name: 'postal_code', nullable: true }) postalCode: string;
  @Column({ name: 'country', nullable: true }) country: string;
}

export class SustainabilityEmbeddable {
  // is_green y verification_date se mantienen (derivados del estado) para no romper la columna previa.
  @Column({ name: 'is_green', default: false }) isGreen: boolean;
  @Column({ name: 'verification_date', type: 'timestamp', nullable: true })
  verificationDate: Date | null;
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'NONE' })
  status: string;
  @Column({ name: 'submission_id', type: 'uuid', nullable: true })
  submissionId: string | null;
  @Column({ name: 'object_key', type: 'varchar', nullable: true })
  objectKey: string | null;
  @Column({ name: 'content_type', type: 'varchar', length: 40, nullable: true })
  contentType: string | null;
  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;
  @Column({
    name: 'certification_id',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  certificationId: string | null;
  @Column({ name: 'standard', type: 'varchar', length: 20, nullable: true })
  standard: string | null;
  @Column({ name: 'issuer', type: 'varchar', length: 300, nullable: true })
  issuer: string | null;
  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: string | null;
  @Column({ name: 'criteria', type: 'jsonb', default: () => "'[]'" })
  criteria: { code: string; passed: boolean; detail: string }[];
  @Column({ name: 'reason_codes', type: 'jsonb', default: () => "'[]'" })
  reasonCodes: string[];
  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt: Date | null;
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

  @Column({
    name: 'ruc_number',
    length: 11,
    type: 'varchar',
    unique: true,
    nullable: true,
  })
  rucNumber: string | null;

  @Column({ name: 'business_name', nullable: true })
  businessName: string;

  @Column({ name: 'industry_sector', type: 'varchar', nullable: true })
  industrySector: string; // Guardamos el Enum IndustrySector como texto

  @Column({ name: 'contact_email' })
  contactEmail: string;

  @Column({ name: 'contact_phone', type: 'varchar', nullable: true }) //
  contactPhone: string | null;

  // 👇 Magia de TypeORM: Aplana la dirección en 5 columnas (legal_address_street, etc.)
  @Column(() => AddressEmbeddable, { prefix: 'legal_address' })
  legalAddress: AddressEmbeddable;

  // 👇 Aplana la sostenibilidad en columnas (sustainability_is_green, sustainability_status, etc.)
  @Column(() => SustainabilityEmbeddable, { prefix: 'sustainability' })
  sustainabilityStatus: SustainabilityEmbeddable;

  @Column({ name: 'kyc_status', default: 'PENDING' })
  kycStatus: string;

  @Column({ name: 'kyc_rejection_reason', type: 'varchar', nullable: true })
  kycRejectionReason: string | null;

  // Enlaces de documentos subidos a MinIO (nacen vacíos/nulos)
  @Column({ name: 'logo_url', type: 'varchar', nullable: true }) //
  logoUrl: string | null;

  @Column({ name: 'ruc_document_url', type: 'varchar', nullable: true }) //
  rucDocumentUrl: string | null;
}
