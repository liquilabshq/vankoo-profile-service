import { UserId } from './user-id.vo';

describe('UserId value object', () => {
  it('accepts a non-empty value', () => {
    // Arrange
    const value = 'user-123';

    // Act
    const userId = new UserId(value);

    // Assert
    expect(userId.value).toBe(value);
  });

  it('throws when the value is an empty string', () => {
    // Act & Assert
    expect(() => new UserId('')).toThrow('UserId no puede estar vacío');
  });

  it('throws when the value is only whitespace', () => {
    // Act & Assert
    expect(() => new UserId('   ')).toThrow('UserId no puede estar vacío');
  });
});
