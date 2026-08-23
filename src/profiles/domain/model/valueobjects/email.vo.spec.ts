import { Email } from './email.vo';

describe('Email value object', () => {
  it('accepts a well-formed email address', () => {
    // Arrange
    const address = 'contact@vankoo.com';

    // Act
    const email = new Email(address);

    // Assert
    expect(email.address).toBe(address);
  });

  it('throws when the email has no domain', () => {
    // Arrange
    const address = 'contact@';

    // Act & Assert
    expect(() => new Email(address)).toThrow('Formato de email inválido');
  });

  it('throws when the email has no @', () => {
    // Arrange
    const address = 'contact.vankoo.com';

    // Act & Assert
    expect(() => new Email(address)).toThrow('Formato de email inválido');
  });

  it('throws when the email contains spaces', () => {
    // Arrange
    const address = 'contact @vankoo.com';

    // Act & Assert
    expect(() => new Email(address)).toThrow('Formato de email inválido');
  });
});
