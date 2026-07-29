import { Column, Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { InvestorEntity } from './investor.entity';

/**
 * @author LiquiLabs
 * @summary Entidad de infraestructura para persistir BankAccount en su propia tabla.
 */
@Entity('bank_accounts')
export class BankAccountEntity {
  @PrimaryColumn('uuid')
  id: string; // Extraído de BankAccountId

  @Column({ name: 'bank_name' })
  bankName: string;

  @Column({ name: 'account_number' })
  accountNumber: string;

  // Relación inversa para que PostgreSQL sepa a quién pertenece esta cuenta
  @OneToOne(() => InvestorEntity, (investor) => investor.bankAccount, {
    onDelete: 'CASCADE', // Si se borra el inversor, se borra su cuenta
  })
  @JoinColumn({ name: 'investor_id' })
  investor: InvestorEntity;
}
