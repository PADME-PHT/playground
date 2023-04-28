import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationalSchemaViewerComponent } from './relational-schema-viewer.component';

describe('RelationalSchemaViewerComponent', () => {
  let component: RelationalSchemaViewerComponent;
  let fixture: ComponentFixture<RelationalSchemaViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RelationalSchemaViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelationalSchemaViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
