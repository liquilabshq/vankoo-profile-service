/** * @author LiquiLabs
 * @summary Value Object para el identificador único de la cuenta bancaria.
 */
export class BankAccountId {
  constructor(public readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('El BankAccountId no puede estar vacío');
    }
  }
}
