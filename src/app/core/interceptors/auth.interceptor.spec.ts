import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let httpClient:  HttpClient;
  let httpMock:    HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        AuthService,
      ],
    });
    httpClient  = TestBed.inject(HttpClient);
    httpMock    = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    jasmine.clock().uninstall();
  });

  it('attaches Authorization header when token exists', () => {
    spyOn(authService, 'getToken').and.returnValue('valid-token');
    httpClient.get('/api/users').subscribe();
    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
    req.flush([]);
  });

  it('does not add Authorization header when no token', () => {
    spyOn(authService, 'getToken').and.returnValue(null);
    httpClient.get('/api/users').subscribe();
    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('refreshes token on 401 and retries request', () => {
    spyOn(authService, 'getToken').and.returnValue('expired-token');
    const setTokenSpy = spyOn(authService, 'setToken');

    let result: unknown;
    httpClient.get('/api/users').subscribe(r => (result = r));

    httpMock.expectOne('/api/users').flush(
      { message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' }
    );

    const refreshReq = httpMock.expectOne('/api/auth/refresh');
    expect(refreshReq.request.method).toBe('POST');
    refreshReq.flush({ token: 'new-jwt-token' });

    const retryReq = httpMock.expectOne('/api/users');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-jwt-token');
    retryReq.flush([{ id: 1, name: 'Alice' }]);

    expect(setTokenSpy).toHaveBeenCalledWith('new-jwt-token');
    expect(result).toEqual([{ id: 1, name: 'Alice' }]);
  });

  it('calls logout when refresh returns 401', () => {
    spyOn(authService, 'getToken').and.returnValue('expired-token');
    const logoutSpy = spyOn(authService, 'logout');

    httpClient.get('/api/users').subscribe({ error: () => {} });
    httpMock.expectOne('/api/users').flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('does not intercept /api/auth/refresh (prevents infinite loop)', () => {
    spyOn(authService, 'getToken').and.returnValue('expired-token');

    httpClient.post('/api/auth/refresh', {}).subscribe({ error: () => {} });
    httpMock.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectNone('/api/auth/refresh');
  });

  it('propagates 403 without attempting refresh', () => {
    spyOn(authService, 'getToken').and.returnValue('valid-token');
    const logoutSpy = spyOn(authService, 'logout');

    httpClient.delete('/api/users/1').subscribe({ error: err => expect(err.status).toBe(403) });
    httpMock.expectOne('/api/users/1').flush({}, { status: 403, statusText: 'Forbidden' });

    expect(logoutSpy).not.toHaveBeenCalled();
    httpMock.expectNone('/api/auth/refresh');
  });
});
