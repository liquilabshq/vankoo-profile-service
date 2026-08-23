import { KycRejectionReason } from './kyc-rejection-reason.vo';

describe('KycRejectionReason value object', () => {
  it('accepts a non-empty reason', () => {
    // Arrange
    const reason = 'Documentación incompleta';

    // Act
    const vo = new KycRejectionReason(reason);

    // Assert
    expect(vo.value).toBe(reason);
  });

  it('throws when the reason is an empty string', () => {
    // Act & Assert
    expect(() => new KycRejectionReason('')).toThrow(
      'El motivo de rechazo del KYC es requerido',
    );
  });

  it('throws when the reason is only whitespace', () => {
    // Act & Assert
    expect(() => new KycRejectionReason('   ')).toThrow(
      'El motivo de rechazo del KYC es requerido',
    );
  });
});
