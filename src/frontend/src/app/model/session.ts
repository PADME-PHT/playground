import { SessionStation } from "./session-station";

export interface Session{
  id: string;
  stations: SessionStation[];
}