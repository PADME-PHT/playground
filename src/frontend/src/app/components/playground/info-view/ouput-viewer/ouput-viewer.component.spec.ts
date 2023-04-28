import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OuputViewerComponent } from './ouput-viewer.component';

describe('OuputViewerComponent', () => {
  let component: OuputViewerComponent;
  let fixture: ComponentFixture<OuputViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OuputViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OuputViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
