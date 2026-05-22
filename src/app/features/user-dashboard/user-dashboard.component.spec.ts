import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { UserDashboardComponent } from './user-dashboard.component';
import { WebSocketService, WsMessage, WsStatus } from '../../core/services/websocket.service';
import type { User } from '../../core/models/user.model';

const MOCK_USERS: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin',  status: 'active'   },
  { id: 2, name: 'Bob',   email: 'bob@example.com',   role: 'viewer', status: 'inactive' },
  { id: 3, name: 'Carol', email: 'carol@example.com', role: 'admin',  status: 'active'   },
];

function buildMockWsService(initialStatus: WsStatus = 'connected') {
  const messages$ = new Subject<WsMessage>();
  const status$   = new BehaviorSubject<WsStatus>(initialStatus);
  return {
    messages$:  messages$.asObservable(),
    status$:    status$.asObservable(),
    connect:    jasmine.createSpy('connect'),
    send:       jasmine.createSpy('send'),
    disconnect: jasmine.createSpy('disconnect'),
    _messages$: messages$,
    _status$:   status$,
  };
}

describe('UserDashboardComponent', () => {
  let fixture:   ComponentFixture<UserDashboardComponent>;
  let component: UserDashboardComponent;
  let el:        HTMLElement;
  let httpMock:  HttpTestingController;
  let wsService: ReturnType<typeof buildMockWsService>;

  function query<T extends HTMLElement>(selector: string): T | null {
    return el.querySelector(selector);
  }

  function flushUsers(): void {
    httpMock.expectOne('/api/users').flush(MOCK_USERS);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    wsService = buildMockWsService();

    await TestBed.configureTestingModule({
      imports: [UserDashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: WebSocketService, useValue: wsService },
      ],
    }).compileComponents();

    httpMock  = TestBed.inject(HttpTestingController);
    fixture   = TestBed.createComponent(UserDashboardComponent);
    component = fixture.componentInstance;
    el        = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  // ── Loading ─────────────────────────────────────────────────────────────────

  it('should show loading indicator while fetching users', () => {
    expect(query('[role="status"]')).toBeTruthy();
    httpMock.expectOne('/api/users').flush([]);
  });

  it('should hide loading after data loads', () => {
    flushUsers();
    expect(query('[role="status"]')).toBeNull();
  });

  it('should display users after successful load', () => {
    flushUsers();
    expect(el.textContent).toContain('Alice');
    expect(el.textContent).toContain('Bob');
    expect(el.textContent).toContain('Carol');
  });

  // ── Error state ─────────────────────────────────────────────────────────────

  it('should show error alert when API returns 500', () => {
    httpMock.expectOne('/api/users').flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    const alert = query('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert!.textContent).toContain('Failed to load');
  });

  it('should show Retry button on error', () => {
    httpMock.expectOne('/api/users').flush('', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(el.textContent).toContain('Retry');
  });

  it('should reload users when Retry clicked', fakeAsync(() => {
    httpMock.expectOne('/api/users').flush('', { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    const retryBtn = el.querySelector('button') as HTMLButtonElement;
    retryBtn.click();
    tick();

    httpMock.expectOne('/api/users').flush(MOCK_USERS);
    fixture.detectChanges();

    expect(el.textContent).toContain('Alice');
  }));

  // ── Add user form ───────────────────────────────────────────────────────────

  it('should show Add User button', () => {
    flushUsers();
    expect(el.textContent).toContain('Add User');
  });

  it('should show form panel when Add User clicked', () => {
    flushUsers();
    const addBtn = Array.from(el.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Add User')) as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();
    expect(query('[data-testid="form-panel"]')).toBeTruthy();
  });

  it('should hide form when cancelled', () => {
    flushUsers();
    component.showForm = true;
    fixture.detectChanges();
    component.showForm = false;
    fixture.detectChanges();
    expect(query('[data-testid="form-panel"]')).toBeNull();
  });

  // ── WebSocket status ────────────────────────────────────────────────────────

  it('should render ws-status indicator', () => {
    flushUsers();
    expect(query('[data-testid="ws-status"]')).toBeTruthy();
  });

  it('should display "connected" data-status', () => {
    flushUsers();
    const indicator = query('[data-testid="ws-status"]');
    expect(indicator?.getAttribute('data-status')).toBe('connected');
  });

  it('should update to "disconnected" when WS drops', () => {
    flushUsers();
    wsService._status$.next('disconnected');
    fixture.detectChanges();
    const indicator = query('[data-testid="ws-status"]');
    expect(indicator?.getAttribute('data-status')).toBe('disconnected');
  });

  // ── Live WebSocket updates ──────────────────────────────────────────────────

  it('should update grid row on USER_UPDATED message', () => {
    flushUsers();
    wsService._messages$.next({
      type: 'USER_UPDATED',
      payload: { id: 1, name: 'Alice (Updated)', email: 'alice@example.com', role: 'admin', status: 'active' },
    });
    fixture.detectChanges();
    expect(el.textContent).toContain('Alice (Updated)');
    expect(el.textContent).not.toContain('Alice (');
  });

  it('should add new row on USER_CREATED message', () => {
    flushUsers();
    wsService._messages$.next({
      type: 'USER_CREATED',
      payload: { id: 99, name: 'Dan', email: 'dan@example.com', role: 'viewer', status: 'active' },
    });
    fixture.detectChanges();
    expect(el.textContent).toContain('Dan');
  });

  it('should remove row on USER_DELETED message', () => {
    flushUsers();
    expect(el.textContent).toContain('Bob');
    wsService._messages$.next({ type: 'USER_DELETED', payload: { id: 2 } });
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Bob');
  });
});
