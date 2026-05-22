import { HttpTestingController } from '@angular/common/http/testing';
import { ngSetup } from '../../../testing/jasmine-kit';
import { UserService } from './user.service';

describe('UserService', () => {
  let service:  UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    ({ service, httpMock } = ngSetup(UserService));
  });

  afterEach(() => httpMock.verify());

  it('fetches all users', () => {
    const mock = [
      { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin',  status: 'active'   },
      { id: 2, name: 'Bob',   email: 'bob@example.com',   role: 'viewer', status: 'inactive' },
    ];
    service.getUsers().subscribe(users => {
      expect(users.length).toBe(2);
      expect(users[0].name).toBe('Alice');
    });
    httpMock.expectOne('/api/users').flush(mock);
  });

  it('propagates 500 error', () => {
    service.getUsers().subscribe({ error: err => expect(err.status).toBe(500) });
    httpMock.expectOne('/api/users').flush('', { status: 500, statusText: 'Server Error' });
  });

  it('propagates 503 error', () => {
    service.getUsers().subscribe({ error: err => expect(err.status).toBe(503) });
    httpMock.expectOne('/api/users').flush('', { status: 503, statusText: 'Unavailable' });
  });

  it('fetches single user by id', () => {
    const mock = { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin', status: 'active' };
    service.getUserById(1).subscribe(u => expect(u.name).toBe('Alice'));
    httpMock.expectOne('/api/users/1').flush(mock);
  });

  it('propagates 404 for unknown user', () => {
    service.getUserById(999).subscribe({ error: err => expect(err.status).toBe(404) });
    httpMock.expectOne('/api/users/999').flush('', { status: 404, statusText: 'Not Found' });
  });

  it('creates user and returns it with id', () => {
    const dto = { name: 'Dan', email: 'dan@example.com', role: 'viewer' as const };
    service.createUser(dto).subscribe(u => expect(u.id).toBe(99));
    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ id: 99, ...dto, status: 'active' }, { status: 201, statusText: 'Created' });
  });

  it('propagates 422 validation error', () => {
    service.createUser({ name: '', email: 'bad', role: 'viewer' }).subscribe({
      error: err => expect(err.status).toBe(422),
    });
    httpMock.expectOne('/api/users').flush('', { status: 422, statusText: 'Unprocessable' });
  });

  it('updates user and returns updated data', () => {
    service.updateUser(1, { name: 'Alice Updated' }).subscribe(u =>
      expect(u.name).toBe('Alice Updated')
    );
    httpMock.expectOne('/api/users/1').flush(
      { id: 1, name: 'Alice Updated', email: 'a@a.com', role: 'admin', status: 'active' }
    );
  });

  it('handles 403 on delete', () => {
    service.deleteUser(1).subscribe({ error: err => expect(err.status).toBe(403) });
    httpMock.expectOne('/api/users/1').flush('', { status: 403, statusText: 'Forbidden' });
  });
});
