import { HttpDniVerificationService } from './http-dni-verification.service';
import { DisabledDniVerificationService } from './disabled-dni-verification.service';
import { DniVerificationUnavailableError } from '../../domain/services/dni-verification.service';

const REQUEST = {
  investorId: '0b6f1c9e-4d2a-4f7b-9a51-2e8d3c7f6a10',
  dni: '12345678',
  firstName: 'Juan Carlos',
  lastName: 'Perez Gomez',
};

function stubFetch(response: Partial<Response> | Error) {
  const fetchMock = jest.fn();
  if (response instanceof Error) fetchMock.mockRejectedValue(response);
  else fetchMock.mockResolvedValue(response);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function jsonResponse(status: number, body: unknown): Partial<Response> {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

describe('HttpDniVerificationService', () => {
  const originalFetch = global.fetch;
  const service = new HttpDniVerificationService(
    'http://localhost:7071/api/verify-dni',
    'secret-key',
    1000,
  );

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('envía la solicitud con la clave de función y devuelve el veredicto', async () => {
    const fetchMock = stubFetch(
      jsonResponse(200, { status: 'VERIFIED', source: 'eldni.com' }),
    );

    await expect(service.verify(REQUEST)).resolves.toEqual({
      status: 'VERIFIED',
      source: 'eldni.com',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:7071/api/verify-dni');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'x-functions-key': 'secret-key' });
    expect(JSON.parse(init.body as string)).toEqual(REQUEST);
  });

  it('no envía el header de clave cuando no hay clave (desarrollo local)', async () => {
    const fetchMock = stubFetch(
      jsonResponse(200, { status: 'NOT_FOUND', source: 'fake' }),
    );
    const local = new HttpDniVerificationService('http://x/verify', '', 1000);

    await local.verify(REQUEST);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).not.toHaveProperty('x-functions-key');
  });

  it.each([400, 401, 502, 500])(
    'trata un HTTP %d como fuente no disponible',
    async (status) => {
      stubFetch(jsonResponse(status, { title: 'error' }));

      await expect(service.verify(REQUEST)).rejects.toBeInstanceOf(
        DniVerificationUnavailableError,
      );
    },
  );

  it('trata un fallo de red como fuente no disponible', async () => {
    stubFetch(new Error('ECONNREFUSED'));

    await expect(service.verify(REQUEST)).rejects.toBeInstanceOf(
      DniVerificationUnavailableError,
    );
  });

  it('rechaza un estado desconocido', async () => {
    stubFetch(jsonResponse(200, { status: 'MAYBE' }));

    await expect(service.verify(REQUEST)).rejects.toBeInstanceOf(
      DniVerificationUnavailableError,
    );
  });
});

describe('DisabledDniVerificationService', () => {
  it('está apagado y nunca emite un veredicto', async () => {
    const disabled = new DisabledDniVerificationService();

    expect(disabled.enabled).toBe(false);
    await expect(disabled.verify()).rejects.toBeInstanceOf(
      DniVerificationUnavailableError,
    );
  });
});
