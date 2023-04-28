import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvEditorDialogComponent } from './env-editor-dialog.component';

describe('EnvEditorDialogComponent', () => {
  let component: EnvEditorDialogComponent;
  let fixture: ComponentFixture<EnvEditorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnvEditorDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnvEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
