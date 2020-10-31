import { decode } from "../../../lib/rooclimo/decoder";

test('Test Rooclino Packet Hex-String Decoding', () => {
  const payload = '848301186601820118198202182b820319019d';
  const measurement = decode(payload);
  expect(measurement.temperature).toBe(25);
  expect(measurement.humidity).toBe(43);
  expect(measurement.carbonDioxide).toBe(413);
});
