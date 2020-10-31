import { cborDecode } from '../cbor/codec';
import { ByteArray } from '../types/bytearray';

export interface Packet {
  header: {
    portId: number;
    vendorId: number;
    deviceId: number;
  };
  values: (number | any)[];
}

export function decode(payload: ByteArray | string): Packet {
  let buffer: Uint8Array;
  if (typeof payload === 'string') {
    buffer = Uint8Array.from(Buffer.from(payload, 'hex'));
  } else {
    buffer = Uint8Array.from(payload);
  }

  const packet = cborDecode<Packet>(buffer);
  if (!Array.isArray(packet)) {
    throw new TypeError('unexpected packet structure');
  } else if (packet.length < 2) {
    throw new TypeError('packet too small');
  }

  // Store header triple
  const header = packet[0];

  // Remove header to have only the plain values
  packet.shift();

  return {
    header: {
      portId: header[0],
      vendorId: header[1],
      deviceId: header[2],
    },
    values: packet as (number | any)[],
  };
}
