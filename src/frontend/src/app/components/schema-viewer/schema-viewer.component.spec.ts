import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaViewerComponent } from './schema-viewer.component';

describe('SchemaViewerComponent', () => {
  let component: SchemaViewerComponent;
  let fixture: ComponentFixture<SchemaViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SchemaViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
