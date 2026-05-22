import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { UserFormComponent } from './user-form.component';
import { UserService } from '../../core/services/user.service';
import type { User } from '../../core/models/user.model';

const CREATED_USER: User = {
  id: 99, name: 'New User', email: 'new@example.com', role: 'viewer', status: 'active',
};

function buildMockService(overrides = {}) {
  return {
    createUser: jasmine.createSpy('createUser').and.returnValue(of(CREATED_USER)),
    ...overrides,
  };
}

describe('UserFormComponent', () => {
  let fixture:   ComponentFixture<UserFormComponent>;
  let component: UserFormComponent;
  let el:        HTMLElement;

  function query<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  function setInputValue(selector: string, value: string): void {
    const input = query<HTMLInputElement>(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
      providers: [{ provide: UserService, useValue: buildMockService() }],
    }).compileComponents();

    fixture   = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    el        = fixture.nativeElement;
    fixture.detectChanges();
  });

  // ── Initial state ───────────────────────────────────────────────────────────

  it('should render all form fields', () => {
    expect(query('#name')).toBeTruthy();
    expect(query('#email')).toBeTruthy();
    expect(query('#role')).toBeTruthy();
  });

  it('should disable submit button on empty form', () => {
    const btn = query<HTMLButtonElement>('button[type="submit"]');
    expect(btn.disabled).toBeTrue();
  });

  it('should default role to "viewer"', () => {
    const select = query<HTMLSelectElement>('#role');
    expect(select.value).toBe('viewer');
  });

  // ── Name validation ─────────────────────────────────────────────────────────

  it('should show "Name is required" after touching empty name', () => {
    setInputValue('#name', '');
    expect(el.textContent).toContain('Name is required');
  });

  it('should show minlength error for 1-char name', () => {
    setInputValue('#name', 'A');
    expect(el.textContent).toContain('at least 2 characters');
  });

  it('should NOT show name error for valid name', () => {
    setInputValue('#name', 'Alice');
    expect(el.textContent).not.toContain('Name is required');
    expect(el.textContent).not.toContain('at least 2 characters');
  });

  // ── Email validation ────────────────────────────────────────────────────────

  it('should show "Email is required" after blur on empty email', () => {
    setInputValue('#email', '');
    expect(el.textContent).toContain('Email is required');
  });

  it('should show invalid email error for malformed email', () => {
    setInputValue('#email', 'not-an-email');
    expect(el.textContent).toContain('Invalid email format');
  });

  // ── Submit — happy path ─────────────────────────────────────────────────────

  it('should enable submit when all fields are valid', () => {
    setInputValue('#name',  'Alice');
    setInputValue('#email', 'alice@example.com');
    const btn = query<HTMLButtonElement>('button[type="submit"]');
    expect(btn.disabled).toBeFalse();
  });

  it('should call createUser with form values on submit', fakeAsync(() => {
    const mockSvc = TestBed.inject(UserService) as ReturnType<typeof buildMockService>;

    setInputValue('#name',  'New User');
    setInputValue('#email', 'new@example.com');

    query<HTMLButtonElement>('button[type="submit"]').click();
    tick();

    expect(mockSvc.createUser).toHaveBeenCalledWith({
      name:  'New User',
      email: 'new@example.com',
      role:  'viewer',
    });
  }));

  it('should emit userCreated event on success', fakeAsync(() => {
    const emitSpy = spyOn(component.userCreated, 'emit');

    setInputValue('#name',  'New User');
    setInputValue('#email', 'new@example.com');
    query<HTMLButtonElement>('button[type="submit"]').click();
    tick();

    expect(emitSpy).toHaveBeenCalledWith(CREATED_USER);
  }));

  it('should reset form after successful submission', fakeAsync(() => {
    setInputValue('#name',  'Alice');
    setInputValue('#email', 'alice@example.com');
    query<HTMLButtonElement>('button[type="submit"]').click();
    tick();
    fixture.detectChanges();

    expect(query<HTMLInputElement>('#name').value).toBe('');
  }));

  // ── Submit — error path ─────────────────────────────────────────────────────

  it('should show API error message on 422', fakeAsync(() => {
    TestBed.overrideProvider(UserService, {
      useValue: buildMockService({
        createUser: jasmine.createSpy().and.returnValue(
          throwError(() => ({ error: { message: 'Email already taken' } }))
        ),
      }),
    });
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    setInputValue('#name',  'Alice');
    setInputValue('#email', 'alice@example.com');
    query<HTMLButtonElement>('button[type="submit"]').click();
    tick();
    fixture.detectChanges();

    expect(el.textContent).toContain('Email already taken');
  }));

  it('should re-enable submit after API error', fakeAsync(() => {
    TestBed.overrideProvider(UserService, {
      useValue: buildMockService({
        createUser: jasmine.createSpy().and.returnValue(throwError(() => ({}))),
      }),
    });
    fixture   = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    setInputValue('#name',  'Alice');
    setInputValue('#email', 'alice@example.com');
    query<HTMLButtonElement>('button[type="submit"]').click();
    tick();
    fixture.detectChanges();

    const btn = query<HTMLButtonElement>('button[type="submit"]');
    expect(btn.disabled).toBeFalse();
  }));

  // ── Cancel ──────────────────────────────────────────────────────────────────

  it('should emit cancelled event when Cancel clicked', () => {
    const emitSpy = spyOn(component.cancelled, 'emit');
    query<HTMLButtonElement>('button[type="button"]').click();
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('should clear form values when Cancel clicked', () => {
    setInputValue('#name', 'Temp Name');
    query<HTMLButtonElement>('button[type="button"]').click();
    fixture.detectChanges();
    expect(query<HTMLInputElement>('#name').value).toBe('');
  });
});
