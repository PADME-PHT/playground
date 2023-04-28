import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EditorFileType } from 'src/app/model/editor-file-type';
import { ExecutionResult } from 'src/app/model/execution-result';
import { FileManager } from 'src/app/services/file-manager';

@Component({
  selector: 'app-file-visualizer',
  templateUrl: './file-visualizer.component.html',
  styleUrls: ['./file-visualizer.component.scss']
})
export class FileVisualizerComponent implements OnChanges {

  constructor() { }

  @Input()
  public fileType!: EditorFileType;
  
  @Input()
  public content!: Blob;

  public textContent: string = "";
  
  /**
   * 
   * @param changes 
   */
  async ngOnChanges(changes: SimpleChanges)
  {
    if (changes['content'])
    {
      this.textContent = await this.content.text();  
    }
  }
  
}
