import api, { AUTH_TOKEN_STORAGE_KEY, getApiError, storeToken } from '../../services/api';

describe('central API authentication interceptors', () => {
  beforeEach(() => localStorage.clear());

  test('attaches the current Bearer token to every request', () => {
    storeToken('header.payload.signature');
    const requestHandler = api.interceptors.request.handlers[0].fulfilled;
    const config = requestHandler({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer header.payload.signature');
  });

  test('does not attach Authorization for anonymous requests', () => {
    const requestHandler = api.interceptors.request.handlers[0].fulfilled;
    expect(requestHandler({ headers: {} }).headers.Authorization).toBeUndefined();
  });

  test('a 401 response clears the token and broadcasts centralized logout', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'expired-token');
    const listener = jest.fn();
    window.addEventListener('auth:unauthorized', listener);
    const error = { response: { status: 401, data: { code: 'TOKEN_EXPIRED' } } };
    const responseHandler = api.interceptors.response.handlers[0].rejected;

    await expect(responseHandler(error)).rejects.toBe(error);

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail.code).toBe('TOKEN_EXPIRED');
    window.removeEventListener('auth:unauthorized', listener);
  });

  test('normalizes backend field errors without exposing a stack trace', () => {
    const error = getApiError({
      response: { status: 409, data: { message: 'Email đã tồn tại.', code: 'EMAIL_EXISTS', errors: { email: 'Trùng email' } } },
    });

    expect(error).toMatchObject({ message: 'Email đã tồn tại.', code: 'EMAIL_EXISTS', status: 409, errors: { email: 'Trùng email' } });
  });

  test('turns a missing custom Auth route into an actionable Vietnamese message', () => {
    const error = getApiError({
      message: 'Request failed with status code 404',
      response: { status: 404, data: { error: 'Not Found' } },
    }, 'Đăng nhập thất bại.');

    expect(error.message).toContain('npm run server');
    expect(error.message).not.toContain('Request failed with status code 404');
    expect(error.status).toBe(404);
  });
});
