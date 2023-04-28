import { Dataset } from "./dataset";
import { EnvironmentVariable } from "./environment-variable";
import { SessionStation } from "./session-station";

export interface Station extends SessionStation {
  name: string;
  description: string;
  datasets: Dataset[];
  ownEnvs: EnvironmentVariable[];
}