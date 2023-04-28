import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverwriteFileDialogComponent } from './overwrite-file-dialog.component';

describe('OverwriteFileDialogComponent', () => {
  let component: OverwriteFileDialogComponent;
  let fixture: ComponentFixture<OverwriteFileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OverwriteFileDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverwriteFileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
