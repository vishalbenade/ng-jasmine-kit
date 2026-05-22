/**
 * DashboardPageComponent — Jasmine spec
 * Tests selectedTab signal logic and @if template switching.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardPageComponent } from './dashboard-page.component';
import { RootOrdersService } from '../../features/dashboard/services/root-orders.service';
import { FlowSelectionService } from '../../shared/services/core/flow-selection.service';
import { mockSignal } from '../../../testing/jasmine-kit';

// ── Stub all child components ─────────────────────────────────────────────────
@Component({ selector: 'app-root-orders',                 standalone: true, template: '' })
class MockRootOrdersComponent {}

@Component({ selector: 'app-slice-orders',                standalone: true, template: '' })
class MockSliceOrdersComponent {}

@Component({ selector: 'tickets-created',                 standalone: true, template: '' })
class MockTicketsCreatedComponent {}

@Component({ selector: 'app-market-view',                 standalone: true, template: '' })
class MockMarketViewComponent {}

@Component({ selector: 'app-summary-details-orders-grid', standalone: true, template: '' })
class MockSummaryDetailsGridComponent {}

// ── Helper ────────────────────────────────────────────────────────────────────
async function createComponent(tab = 'orders') {
  const selectedRootOrderFilter = mockSignal(tab);

  await TestBed.configureTestingModule({
    imports: [DashboardPageComponent],
    providers: [
      provideRouter([]),
      {
        provide: RootOrdersService,
        useValue: { selectedRootOrderFilter },
      },
      {
        provide: FlowSelectionService,
        useValue: {},
      },
    ],
  })
  .overrideComponent(DashboardPageComponent, {
    add: {
      imports: [
        MockRootOrdersComponent,
        MockSliceOrdersComponent,
        MockTicketsCreatedComponent,
        MockMarketViewComponent,
        MockSummaryDetailsGridComponent,
      ],
    },
  })
  .compileComponents();

  const fixture   = TestBed.createComponent(DashboardPageComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, el: fixture.nativeElement as HTMLElement, selectedRootOrderFilter };
}

describe('DashboardPageComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('should render dashboard container', async () => {
    const { el } = await createComponent();
    expect(el.querySelector('.dashboard-container')).toBeTruthy();
  });

  // ── selectedTab computed signal ────────────────────────────────────────────

  it('selectedTab() should return "orders" when service returns "orders"', async () => {
    const { component } = await createComponent('orders');
    expect(component.selectedTab()).toBe('orders');
  });

  it('selectedTab() should return "summary" when service returns "summary"', async () => {
    const { component } = await createComponent('summary');
    expect(component.selectedTab()).toBe('summary');
  });

  // ── Split-pane view (non-summary) ──────────────────────────────────────────

  it('should render split-pane components when tab is "orders"', async () => {
    const { el } = await createComponent('orders');
    expect(el.querySelector('app-root-orders')).toBeTruthy();
    expect(el.querySelector('app-slice-orders')).toBeTruthy();
    expect(el.querySelector('app-market-view')).toBeTruthy();
    expect(el.querySelector('tickets-created')).toBeTruthy();
  });

  it('should NOT render summary grid when tab is "orders"', async () => {
    const { el } = await createComponent('orders');
    expect(el.querySelector('app-summary-details-orders-grid')).toBeNull();
  });

  it('should render split-pane when tab is "slice"', async () => {
    const { el } = await createComponent('slice');
    expect(el.querySelector('app-root-orders')).toBeTruthy();
    expect(el.querySelector('app-slice-orders')).toBeTruthy();
  });

  // ── Summary view ───────────────────────────────────────────────────────────

  it('should render summary grid when tab is "summary"', async () => {
    const { el } = await createComponent('summary');
    expect(el.querySelector('app-summary-details-orders-grid')).toBeTruthy();
  });

  it('should NOT render split-pane when tab is "summary"', async () => {
    const { el } = await createComponent('summary');
    expect(el.querySelector('app-root-orders')).toBeNull();
    expect(el.querySelector('app-slice-orders')).toBeNull();
    expect(el.querySelector('app-market-view')).toBeNull();
    expect(el.querySelector('tickets-created')).toBeNull();
  });

  it('should show Summary Details card title in summary view', async () => {
    const { el } = await createComponent('summary');
    expect(el.textContent).toContain('Summary Details');
  });

  // ── Reactive signal updates ────────────────────────────────────────────────

  it('should switch to summary view when signal changes to "summary"', async () => {
    const { fixture, el, selectedRootOrderFilter } = await createComponent('orders');

    expect(el.querySelector('app-root-orders')).toBeTruthy();

    selectedRootOrderFilter.set('summary');
    fixture.detectChanges();

    expect(el.querySelector('app-summary-details-orders-grid')).toBeTruthy();
    expect(el.querySelector('app-root-orders')).toBeNull();
  });

  it('should switch back to split view when signal changes from "summary" to "orders"', async () => {
    const { fixture, el, selectedRootOrderFilter } = await createComponent('summary');

    expect(el.querySelector('app-summary-details-orders-grid')).toBeTruthy();

    selectedRootOrderFilter.set('orders');
    fixture.detectChanges();

    expect(el.querySelector('app-root-orders')).toBeTruthy();
    expect(el.querySelector('app-summary-details-orders-grid')).toBeNull();
  });
});
