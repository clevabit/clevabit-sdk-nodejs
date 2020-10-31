import { ValueType } from './valuetype';
import { Client } from './client';

export class MetadataService {
  private readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async listValueTypes(): Promise<ValueType[]> {
    return this.client.execute('GET', '/customers/{customerId}/metadata/valuetypes');
  }
}
