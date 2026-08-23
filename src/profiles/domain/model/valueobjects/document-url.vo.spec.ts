import { DocumentUrl } from './document-url.vo';

describe('DocumentUrl value object', () => {
  it('accepts a url starting with http', () => {
    // Arrange
    const url = 'https://storage.vankoo.com/ruc.pdf';

    // Act
    const documentUrl = new DocumentUrl(url);

    // Assert
    expect(documentUrl.url).toBe(url);
  });

  it('throws when the url does not start with http', () => {
    // Arrange
    const url = 'ftp://storage.vankoo.com/ruc.pdf';

    // Act & Assert
    expect(() => new DocumentUrl(url)).toThrow(
      'La URL del documento es inválida',
    );
  });
});
