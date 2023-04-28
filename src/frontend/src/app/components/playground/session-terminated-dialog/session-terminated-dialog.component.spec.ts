import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionTerminatedDialogComponent } from './session-terminated-dialog.component';

describe('SessionTerminatedDialogComponent', () => {
  let component: SessionTerminatedDialogComponent;
  let fixture: ComponentFixture<SessionTerminatedDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SessionTerminatedDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionTerminatedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
