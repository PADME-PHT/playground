import { Component, Input, Output, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { Editor } from 'codemirror';
import { emit } from 'process';
import { EditorFileType } from 'src/app/model/editor-file-type';
import { FileManager } from 'src/app/services/file-manager';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent {

  @Input() IsReadonly: boolean = false;

  @Input() content: string | ArrayBuffer = "";
  @Output() contentChange = new EventEmitter<string>();

  @Input() FileType: EditorFileType = EditorFileType.plain;

  @ViewChild('editor') editor!: CodemirrorComponent;

  //How many spaces should be used for one tab
  private spacesPerTab = 2;

  constructor(private fileManager: FileManager) { }
  
  ngAfterViewInit()
  {
    //Same as in output component, in the info-view. Please see comments there
    this.executeWhenCodeMirrorIsInitialized(() => 
    {
      //Replaces tabes with spaces (otherwise this might cause problems in python files and probably other stuff)
      this.editor.codeMirror?.addKeyMap({
        "Tab": (editor: Editor) => {
          if (editor.somethingSelected()) {
            editor.indentSelection("add");
          } else {
            editor.replaceSelection(editor.getOption("indentWithTabs") ? "\t" : Array(this.spacesPerTab + 1).join(" "));
          }
        },
        "Ctrl-S": () => {
          //Do nothing, prevents from "trying" to save the contents as html  
        }
      });
    });
  }

  /**
   * Recursively calls it self and waits for codeMirror to initialize
   * @param callback Callback that should be executed when codemirror is initialized
   */
  executeWhenCodeMirrorIsInitialized(callback: Function)
  {
    setTimeout(() => {
      if (this.editor?.codeMirror)
      {
        callback(); 
      } else {
        this.executeWhenCodeMirrorIsInitialized(callback);
      }
    }, 10);
    //it seems the initialization is pretty fast but not immediate,
    //therefore, 10 ms should be enough
  }

  contentUpdated(newContent: string)
  {
    //Notify the outside world
    this.contentChange.emit(newContent);
  }

  /**
   * @returns the correct codemirror mode for the current FileType
   */
  getTextModeForFile()
  {
    //See if we have a mime type for this
    let lookup = this.fileManager.getMimeType(this.FileType);
    return lookup ? lookup : this.fileManager.getMimeType(EditorFileType.plain);
  }


}
