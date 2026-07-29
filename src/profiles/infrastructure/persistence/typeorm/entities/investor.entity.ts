import { Column, Entity, PrimaryColumn, OneToOne } from 'typeorm';
import { BankAccountEntity } from './bank-account.entity';
// Asumiendo que reutilizamos o recreamos la clase AddressEmbeddable aquí

export class AddressEmbeddable {
  @Column({ name: 'street', nullable: true }) street: string;
  @Column({ name: 'city', nullable: true }) city: string;
  @Column({ name: 'state', nullable: true }) state: string;
  @Column({ name: 'postal_code', nullable: true }) postalCode: string;
  @Column({ name: 'country', nullable: true }) country: string;
}

/**
 * @author  LiquiLabs
 * @summary Entidad de infraestructura para persistir Investor en PostgreSQL.
 */
@Entity('investors')
export class InvestorEntity {
  @PrimaryColumn('uuid')
  id: string; // Extraído de InvestorId

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string; // Extraído de UserId

  @Column({
    name: 'dni_number',
    length: 8,
    type: 'varchar',
    unique: true,
    nullable: true,
  })
  dni: string | null;

  // Aplanamos el Value Object FullName
  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'contact_email' })
  contactEmail: string;

  @Column({ name: 'contact_phone', type: 'varchar', nullable: true })
  contactPhone: string | null;

  // Aplanamos el Value Object Address
  @Column(() => AddressEmbeddable, { prefix: 'billing_address' })
  billingAddress: AddressEmbeddable;

  @Column({ name: 'kyc_status', default: 'PENDING' })
  kycStatus: string;

  // URLs de MinIO
  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({ name: 'dni_document_url', type: 'varchar', nullable: true })
  dniDocumentUrl: string | null;

  // 👇 LA ENTIDAD BANK ACCOUNT 👇
  @OneToOne(() => BankAccountEntity, (bankAccount) => bankAccount.investor, {
    cascade: true, // ¡CLAVE! Si guardas el Inversor, TypeORM guarda la cuenta automáticamente
    eager: true, // Al buscar un Inversor con un GET, trae su cuenta bancaria unida automáticamente
  })
  bankAccount: BankAccountEntity;
}
