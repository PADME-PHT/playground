import { DataTypeSchema } from "./datatype-schema";

export interface ColumnSchema extends DataTypeSchema {
  key: string;
  value: string | undefined;
  isUnique?: boolean;
  referenceTo?: string;
  externalReference?: string;
}