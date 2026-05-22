import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed }         from '@angular/core/testing';
import { provideRouter }                     from '@angular/router';
import { DashboardPageComponent }            from './dashboard-page.component';
import { RootOrdersService }                 from '../../features/dashboard/services/root-orders.service';
import { FlowSelectionService }              from '../../shared/services/core/flow-selection.service';

// ─────────────────────────────────────────────────────────────────────────────
// Stub child components
// Prevents TestBed from compiling real children and their dependencies
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Setup helper
// ─────────────────────────────────────────────────────────────────────────────

async function setup(initialTab = 'orders'): Promise<{
  fixture:   ComponentFixture<DashboardPageComponent>;
  component: DashboardPageComponent;
  el:        HTMLElement;
  tabSignal: WritableSignal<string>;
}> {
  const tabSignal = signal(initialTab);

  await TestBed.configureTestingModule({
    imports: [DashboardPageComponent],
    providers: [
      provideRouter([]),
      {
        provide:  RootOrdersService,
        useValue: { selectedRootOrderFilter: tabSignal },
      },
      {
        provide:  FlowSelectionService,
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

  return { fixture, component, el: fixture.nativeElement as HTMLElement, tabSignal };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('DashboardPageComponent', () => {

  afterEach(() => TestBed.resetTestingModule());

  // ── Component creation ────────────────────────────────────────────────────

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render the dashboard container', async () => {
    const { el } = await setup();
    expect(el.querySelector('.dashboard-container')).toBeTruthy();
  });

  // ── selectedTab computed signal ───────────────────────────────────────────

  it('selectedTab() should return "orders" when service returns "orders"', async () => {
    const { component } = await setup('orders');
    expect(component.selectedTab()).toBe('orders');
  });

  it('selectedTab() should return "summary" when service returns "summary"', async () => {
    const { component } = await setup('summary');
    expect(component.selectedTab()).toBe('summary');
  });

  it('selectedTab() should return "slice" when service returns "slice"', async () => {
    const { component } = await setup('slice');
    expect(component.selectedTab()).toBe('slice');
  });

  // ── Split-pane layout — @if (selectedTab() !== 'summary') ─────────────────

  it('should render app-root-orders when tab is "orders"', async () => {
    const { el } = await setup('orders');
    expect(el.querySelector('app-root-orders')).toBeTruthy();
  });

  it('should render app-slice-orders when tab is "orders"', async () => {
    const { el } = await setup('orders');
    expect(el.querySelector('app-slice-orders')).toBeTruthy();
  });

  it('should render app-market-view when tab is "orders"', async () => {
    const { el } = await setup('orders');
    expect(el.querySelector('app-market-view')).toBeTruthy();
  });

  it('should render tickets-created when tab is "orders"', async () => {
    const { el } = await setup('orders');
    expect(el.querySelector('tickets-created')).toBeTruthy();
  });

  it('should NOT render summary grid when tab is "orders"', async () => {
    const { el } = await setup('orders');
    expect(el.querySelector('app-summary-details-orders-grid')).toBeNull();
  });

  it('should render split-pane layout when tab is "slice"', async () => {
    const { el } = await setup('slice');
    expect(el.querySelector('app-root-orders')).toBeTruthy();
    expect(el.querySelector('app-slice-orders')).toBeTruthy();
    expect(el.querySelector('app-market-view')).toBeTruthy();
  });

  it('should NOT render summary grid when tab is "slice"', async () => {
    const { el } = await setup('slice');
    expect(el.querySelector('app-summary-details-orders-grid')).toBeNull();
  });

  // ── Summary layout — @else block ──────────────────────────────────────────

  it('should render summary grid when tab is "summary"', async () => {
    const { el } = await setup('summary');
    expect(el.querySelector('app-summary-details-orders-grid')).toBeTruthy();
  });

  it('should NOT render app-root-orders when tab is "summary"', async () => {
    const { el } = await setup('summary');
    expect(el.querySelector('app-root-orders')).toBeNull();
  });

  it('should NOT render app-slice-orders when tab is "summary"', async () => {
    const { el } = await setup('summary');
    expect(el.querySelector('app-slice-orders')).toBeNull();
  });

  it('should NOT render app-market-view when tab is "summary"', async () => {
    const { el } = await setup('summary');
    expect(el.querySelector('app-market-view')).toBeNull();
  });

  it('should NOT render tickets-created when tab is "summary"', async () => {
    const { el } = await setup('summary');
    expect(el.querySelector('tickets-created')).toBeNull();
  });

  it('should show Summary Details card title in summary view', async () => {
    const { el } = await setup('summary');
    expect(el.textContent).toContain('Summary Details');
  });

  // ── Reactive signal changes ────────────────────────────────────────────────

  it('should switch to summary view when signal changes from "orders" to "summary"', async () => {
    const { fixture, el, tabSignal } = await setup('orders');

    expect(el.querySelector('app-root-orders')).toBeTruthy();
    expect(el.querySelector('app-summary-details-orders-grid')).toBeNull();

    tabSignal.set('summary');
    fixture.detectChanges();

    expect(el.querySelector('app-summary-details-orders-grid')).toBeTruthy();
    expect(el.querySelector('app-root-orders')).toBeNull();
  });

  it('should switch back to split view when signal changes from "summary" to "orders"', async () => {
    const { fixture, el, tabSignal } = await setup('summary');

    expect(el.querySelector('app-summary-details-orders-grid')).toBeTruthy();
    expect(el.querySelector('app-root-orders')).toBeNull();

    tabSignal.set('orders');
    fixture.detectChanges();

    expect(el.querySelector('app-root-orders')).toBeTruthy();
    expect(el.querySelector('app-summary-details-orders-grid')).toBeNull();
  });

  it('should switch to summary view when signal changes from "slice" to "summary"', async () => {
    const { fixture, el, tabSignal } = await setup('slice');

    expect(el.querySelector('app-slice-orders')).toBeTruthy();

    tabSignal.set('summary');
    fixture.detectChanges();

    expect(el.querySelector('app-summary-details-orders-grid')).toBeTruthy();
    expect(el.querySelector('app-slice-orders')).toBeNull();
  });

  it('should switch from "summary" to "slice" correctly', async () => {
    const { fixture, el, tabSignal } = await setup('summary');

    tabSignal.set('slice');
    fixture.detectChanges();

    expect(el.querySelector('app-slice-orders')).toBeTruthy();
    expect(el.querySelector('app-summary-details-orders-grid')).toBeNull();
  });
});
