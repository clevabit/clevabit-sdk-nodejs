import { UUID } from './uuid';

export interface Reference {
  ref: UUID;
  type: string;
  uri?: string;
}
