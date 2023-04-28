import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvsViewerComponent } from './envs-viewer.component';

describe('EnvsViewerComponent', () => {
  let component: EnvsViewerComponent;
  let fixture: ComponentFixture<EnvsViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnvsViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnvsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
