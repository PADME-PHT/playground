import { ExecutionChangeType } from "./execution-change-type";

export interface ExecutionResult
{
  name: string; 
  path: string;
  changeType: ExecutionChangeType;
  children: ExecutionResult[];
}