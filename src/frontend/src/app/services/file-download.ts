import { EditorFile } from "src/app/model/editor-file";
import { Injectable } from '@angular/core';
import { FileManager } from "./file-manager";
import * as JSZip from "jszip";
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class FileDownloadService {

  constructor(private fileManager: FileManager) { }

  /**
   * 
   * @param blob 
   * @param filename 
   */
  private downloadBlob(blob: Blob, filename: string)
  {
    let link = document.createElement("a"); 
    link.href = URL.createObjectURL(blob);
    link.download = filename; 
    link.click(); 
    link.remove();
  }

  /**
   * Packs all current files in a zip and downloads them
   */
  public downloadAllFilesFromFileManager()
  {
    let zip = new JSZip();
    for (let file of this.fileManager.files)
    {
      zip.file(file.name, file.content);
    }
    let self = this;
    zip.generateAsync({ type: "blob" }).then(function (content) {
      let date = formatDate(Date.now(), 'yyyy-MM-dd HH:mm:ss' , 'de-DE');
      self.downloadBlob(content, `playground-${date}.zip`);
    });
  }

  /**
   * Downloads the file with the given index
   * @param index 
   * @return the downloaded file
   */
  public downloadFileByIndex(index: number) : EditorFile
  {
    let file = this.fileManager.files[index];
    let fileBlob = new Blob([file.content], { type: this.fileManager.getMimeType(file.type) }); 
    this.downloadBlob(fileBlob, file.name);
    return file;
  }
}