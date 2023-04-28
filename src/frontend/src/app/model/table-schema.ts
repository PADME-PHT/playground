import { UniqueSelectionDispatcher } from "@angular/cdk/collections";
import { ColumnSchema } from "./column-schema";

export interface TableSchema {
  id: string;
  key: string;
  columns: ColumnSchema[];
}