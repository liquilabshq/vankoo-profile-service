import { Company } from './company.aggregate';
import { CompanyId } from '../valueobjects/company-id.vo';
import { UserId } from '../valueobjects/user-id.vo';
import { Email } from '../valueobjects/email.vo';
import { KycStatus } from '../valueobjects/kyc-status.enum';
import { DocumentUrl } from '../valueobjects/document-url.vo';
import { IndustrySector } from '../valueobjects/industry-sector.enum';

const legalAddress = {
  street: 'Av. Arequipa 123',
  city: 'Lima',
  state: 'Lima',
  postalCode: '15046',
  country: 'PE',
};

function newCompany(): Company {
  return new Company(
    new CompanyId(),
    new UserId('user-123'),
    new Email('carlos@vankoo.pe'),
  );
}

describe('Company', () => {
  it('starts with a pending KYC and no business data', () => {
    const company = newCompany();

    expect(company.getKycStatus()).toBe(KycStatus.PENDING);
    expect(company.rucNumber).toBeUndefined();
    expect(company.businessName).toBeUndefined();
  });

  it('completes its profile with the business data', () => {
    const company = newCompany();
    const sector = Object.values(IndustrySector)[0];

    company.completeProfile(
      '20573093420',
      'Alvacor Ingenieros',
      sector,
      '987654321',
      legalAddress,
    );

    expect(company.rucNumber?.value).toBe('20573093420');
    expect(company.businessName?.value).toBe('Alvacor Ingenieros');
    expect(company.industrySector).toBe(sector);
    expect(company.contactPhone?.value).toBe('987654321');
    expect(company.legalAddress?.city).toBe('Lima');
  });

  it('refuses a profile without a legal address city', () => {
    const company = newCompany();

    expect(() =>
      company.completeProfile('20573093420', 'Alvacor', 'X', '987654321', {
        ...legalAddress,
        city: '',
      }),
    ).toThrow();
  });

  it('verifies a pending KYC', () => {
    const company = newCompany();

    company.verifyKyc();

    expect(company.getKycStatus()).toBe(KycStatus.VERIFIED);
  });

  it('rejects a pending KYC with a reason', () => {
    const company = newCompany();

    company.rejectKyc('RUC ilegible');

    expect(company.getKycStatus()).toBe(KycStatus.REJECTED);
    expect(company.getKycRejectionReason()?.value).toBe('RUC ilegible');
  });

  it('does not process a KYC twice', () => {
    const company = newCompany();
    company.verifyKyc();

    expect(() => company.rejectKyc('tarde')).toThrow('ya fue procesado');
    expect(() => company.verifyKyc()).toThrow('ya fue procesado');
    expect(company.getKycStatus()).toBe(KycStatus.VERIFIED);
  });

  it('keeps the KYC status it was rehydrated with', () => {
    const company = new Company(
      new CompanyId('company-1'),
      new UserId('user-123'),
      new Email('carlos@vankoo.pe'),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      KycStatus.REJECTED,
    );

    expect(company.getKycStatus()).toBe(KycStatus.REJECTED);
  });

  it('stores the uploaded RUC document and logo', () => {
    const company = newCompany();
    const ruc = new DocumentUrl('https://files.vankoo.pe/ruc.pdf');
    const logo = new DocumentUrl('https://files.vankoo.pe/logo.png');

    company.uploadRucDocument(ruc);
    company.updateLogo(logo);

    expect(company.getRucDocumentUrl()).toBe(ruc);
    expect(company.getLogoUrl()).toBe(logo);
  });
});
