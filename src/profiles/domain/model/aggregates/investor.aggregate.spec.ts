import { Investor } from './investor.aggregate';
import { InvestorId } from '../valueobjects/investor-id.vo';
import { UserId } from '../valueobjects/user-id.vo';
import { Email } from '../valueobjects/email.vo';
import { DocumentUrl } from '../valueobjects/document-url.vo';
import { KycStatus } from '../valueobjects/kyc-status.enum';

describe('Investor aggregate', () => {
  const billingAddress = {
    street: 'Jr. de la Union 500',
    city: 'Lima',
    state: 'Lima',
    postalCode: '15001',
    country: 'PE',
  };

  function buildInvestor(): Investor {
    return new Investor(
      new InvestorId(),
      new UserId('user-456'),
      new Email('investor@vankoo.com'),
    );
  }

  describe('completeProfile', () => {
    it('fills the profile fields from primitive input', () => {
      // Arrange
      const investor = buildInvestor();

      // Act
      investor.completeProfile(
        '87654321',
        'Ana',
        'Torres',
        '+51987654321',
        billingAddress,
      );

      // Assert
      expect(investor.dni?.value).toBe('87654321');
      expect(investor.fullName?.firstName).toBe('Ana');
      expect(investor.fullName?.lastName).toBe('Torres');
      expect(investor.contactPhone?.value).toBe('+51987654321');
      expect(investor.billingAddress?.street).toBe(billingAddress.street);
      expect(investor.billingAddress?.city).toBe(billingAddress.city);
      expect(investor.billingAddress?.country).toBe(billingAddress.country);
    });
  });

  describe('verifyKyc', () => {
    it('moves kycStatus from PENDING to VERIFIED', () => {
      // Arrange
      const investor = buildInvestor();

      // Act
      investor.verifyKyc();

      // Assert
      expect(investor.getKycStatus()).toBe(KycStatus.VERIFIED);
    });

    it('throws when the KYC was already verified', () => {
      // Arrange
      const investor = buildInvestor();
      investor.verifyKyc();

      // Act & Assert
      expect(() => investor.verifyKyc()).toThrow(
        /El KYC de este perfil ya fue procesado/,
      );
    });

    it('throws when the KYC was already rejected', () => {
      // Arrange
      const investor = buildInvestor();
      investor.rejectKyc('Documentación incompleta');

      // Act & Assert
      expect(() => investor.verifyKyc()).toThrow(
        /El KYC de este perfil ya fue procesado/,
      );
    });
  });

  describe('rejectKyc', () => {
    it('moves kycStatus from PENDING to REJECTED and stores the reason', () => {
      // Arrange
      const investor = buildInvestor();

      // Act
      investor.rejectKyc('Documentación incompleta');

      // Assert
      expect(investor.getKycStatus()).toBe(KycStatus.REJECTED);
      expect(investor.getKycRejectionReason()?.value).toBe(
        'Documentación incompleta',
      );
    });

    it('propagates the KycRejectionReason validation error for an empty reason', () => {
      // Arrange
      const investor = buildInvestor();

      // Act & Assert
      expect(() => investor.rejectKyc('')).toThrow(
        'El motivo de rechazo del KYC es requerido',
      );
    });

    it('throws when the KYC was already rejected', () => {
      // Arrange
      const investor = buildInvestor();
      investor.rejectKyc('Documentación incompleta');

      // Act & Assert
      expect(() => investor.rejectKyc('Otro motivo')).toThrow(
        /El KYC de este perfil ya fue procesado/,
      );
    });

    it('throws when the KYC was already verified', () => {
      // Arrange
      const investor = buildInvestor();
      investor.verifyKyc();

      // Act & Assert
      expect(() => investor.rejectKyc('Motivo tardío')).toThrow(
        /El KYC de este perfil ya fue procesado/,
      );
    });
  });

  describe('document uploads', () => {
    it('stores and returns the updated photo url', () => {
      // Arrange
      const investor = buildInvestor();
      const photoUrl = new DocumentUrl('https://storage.vankoo.com/photo.png');

      // Act
      investor.updatePhoto(photoUrl);

      // Assert
      expect(investor.getPhotoUrl()).toBe(photoUrl);
    });

    it('stores and returns the updated DNI document url', () => {
      // Arrange
      const investor = buildInvestor();
      const dniUrl = new DocumentUrl('https://storage.vankoo.com/dni.pdf');

      // Act
      investor.updateDniDocument(dniUrl);

      // Assert
      expect(investor.getDniDocumentUrl()).toBe(dniUrl);
    });
  });
});
