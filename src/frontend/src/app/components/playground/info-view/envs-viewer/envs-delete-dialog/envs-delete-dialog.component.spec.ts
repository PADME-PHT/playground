import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvsDeleteDialogComponent } from './envs-delete-dialog.component';

describe('EnvsDeleteDialogComponent', () => {
  let component: EnvsDeleteDialogComponent;
  let fixture: ComponentFixture<EnvsDeleteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnvsDeleteDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnvsDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
