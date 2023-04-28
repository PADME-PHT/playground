import { Station } from "./station";

export interface Organization {
  id: string; 
  name: string;
  stations: Station[];
}