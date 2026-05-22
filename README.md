# ng-jasmine-kit

Zero-config Angular 19 testing library using **Jasmine + Karma**.
Works out of the box with every Angular CLI project.
No new npm packages. No SSL certificate errors.

---

## Why Jasmine + Karma

| | Jasmine + Karma | Vitest | Jest |
|---|---|---|---|
| Pre-installed by Angular CLI | YES | No | No |
| Corporate proxy/SSL issues | NONE | Common | Common |
| New npm packages needed | 0 | 5+ | 5+ |
| Works with `ng test` | YES | Needs config | Needs config |
| Angular 19 support | Built-in | Experimental | Stable |

---

## Setup — 1 command

```bash
ng test
```

That's it. Everything is already installed by Angular CLI.

---

## File structure

```
src/
├── testing/
│   ├── jasmine-kit.ts         ← Core API (ngSetup, ngComponent, mockSignal)
│   └── ag-grid.harness.ts     ← AG Grid v33 utilities
└── app/
    ├── core/
    │   ├── services/
    │   │   ├── user.service.spec.ts        ← 9 tests
    │   │   └── websocket.service.spec.ts   ← 9 tests
    │   └── interceptors/
    │       └── auth.interceptor.spec.ts    ← 6 tests
    └── features/
        ├── user-grid/
        │   └── user-grid.component.spec.ts ← 15 tests
        ├── user-form/
        │   └── user-form.component.spec.ts ← 13 tests
        └── user-dashboard/
            ├── user-dashboard.component.spec.ts  ← 14 tests
            └── dashboard-page.component.spec.ts  ← 11 tests
karma.conf.js
angular.json
tsconfig.spec.json
```

---

## Import from jasmine-kit only

```ts
import { ngSetup, ngComponent, mockSignal, createSpy, createSpyObj } from '../../testing/jasmine-kit';
import { AgGridHarness } from '../../testing/ag-grid.harness';
```

---

## Jasmine vs Jest/Vitest cheat sheet

```
Jest/Vitest            Jasmine
─────────────────────────────────────────────
jest.fn()              jasmine.createSpy('name')
vi.fn()                jasmine.createSpy('name')

jest.spyOn(obj,'m')    spyOn(obj, 'm')
vi.spyOn(obj,'m')      spyOn(obj, 'm')

mockFn.mockReturnValue(x)  spy.and.returnValue(x)
mockFn.mockReturnValue(of(x))  spy.and.returnValue(of(x))

expect(fn).toHaveBeenCalled()      expect(spy).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(x) expect(spy).toHaveBeenCalledWith(x)
expect(fn).toHaveBeenCalledTimes(1) expect(spy).toHaveBeenCalledTimes(1)

vi.useFakeTimers()     jasmine.clock().install()
vi.advanceTimersByTime(ms) jasmine.clock().tick(ms)
vi.useRealTimers()     jasmine.clock().uninstall()

fakeAsync + tick()     fakeAsync + tick()   ← IDENTICAL
```

---

## Service test pattern

```ts
import { ngSetup } from '../../testing/jasmine-kit';
import { UserService } from './user.service';

describe('UserService', () => {
  let service:  UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    ({ service, httpMock } = ngSetup(UserService));
  });
  afterEach(() => httpMock.verify());

  it('fetches users', () => {
    service.getUsers().subscribe(users => {
      expect(users.length).toBe(2);
    });
    httpMock.expectOne('/api/users').flush(mockUsers);
  });
});
```

## Component test pattern

```ts
import { fakeAsync, tick } from '@angular/core/testing';

it('calls createUser on valid submit', fakeAsync(() => {
  setInputValue('#name',  'Alice');
  setInputValue('#email', 'alice@example.com');
  query<HTMLButtonElement>('button[type="submit"]').click();
  tick(); // flushes all async operations
  expect(mockSvc.createUser).toHaveBeenCalledWith({
    name: 'Alice', email: 'alice@example.com', role: 'viewer',
  });
}));
```

## Signal component test pattern

```ts
import { mockSignal } from '../../testing/jasmine-kit';

it('switches to summary view when signal changes', async () => {
  const selectedTab = mockSignal('orders');

  // ... setup with selectedTab in providers ...

  expect(el.querySelector('app-root-orders')).toBeTruthy();

  selectedTab.set('summary');
  fixture.detectChanges();

  expect(el.querySelector('app-summary-details-orders-grid')).toBeTruthy();
});
```

## AG Grid test pattern

```ts
import { AgGridHarness } from '../../testing/ag-grid.harness';

harness = new AgGridHarness(fixture, () => component.gridApi);
await harness.waitForGrid();

await harness.applyColumnFilter('name', 'Alice');
expect(harness.getRowCount()).toBe(1);

await harness.sortColumn('name', 'desc');
expect(harness.getCellValue(0, 'name')).toBe('Carol');
```
