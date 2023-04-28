import { EnvironmentVariable } from "./environment-variable";

export interface PredefinedEnvironmentVariable extends EnvironmentVariable {
  initialValue: string;
}

export interface SessionStation {
  id: string;
  envs: PredefinedEnvironmentVariable[];
}