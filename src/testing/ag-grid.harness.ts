/**
 * AgGridHarness — AG Grid v33 test utility for Jasmine + Karma.
 * Uses GridApi not DOM — resilient to AG Grid version changes.
 *
 * USAGE:
 *   harness = new AgGridHarness(fixture, () => component.gridApi);
 *   await harness.waitForGrid();
 *   expect(harness.getRowCount()).toBe(3);
 */
import { ComponentFixture } from '@angular/core/testing';
import type { GridApi } from 'ag-grid-community';

export class AgGridHarness {
  constructor(
    private readonly fixture: ComponentFixture<unknown>,
    private readonly getApi: () => GridApi,
  ) {}

  async waitForGrid(): Promise<void> {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    this.fixture.detectChanges();
  }

  getRowCount(): number {
    return this.getApi().getDisplayedRowCount();
  }

  getRowData(index: number): Record<string, unknown> {
    const node = this.getApi().getDisplayedRowAtIndex(index);
    if (!node) throw new Error(`Row ${index} not found`);
    return node.data as Record<string, unknown>;
  }

  getCellValue(row: number, colId: string): unknown {
    return this.getRowData(row)[colId];
  }

  getSelectedRows(): unknown[] {
    return this.getApi().getSelectedRows();
  }

  async selectRow(index: number): Promise<void> {
    const node = this.getApi().getDisplayedRowAtIndex(index);
    if (!node) throw new Error(`Row ${index} not found`);
    node.setSelected(true);
    this.fixture.detectChanges();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }

  async applyColumnFilter(colId: string, value: string): Promise<void> {
    this.getApi().setFilterModel({
      [colId]: { filterType: 'text', type: 'contains', filter: value },
    });
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    this.fixture.detectChanges();
  }

  async clearAllFilters(): Promise<void> {
    this.getApi().setFilterModel(null);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    this.fixture.detectChanges();
  }

  async sortColumn(colId: string, direction: 'asc' | 'desc'): Promise<void> {
    this.getApi().applyColumnState({
      state: [{ colId, sort: direction }],
      defaultState: { sort: null },
    });
    this.fixture.detectChanges();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }

  async setQuickFilter(text: string): Promise<void> {
    this.getApi().setGridOption('quickFilterText', text);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    this.fixture.detectChanges();
  }

  getAllRowData(): Record<string, unknown>[] {
    return Array.from({ length: this.getRowCount() }, (_, i) => this.getRowData(i));
  }
}
