import { Address } from './address.vo';

describe('Address value object', () => {
  const valid = {
    street: 'Av. Siempre Viva 742',
    city: 'Lima',
    state: 'Lima',
    postalCode: '15001',
    country: 'PE',
  };

  it('accepts an address with street, city and country', () => {
    // Act
    const address = new Address(
      valid.street,
      valid.city,
      valid.state,
      valid.postalCode,
      valid.country,
    );

    // Assert
    expect(address.street).toBe(valid.street);
    expect(address.city).toBe(valid.city);
    expect(address.country).toBe(valid.country);
  });

  it('throws when the street is missing', () => {
    // Act & Assert
    expect(
      () =>
        new Address('', valid.city, valid.state, valid.postalCode, valid.country),
    ).toThrow('La calle, ciudad y país son obligatorios para la dirección');
  });

  it('throws when the city is missing', () => {
    // Act & Assert
    expect(
      () =>
        new Address(valid.street, '', valid.state, valid.postalCode, valid.country),
    ).toThrow('La calle, ciudad y país son obligatorios para la dirección');
  });

  it('throws when the country is missing', () => {
    // Act & Assert
    expect(
      () =>
        new Address(valid.street, valid.city, valid.state, valid.postalCode, ''),
    ).toThrow('La calle, ciudad y país son obligatorios para la dirección');
  });
});
