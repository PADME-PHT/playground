import { EditorFileType } from "./editor-file-type";

export interface EditorFile {
  name: string; 
  content: string | ArrayBuffer;
  type: EditorFileType;
}