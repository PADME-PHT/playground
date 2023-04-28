import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectSchemaViewerComponent } from './object-schema-viewer.component';

describe('ObjectSchemaViewerComponent', () => {
  let component: ObjectSchemaViewerComponent;
  let fixture: ComponentFixture<ObjectSchemaViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectSchemaViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectSchemaViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
