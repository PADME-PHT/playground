import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainWelcomeDialogComponent } from './main-welcome-dialog.component';

describe('WelcomeDialogComponent', () => {
  let component: MainWelcomeDialogComponent;
  let fixture: ComponentFixture<MainWelcomeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainWelcomeDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainWelcomeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
