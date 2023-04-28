import { Organization } from "./organization";
import { Station } from "./station";

export interface RouteHalt{
  station: Station; 
  organization: Organization;
}