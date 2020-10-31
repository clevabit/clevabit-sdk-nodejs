import { ByteArray } from '../types/bytearray';

const test = /^\s*(urn:uuid:|\{)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\})?\s*$/i;

const byteToHex: string[] = [];
const hexToByte: { [key: string]: number } = {};

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
  hexToByte[byteToHex[i]] = i;
}

export class UUID {
  public static fromString(value: string): UUID {
    return new UUID(value);
  }

  public static fromByteArray(value: ByteArray): UUID {
    return new UUID(value);
  }

  public static isNilUuid(value: UUID | string): boolean {
    if (value.constructor === UUID) {
      return value.isEmpty();
    }
    if (typeof value === 'string' && test.test(value)) {
      const uuid = new UUID(value);
      return uuid.isEmpty();
    }

    // Returning true here guards against strings not matching
    // the UUID RFC 4122 literal specification:
    // xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
    return true;
  }

  public static validUuid(value: UUID | string): boolean {
    if (value.constructor === UUID) {
      return true;
    }
    return typeof value === 'string' && test.test(value);
  }

  public static uuidToBytes(value: string): ByteArray {
    let i = 0;

    const buf = new Uint8Array(16);
    value.toLowerCase().replace(/[0-9a-f]{2}/g, (oct) => {
      if (i < 16) {
        // Don't overflow!
        buf[i++] = hexToByte[oct];
      }
      return oct;
    });

    // Zero out remaining bytes if string was short
    while (i < 16) {
      buf[i++] = 0;
    }

    return buf;
  }

  public static bytesToUuid(buf: ByteArray): string {
    const bth = byteToHex;

    // Note: Be careful editing this code!  It's been tuned for performance
    // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
    return (
      bth[buf[0]] +
      bth[buf[1]] +
      bth[buf[2]] +
      bth[buf[3]] +
      '-' +
      bth[buf[4]] +
      bth[buf[5]] +
      '-' +
      bth[buf[6]] +
      bth[buf[7]] +
      '-' +
      bth[buf[8]] +
      bth[buf[9]] +
      '-' +
      bth[buf[10]] +
      bth[buf[11]] +
      bth[buf[12]] +
      bth[buf[13]] +
      bth[buf[14]] +
      bth[buf[15]]
    ).toLowerCase();
  }

  private readonly data: ByteArray;

  constructor(initializer: string | ByteArray | UUID) {
    if (typeof initializer === 'string') {
      this.data = UUID.uuidToBytes(initializer);
    } else if (initializer.constructor === Uint8Array) {
      this.data = initializer as Uint8Array;
    } else if (initializer.constructor === UUID) {
      this.data = (initializer as UUID).bytes();
    } else if (Array.isArray(initializer) && initializer.length === 16) {
      this.data = initializer;
    } else {
      throw Error('illegal initializer value for UUID');
    }
  }

  public toString(): string {
    return UUID.bytesToUuid(this.data);
  }

  public toJSON(): string {
    return this.toString();
  }

  public clone(): UUID {
    return new UUID(this.data);
  }

  public bytes(): ByteArray {
    return Uint8Array.from(this.data);
  }

  public isEmpty(): boolean {
    return Uint8Array.from(this.data).every((v) => v === 0);
  }

  public equals(other: UUID): boolean {
    return this.toString() === other.toString();
  }
}
