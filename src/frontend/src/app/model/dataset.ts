import { DatasetType } from "./dataset-type";
import { TableSchema } from "./table-schema";

export interface Dataset {
  id: string;
  title: string;
  description: string;
  key: string;
  sourceType: string;
  sourceTypeVersion: string;
  type: DatasetType;
  formatType: string | undefined;
  allowsAnonymousAccess: boolean | undefined;
  tables: TableSchema[];
}