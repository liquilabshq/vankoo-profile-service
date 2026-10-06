import { Investor } from './investor.aggregate';
import { InvestorId } from '../valueobjects/investor-id.vo';
import { UserId } from '../valueobjects/user-id.vo';
import { Email } from '../valueobjects/email.vo';
import { KycStatus } from '../valueobjects/kyc-status.enum';
import { DocumentUrl } from '../valueobjects/document-url.vo';

const billingAddress = {
  street: 'Jr. Las Begonias 456',
  city: 'Lima',
  state: 'Lima',
  postalCode: '15036',
  country: 'PE',
};

function newInvestor(): Investor {
  return new Investor(
    new InvestorId(),
    new UserId('user-456'),
    new Email('sofia@vankoo.pe'),
  );
}

describe('Investor', () => {
  it('starts with a pending KYC and no personal data', () => {
    const investor = newInvestor();

    expect(investor.getKycStatus()).toBe(KycStatus.PENDING);
    expect(investor.dni).toBeUndefined();
    expect(investor.fullName).toBeUndefined();
  });

  it('completes its profile with the personal data', () => {
    const investor = newInvestor();

    investor.completeProfile(
      '71234567',
      'Sofía',
      'Ramírez',
      '912345678',
      billingAddress,
    );

    expect(investor.dni?.value).toBe('71234567');
    expect(investor.fullName).toEqual({
      firstName: 'Sofía',
      lastName: 'Ramírez',
    });
    expect(investor.contactPhone?.value).toBe('912345678');
    expect(investor.billingAddress?.street).toBe('Jr. Las Begonias 456');
  });

  it('verifies a pending KYC', () => {
    const investor = newInvestor();

    investor.verifyKyc();

    expect(investor.getKycStatus()).toBe(KycStatus.VERIFIED);
  });

  it('rejects a pending KYC with a reason', () => {
    const investor = newInvestor();

    investor.rejectKyc('DNI vencido');

    expect(investor.getKycStatus()).toBe(KycStatus.REJECTED);
    expect(investor.getKycRejectionReason()?.value).toBe('DNI vencido');
  });

  it('requires a reason to reject the KYC', () => {
    const investor = newInvestor();

    expect(() => investor.rejectKyc('  ')).toThrow(
      'El motivo de rechazo del KYC es requerido',
    );
    expect(investor.getKycStatus()).toBe(KycStatus.PENDING);
  });

  it('does not process a KYC twice', () => {
    const investor = newInvestor();
    investor.rejectKyc('DNI vencido');

    expect(() => investor.verifyKyc()).toThrow('ya fue procesado');
    expect(investor.getKycStatus()).toBe(KycStatus.REJECTED);
  });

  it('stores the uploaded photo and DNI document', () => {
    const investor = newInvestor();
    const photo = new DocumentUrl('https://files.vankoo.pe/photo.jpg');
    const dni = new DocumentUrl('https://files.vankoo.pe/dni.pdf');

    investor.updatePhoto(photo);
    investor.updateDniDocument(dni);

    expect(investor.getPhotoUrl()).toBe(photo);
    expect(investor.getDniDocumentUrl()).toBe(dni);
  });
});
