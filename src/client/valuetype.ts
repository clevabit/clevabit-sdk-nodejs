import { DataType } from './datatype';
import { Reference } from './reference';

export interface ValueType {
  reference: Reference;
  name: string;
  description?: string;
  dataType: DataType;
  unit: string;
}
