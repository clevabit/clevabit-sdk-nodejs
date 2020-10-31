import { decode as lorawan, Packet } from '../lorawan/decoder';
import { ByteArray } from '../types/bytearray';

/**
 * Representation of a decoded Rooclino packet
 */
export interface Measurement {
  /**
   * Represents the Carbon Dioxide level in PPM (Parts Per
   * Million).
   */
  carbonDioxide?: number;
  /**
   * Represents the Relative Humidity in Percent.
   */
  humidity?: number;
  /**
   * Represents the Temperature in Degree Celsius.
   */
  temperature?: number;
}

/**
 * Decodes a Rooclino packet, as received through the LoRaWAN
 * network stream. The payload can either be presented as a
 * hex encoded string or as a ByteArray (Buffer or Uint8Array).
 *
 * @param payload the encoded Rooclino packet
 * @returns the decoded Roocline packet as a Measurement object
 */
export function decode(payload: ByteArray | string): Measurement {
  const packet = lorawan(payload);
  const temperature = findValue(1, packet);
  const humidity = findValue(2, packet);
  const carbonDioxide = findValue(3, packet);
  return {
    temperature,
    humidity,
    carbonDioxide,
  };
}

function findValue(transmitId: number, packet: Packet): number | undefined {
  for (const value of packet.values) {
    if (!Array.isArray(value)) {
      throw new TypeError(`illegal value found, expected array got ${typeof value}`);
    }
    if (value[0] && value[0] === transmitId) {
      return value[1] as number;
    }
  }
  return undefined;
}
