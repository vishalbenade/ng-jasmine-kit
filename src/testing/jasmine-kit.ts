/**
 * jasmine-kit — Angular 19 test utilities for Jasmine + Karma.
 * Zero external dependencies. Uses only what Angular CLI installs.
 *
 * USAGE:
 *   import { ngSetup, ngComponent, mockSignal, createSpy, createSpyObj } from '../../testing/jasmine-kit';
 */
import { Type, signal, WritableSignal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

// ── Spy shortcuts ─────────────────────────────────────────────────────────────
// Jasmine equivalent of jest.fn() and jest.spyOn()
export const createSpy    = (name: string) => jasmine.createSpy(name);
export const createSpyObj = jasmine.createSpyObj.bind(jasmine);

// ── ngSetup — for service + interceptor tests ─────────────────────────────────
// Returns service instance + HttpTestingController
export function ngSetup<T>(
  serviceToken: Type<T>,
  extraProviders: unknown[] = [],
): { service: T; httpMock: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      serviceToken,
      ...extraProviders,
    ],
  });
  return {
    service:  TestBed.inject(serviceToken),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

// ── ngComponent — for component tests ────────────────────────────────────────
// Compiles + creates a standalone component fixture
export async function ngComponent<T>(
  componentType: Type<T>,
  options: { providers?: unknown[]; componentImports?: unknown[] } = {},
): Promise<{ fixture: ComponentFixture<T>; component: T }> {
  await TestBed.configureTestingModule({
    imports:   [componentType],
    providers: [
      provideHttpClient(),
      provideRouter([]),
      ...(options.providers ?? []),
    ],
  }).compileComponents();

  const fixture   = TestBed.createComponent(componentType);
  const component = fixture.componentInstance;
  return { fixture, component };
}

// ── mockSignal — writable Angular signal ──────────────────────────────────────
export function mockSignal<T>(initial: T): WritableSignal<T> {
  return signal(initial);
}

// ── waitMs — wait for async operations ───────────────────────────────────────
export const waitMs = (ms = 0) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));
