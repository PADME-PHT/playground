import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';
import { EditorFile } from '../model/editor-file';

@Directive({
  selector: '[fileDragNDrop]'
})
export class FileDragNDropDirective {

  constructor() { }

  @Output()
  fileDrop = new EventEmitter<Array<File>>();
  
  //Conditionally activates the class file-over
  @HostBinding('class.file-over') fileOver: boolean = false;

  @HostListener('dragover', ['$event'])
  public onDragOver(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = true;
  }

  @HostListener('dragleave', ['$event'])
  public onDragLeave(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
  }

  @HostListener('drop', ['$event'])
  public onDrop(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;

    const { dataTransfer } = evt;

    if (dataTransfer.items) {
      const files = [];
      for (let i = 0; i < dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (dataTransfer.items[i].kind === 'file') {
          files.push(dataTransfer.items[i].getAsFile());
        }
      }
      dataTransfer.items.clear();
      this.fileDrop.emit(files);
    } else {
      const files = dataTransfer.files;
      dataTransfer.clearData();
      this.fileDrop.emit(Array.from(files));
    }
  }
}
