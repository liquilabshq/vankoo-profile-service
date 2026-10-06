import { Email } from './email.vo';
import { Address } from './address.vo';
import { DocumentUrl } from './document-url.vo';
import { KycRejectionReason } from './kyc-rejection-reason.vo';
import { UserId } from './user-id.vo';
import { CompanyId } from './company-id.vo';

describe('Email', () => {
  it('accepts a well-formed address', () => {
    expect(new Email('carlos@vankoo.pe').address).toBe('carlos@vankoo.pe');
  });

  it.each([
    'carlos',
    'carlos@',
    '@vankoo.pe',
    'carlos@vankoo',
    'carlos @vankoo.pe',
  ])('rejects the malformed address "%s"', (address) => {
    expect(() => new Email(address)).toThrow('Formato de email inválido');
  });
});

describe('Address', () => {
  it('keeps every part of the address', () => {
    const address = new Address(
      'Av. Arequipa 123',
      'Lima',
      'Lima',
      '15046',
      'PE',
    );

    expect(address).toEqual({
      street: 'Av. Arequipa 123',
      city: 'Lima',
      state: 'Lima',
      postalCode: '15046',
      country: 'PE',
    });
  });

  it.each([
    ['street', '', 'Lima', 'PE'],
    ['city', 'Av. Arequipa 123', '', 'PE'],
    ['country', 'Av. Arequipa 123', 'Lima', ''],
  ])('requires the %s', (_, street, city, country) => {
    expect(() => new Address(street, city, 'Lima', '15046', country)).toThrow();
  });
});

describe('DocumentUrl', () => {
  it('accepts an http(s) url', () => {
    expect(new DocumentUrl('https://bucket.s3.amazonaws.com/ruc.pdf').url).toBe(
      'https://bucket.s3.amazonaws.com/ruc.pdf',
    );
  });

  it('rejects anything that is not a url', () => {
    expect(() => new DocumentUrl('ftp://files/ruc.pdf')).toThrow(
      'La URL del documento es inválida',
    );
  });
});

describe('KycRejectionReason', () => {
  it('keeps the reason', () => {
    expect(new KycRejectionReason('RUC ilegible').value).toBe('RUC ilegible');
  });

  it.each(['', '   '])('rejects a blank reason', (reason) => {
    expect(() => new KycRejectionReason(reason)).toThrow(
      'El motivo de rechazo del KYC es requerido',
    );
  });
});

describe('UserId', () => {
  it('keeps the identifier issued by IAM', () => {
    expect(new UserId('user-123').value).toBe('user-123');
  });

  it.each(['', '  '])('rejects a blank identifier', (value) => {
    expect(() => new UserId(value)).toThrow('UserId no puede estar vacío');
  });
});

describe('CompanyId', () => {
  it('generates a uuid when none is given', () => {
    expect(new CompanyId().value).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('generates a different uuid each time', () => {
    expect(new CompanyId().value).not.toBe(new CompanyId().value);
  });

  it('keeps an existing identifier', () => {
    expect(new CompanyId('company-1').value).toBe('company-1');
  });
});
