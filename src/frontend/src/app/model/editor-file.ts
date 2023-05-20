import { EditorFileType } from "./editor-file-type";
import { EditorFilePurpose } from "./editor-file-purpose";
export interface EditorFile {
  name: string; 
  content: string | ArrayBuffer;
  type: EditorFileType;
  purpose: EditorFilePurpose;
}