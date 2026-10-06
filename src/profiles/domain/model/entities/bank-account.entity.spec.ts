import { BankAccount } from './bank-account.entity';
import { BankAccountId } from '../valueobjects/bank-account-id.vo';

describe('BankAccount', () => {
  const id = new BankAccountId('bank-account-1');

  it('keeps the bank and account number', () => {
    const account = new BankAccount(id, 'BCP', '191-12345678-0-12');

    expect(account.getBankName()).toBe('BCP');
    expect(account.getAccountNumber()).toBe('191-12345678-0-12');
  });

  it.each([
    ['', '191-12345678-0-12', 'El nombre del banco es obligatorio'],
    ['BCP', '  ', 'El número de cuenta es obligatorio'],
  ])('rejects missing details (%s, %s)', (bank, number, message) => {
    expect(() => new BankAccount(id, bank, number)).toThrow(message);
  });

  it('updates the account details', () => {
    const account = new BankAccount(id, 'BCP', '191-12345678-0-12');

    account.updateAccountDetails('Interbank', '200-3001234567');

    expect(account.getBankName()).toBe('Interbank');
    expect(account.getAccountNumber()).toBe('200-3001234567');
  });

  it('refuses to update with empty details', () => {
    const account = new BankAccount(id, 'BCP', '191-12345678-0-12');

    expect(() => account.updateAccountDetails('', '')).toThrow();
    expect(account.getBankName()).toBe('BCP');
  });
});
