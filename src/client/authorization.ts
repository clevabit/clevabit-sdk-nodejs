import { Reference } from './reference';

export interface Authorization {
  token: string;
  customer: Reference;
  account: Reference;
}
