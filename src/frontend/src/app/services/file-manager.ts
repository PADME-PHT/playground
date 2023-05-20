import { EditorFile } from "src/app/model/editor-file";
import { EditorFileType } from "src/app/model/editor-file-type";
import { Injectable } from '@angular/core';
import { find, filter, pullAt } from 'lodash';
import { EditorFilePurpose } from "../model/editor-file-purpose";

@Injectable({
  providedIn: 'root',
})
export class FileManager {

  private _files: EditorFile[];

  private lookup: Map<EditorFileType, string>;

  public constructor() { 
    this._files = [];
    this.lookup = new Map<EditorFileType, string>();
    //Set the Lookup
    this.lookup.set(EditorFileType.plain, "text/plain");
    this.lookup.set(EditorFileType.dockerfile, "dockerfile");
    this.lookup.set(EditorFileType.json, "application/json");
    this.lookup.set(EditorFileType.c, "text/x-csrc");
    this.lookup.set(EditorFileType.cplusplus, "text/x-c++src");
    this.lookup.set(EditorFileType.csharp, "text/x-csharp");
    this.lookup.set(EditorFileType.java, "text/x-java");
    this.lookup.set(EditorFileType.python, "python");
    this.lookup.set(EditorFileType.html, "text/html");
    this.lookup.set(EditorFileType.xml, "application/xml");
    this.lookup.set(EditorFileType.js, "text/javascript");
    this.lookup.set(EditorFileType.R, "text/x-rsrc");
  }

  /**
   * Returns the current list of files and their contents
   */
  get files(): EditorFile[]
  {
    return this._files;
  }

  /**
   * @returns whether the manager currently holds files
   */
  hasFiles(): boolean
  {
    return this._files.length > 0;
  }

  /**
   * @returns Whether the current files contain exactly one Dockerfile
   */
  hasOneDockerfile(): boolean
  {
    let dockerFiles = filter(this._files, { type: EditorFileType.dockerfile }); 
    return dockerFiles != undefined && dockerFiles.length == 2;
  }

  /**
   * @returns Whether the file with the given name already exists 
   */
  fileExists(fileName: string, purpose: EditorFilePurpose) : boolean
  {
    return find(this._files, { name: fileName, purpose: purpose }) != undefined;
  }

  /**
   * Returns the 
   * @param fileName The whole name of the file, including extension 
   */
  public getFileType(fileName: string) : EditorFileType
  {
    if (fileName == "Dockerfile")
    {
      return EditorFileType.dockerfile; 
    } 

    //Find based on extension otherwise
    let extension = fileName.split('.').pop();
    
    //No extension -> assume text file
    if (extension == fileName)
    {
      return EditorFileType.plain;
    }
    
    switch (extension)
    {
      case "json":
        return EditorFileType.json;
      case "py":
        return EditorFileType.python;
      case "R":
        return EditorFileType.R;
      case "c":
        return EditorFileType.c;
      case "cpp":
        return EditorFileType.cplusplus;
      case "cs":
        return EditorFileType.csharp;
      case "html":
        return EditorFileType.html;
      case "java":
        return EditorFileType.java;
      case "js":
        return EditorFileType.js;
      case "xml":
        return EditorFileType.xml;
      case "txt":
        return EditorFileType.plain;
    }

    //Unsupported extension
    return EditorFileType.unsupported;
  }

  /**
   * @param filetype 
   * @returns the mimetype for the given editorFileType as a string
   */
  getMimeType(filetype: EditorFileType) : string | undefined
  {
    if (this.lookup.has(filetype))
    {
      return this.lookup.get(filetype);
    }
    return undefined;
  }

  /**
   * Removes the file at the specified index
   * Throws error when the index is invalid
   * @param index Index at which the file should be removed
   * @returns the removed file
   */
  public removeFileAtIndex(index: number) : EditorFile
  {
    if (index < 0 || index > this._files.length - 1)
    {
      throw Error("invalid index");
    }

    return pullAt(this._files, index)[0];
  }

  /**
   * Adds a new file, when a file with this name does not already exist
   * @param file 
   */
  public addFile(file:EditorFile)
  {
    if (this.fileExists(file.name,file.purpose)) {
      throw Error("File already exists");
    }
    this._files.push(file);
  }

  /**
   * Adds a list of new files, if they do not already exist
   * @param file 
   */
   public addFiles(files:EditorFile[])
   {
     //Check
     for (let file of files)
     {
       if (this.fileExists(file.name,file.purpose)) {
          throw Error("File already exists");
        }
     }

     //Push
     this._files = this._files.concat(files);
   }

}