import { BankAccountId } from '../valueobjects/bank-account-id.vo';

/**
 * @author LiquiLabs
 * @summary Entidad de dominio que representa la cuenta bancaria de un inversor.
 */
export class BankAccount {
  constructor(
    public readonly id: BankAccountId,
    private bankName: string,
    private accountNumber: string,
  ) {
    if (!bankName || bankName.trim() === '') {
      throw new Error('El nombre del banco es obligatorio');
    }
    if (!accountNumber || accountNumber.trim() === '') {
      throw new Error('El número de cuenta es obligatorio');
    }
  }

  // Comportamiento de dominio: Si el inversor necesita actualizar su cuenta
  public updateAccountDetails(
    newBankName: string,
    newAccountNumber: string,
  ): void {
    if (!newBankName || !newAccountNumber) {
      throw new Error(
        'Los nuevos detalles de la cuenta no pueden estar vacíos',
      );
    }
    this.bankName = newBankName;
    this.accountNumber = newAccountNumber;
  }

  // Getters para leer los datos manteniendo las variables privadas protegidas
  public getBankName(): string {
    return this.bankName;
  }

  public getAccountNumber(): string {
    return this.accountNumber;
  }
}
