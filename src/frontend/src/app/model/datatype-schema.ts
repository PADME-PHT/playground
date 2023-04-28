import { DataType } from "./data-type";
import { DataTypeKind } from "./data-type-kind";
import { ListSchema } from "./list-schema";
import { TableSchema } from "./table-schema";

export interface DataTypeSchema {
  id: string;
  datatype: DataType | TableSchema | ListSchema;
  dataTypeKind: DataTypeKind;
}