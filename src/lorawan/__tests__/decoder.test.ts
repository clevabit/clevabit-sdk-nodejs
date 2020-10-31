import { decode } from '../../../lib/lorawan/decoder';

test('Test Packet Hex-String Decoding', () => {
  const payload = '848301186601820118198202182b820319019d';
  const packet = decode(payload);
  expect(packet.header.portId).toBe(1);
  expect(packet.header.vendorId).toBe(102);
  expect(packet.header.deviceId).toBe(1);
  expect(packet.values.length).toBe(3);
  expect(packet.values[0][0]).toBe(1);
  expect(packet.values[0][1]).toBe(25);
  expect(packet.values[1][0]).toBe(2);
  expect(packet.values[1][1]).toBe(43);
  expect(packet.values[2][0]).toBe(3);
  expect(packet.values[2][1]).toBe(413);
});
