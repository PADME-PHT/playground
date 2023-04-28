import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteViewerComponent } from './route-viewer.component';

describe('RouteViewerComponent', () => {
  let component: RouteViewerComponent;
  let fixture: ComponentFixture<RouteViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RouteViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RouteViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
