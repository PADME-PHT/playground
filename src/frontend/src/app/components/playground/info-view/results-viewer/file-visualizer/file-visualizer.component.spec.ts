import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileVisualizerComponent } from './file-visualizer.component';

describe('FileVisualizerComponent', () => {
  let component: FileVisualizerComponent;
  let fixture: ComponentFixture<FileVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileVisualizerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
