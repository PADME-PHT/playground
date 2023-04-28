import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaDetailsViewerComponent } from './schema-details-viewer.component';

describe('SchemaDetailsViewerComponent', () => {
  let component: SchemaDetailsViewerComponent;
  let fixture: ComponentFixture<SchemaDetailsViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SchemaDetailsViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaDetailsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
