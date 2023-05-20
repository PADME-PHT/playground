import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectFLDialogComponent } from './select-fl-dialog.component';

describe('SelectFLDialogComponent', () => {
  let component: SelectFLDialogComponent;
  let fixture: ComponentFixture<SelectFLDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectFLDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectFLDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
