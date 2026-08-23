import { Company } from './company.aggregate';
import { CompanyId } from '../valueobjects/company-id.vo';
import { UserId } from '../valueobjects/user-id.vo';
import { Email } from '../valueobjects/email.vo';
import { DocumentUrl } from '../valueobjects/document-url.vo';
import { KycStatus } from '../valueobjects/kyc-status.enum';

describe('Company aggregate', () => {
  const legalAddress = {
    street: 'Av. Siempre Viva 742',
    city: 'Lima',
    state: 'Lima',
    postalCode: '15001',
    country: 'PE',
  };

  function buildCompany(): Company {
    return new Company(
      new CompanyId(),
      new UserId('user-123'),
      new Email('contact@vankoo.com'),
    );
  }

  describe('completeProfile', () => {
    it('fills the profile fields from primitive input', () => {
      // Arrange
      const company = buildCompany();

      // Act
      company.completeProfile(
        '20123456789',
        'Vankoo SAC',
        'TECHNOLOGY',
        '+51987654321',
        legalAddress,
      );

      // Assert
      expect(company.rucNumber?.value).toBe('20123456789');
      expect(company.businessName?.value).toBe('Vankoo SAC');
      expect(company.industrySector).toBe('TECHNOLOGY');
      expect(company.contactPhone?.value).toBe('+51987654321');
      expect(company.legalAddress?.street).toBe(legalAddress.street);
      expect(company.legalAddress?.city).toBe(legalAddress.city);
      expect(company.legalAddress?.country).toBe(legalAddress.country);
    });
  });

  describe('verifyKyc', () => {
    it('moves kycStatus from PENDING to VERIFIED', () => {
      // Arrange
      const company = buildCompany();

      // Act
      company.verifyKyc();

      // Assert
      expect(company.getKycStatus()).toBe(KycStatus.VERIFIED);
    });

    it('throws when the KYC was already verified', () => {
      // Arrange
      const company = buildCompany();
      company.verifyKyc();

      // Act & Assert
      expect(() => company.verifyKyc()).toThrow(
        /El KYC de este perfil ya fue procesado/,
      );
    });

    it('throws when the KYC was already rejected', () => {
      // Arrange
      const company = buildCompany();
      company.rejectKyc('Documentación incompleta');

      // Act & Assert
      expect(() => company.verifyKyc()).toThrow(
        /El KYC de este perfil ya fue procesado/,
      );
    });
  });

  describe('rejectKyc', () => {
    it('moves kycStatus from PENDING to REJECTED and stores the reason', () => {
      // Arrange
      const company = buildCompany();

      // Act
      company.rejectKyc('Documentación incompleta');

      // Assert
      expect(company.getKycStatus()).toBe(KycStatus.REJECTED);
      expect(company.getKycRejectionReason()?.value).toBe(
        'Documentación incompleta',
      );
    });

    it('propagates the KycRejectionReason validation error for an empty reason', () => {
      // Arrange
      const company = buildCompany();

      // Act & Assert
      expect(() => company.rejectKyc('')).toThrow(
        'El motivo de rechazo del KYC es requerido',
      );
    });

    it('throws when the KYC was already rejected', () => {
      // Arrange
      const company = buildCompany();
      company.rejectKyc('Documentación incompleta');

      // Act & Assert
      expect(() => company.rejectKyc('Otro motivo')).toThrow(
        /El KYC de este perfil ya fue procesado/,
      );
    });

    it('throws when the KYC was already verified', () => {
      // Arrange
      const company = buildCompany();
      company.verifyKyc();

      // Act & Assert
      expect(() => company.rejectKyc('Motivo tardío')).toThrow(
        /El KYC de este perfil ya fue procesado/,
      );
    });
  });

  describe('document uploads', () => {
    it('stores and returns the uploaded RUC document url', () => {
      // Arrange
      const company = buildCompany();
      const rucUrl = new DocumentUrl('https://storage.vankoo.com/ruc.pdf');

      // Act
      company.uploadRucDocument(rucUrl);

      // Assert
      expect(company.getRucDocumentUrl()).toBe(rucUrl);
    });

    it('stores and returns the updated logo url', () => {
      // Arrange
      const company = buildCompany();
      const logoUrl = new DocumentUrl('https://storage.vankoo.com/logo.png');

      // Act
      company.updateLogo(logoUrl);

      // Assert
      expect(company.getLogoUrl()).toBe(logoUrl);
    });
  });
});
