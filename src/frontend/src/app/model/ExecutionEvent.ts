export interface ExecutionEvent {
  id: number;
  type: "Build" | "BuildStart" | "BuildEnd" | "ExecutionStart" | "Execution" | "ExecutionEnd" | "ExecutionFinished" | "ExecutionCanceled"| "ExecutionFailed" | "Error";
  message: string;
  station: string;
}

export const LISTENING_FAILED: ExecutionEvent = { id: -1, message: "", station: "", type:"Error"};