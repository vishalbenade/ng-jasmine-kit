import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserGridComponent } from './user-grid.component';
import { AgGridHarness } from '../../../testing/ag-grid.harness';
import type { User } from '../../core/models/user.model';

const MOCK_USERS: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin',  status: 'active'   },
  { id: 2, name: 'Bob',   email: 'bob@example.com',   role: 'viewer', status: 'inactive' },
  { id: 3, name: 'Carol', email: 'carol@example.com', role: 'admin',  status: 'active'   },
];

describe('UserGridComponent', () => {
  let fixture:   ComponentFixture<UserGridComponent>;
  let component: UserGridComponent;
  let harness:   AgGridHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserGridComponent],
    }).compileComponents();

    fixture           = TestBed.createComponent(UserGridComponent);
    component         = fixture.componentInstance;
    component.rowData = MOCK_USERS;
    fixture.detectChanges();

    harness = new AgGridHarness(fixture, () => component.gridApi);
    await harness.waitForGrid();
  });

  // ── Rendering ───────────────────────────────────────────────────────────────

  it('should render all rows from rowData', () => {
    expect(harness.getRowCount()).toBe(3);
  });

  it('should render correct cell values for row 0', () => {
    expect(harness.getCellValue(0, 'name')).toBe('Alice');
    expect(harness.getCellValue(0, 'email')).toBe('alice@example.com');
    expect(harness.getCellValue(0, 'role')).toBe('admin');
    expect(harness.getCellValue(0, 'status')).toBe('active');
  });

  it('should show 0 rows when rowData is empty', async () => {
    component.rowData = [];
    fixture.detectChanges();
    await harness.waitForGrid();
    expect(harness.getRowCount()).toBe(0);
  });

  it('should update rows when rowData input changes', async () => {
    component.rowData = [MOCK_USERS[0]];
    fixture.detectChanges();
    await harness.waitForGrid();
    expect(harness.getRowCount()).toBe(1);
  });

  // ── Filtering ───────────────────────────────────────────────────────────────

  it('should filter by name column', async () => {
    await harness.applyColumnFilter('name', 'Carol');
    expect(harness.getRowCount()).toBe(1);
    expect(harness.getCellValue(0, 'name')).toBe('Carol');
  });

  it('should filter by role column', async () => {
    await harness.applyColumnFilter('role', 'viewer');
    expect(harness.getRowCount()).toBe(1);
    expect(harness.getCellValue(0, 'name')).toBe('Bob');
  });

  it('should show 0 rows when filter matches nothing', async () => {
    await harness.applyColumnFilter('name', 'ZZZNONEXISTENT');
    expect(harness.getRowCount()).toBe(0);
  });

  it('should restore all rows after clearing filters', async () => {
    await harness.applyColumnFilter('name', 'Alice');
    await harness.clearAllFilters();
    expect(harness.getRowCount()).toBe(3);
  });

  it('should apply quick filter across all columns', async () => {
    await harness.setQuickFilter('carol@example.com');
    expect(harness.getRowCount()).toBe(1);
  });

  // ── Sorting ─────────────────────────────────────────────────────────────────

  it('should sort by name ascending', async () => {
    await harness.sortColumn('name', 'asc');
    expect(harness.getCellValue(0, 'name')).toBe('Alice');
    expect(harness.getCellValue(2, 'name')).toBe('Carol');
  });

  it('should sort by name descending', async () => {
    await harness.sortColumn('name', 'desc');
    expect(harness.getCellValue(0, 'name')).toBe('Carol');
    expect(harness.getCellValue(2, 'name')).toBe('Alice');
  });

  // ── Selection ───────────────────────────────────────────────────────────────

  it('should emit correct user on row selection', async () => {
    const emitSpy = spyOn(component.rowSelected, 'emit');
    await harness.selectRow(1);
    expect(emitSpy).toHaveBeenCalledWith(MOCK_USERS[1]);
  });

  it('should replace selection when another row selected', async () => {
    await harness.selectRow(0);
    await harness.selectRow(2);
    expect(harness.getSelectedRows().length).toBe(1);
    expect((harness.getSelectedRows()[0] as User).name).toBe('Carol');
  });

  // ── PII Guard ───────────────────────────────────────────────────────────────

  it('should NOT log cell values to console (PII protection)', () => {
    const logSpy = spyOn(console, 'log');
    harness.getRowData(0);
    harness.getCellValue(0, 'name');
    harness.getAllRowData();
    const logged = logSpy.calls.all().map(c => c.args.join(' ')).join(' ');
    expect(logged).not.toContain('Alice');
    expect(logged).not.toContain('alice@example.com');
  });
});
