import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsViewerComponent } from './results-viewer.component';

describe('ResultsViewerComponent', () => {
  let component: ResultsViewerComponent;
  let fixture: ComponentFixture<ResultsViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResultsViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
