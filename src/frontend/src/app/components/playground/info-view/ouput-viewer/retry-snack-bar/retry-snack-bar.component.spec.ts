import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetrySnackBarComponent } from './retry-snack-bar.component';

describe('RetrySnackBarComponent', () => {
  let component: RetrySnackBarComponent;
  let fixture: ComponentFixture<RetrySnackBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetrySnackBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetrySnackBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
