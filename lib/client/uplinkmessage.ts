import { Reference } from "./reference";
import { Timestamp } from "./timestamp";
import { UUID } from "./uuid";
import { ValueType } from "./valuetype";

export interface UplinkMessage {
  messageType: "measurement"
  uuid: UUID
  parent: Reference
  created: Timestamp
  valueType: ValueType
  value: any
}