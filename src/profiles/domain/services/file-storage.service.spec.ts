import {
  ALLOWED_CONTENT_TYPES,
  resolveFileExtension,
} from './file-storage.service';

describe('resolveFileExtension', () => {
  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['application/pdf', 'pdf'],
  ])('maps %s to .%s', (contentType, extension) => {
    expect(resolveFileExtension(contentType)).toBe(extension);
  });

  it.each(['image/gif', 'text/html', 'application/x-msdownload', ''])(
    'refuses the unsupported content type "%s"',
    (contentType) => {
      expect(() => resolveFileExtension(contentType)).toThrow(
        'Tipo de contenido no soportado',
      );
    },
  );

  it('exposes exactly the supported content types', () => {
    expect([...ALLOWED_CONTENT_TYPES].sort()).toEqual([
      'application/pdf',
      'image/jpeg',
      'image/png',
    ]);
  });
});
