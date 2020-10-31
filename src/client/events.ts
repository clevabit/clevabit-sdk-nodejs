import { cborDecode } from '../cbor/codec';
import { UplinkMessage } from './uplinkmessage';
import { Client } from './client';
import * as mqtt from 'mqtt';

export interface Subscription {
  cancel(): Promise<void>;
}

export class EventService {
  private readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async subscribe(callback: (message: UplinkMessage) => void, query?: string): Promise<Subscription> {
    const sub = await this.client.execute<InternalSubscription>('PUT', '/events', {
      type: 'mqtt',
      query: query || 'device: *',
    });

    return new Promise<Subscription>(async (resolve, reject) => {
      let client: mqtt.MqttClient;
      let connected: boolean;

      try {
        await this.client.withBearer<void>(async (bearer) => {
          client = mqtt.connect(sub.endpoint, {
            host: sub.endpoint,
            port: 1883,
            protocolVersion: 5,
            clientId: sub.clientId,
            password: bearer,
            username: '',
          });

          client.on('error', (error) => {
            reject(error);
          });

          client.on('connect', (_) => {
            connected = true;
          });

          client.on('message', (_, payload) => {
            const message = cborDecode(payload) as UplinkMessage;
            callback(message);
          });
        });
      } catch (err) {
        reject(err);
      }

      return resolve({
        cancel(): Promise<void> {
          return new Promise((resolve0) => {
            if (!connected) {
              return resolve0();
            }

            client.end(true, {}, () => {
              resolve0();
            });
          });
        },
      });
    });
  }
}

interface InternalSubscription {
  clientId: string;
  endpoint: string;
  topic: string;
}
