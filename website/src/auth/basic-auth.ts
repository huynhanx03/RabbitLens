export function createBasicAuthorization(
  username: string,
  password: string,
): string {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  let binaryValue = "";

  for (const byte of bytes) {
    binaryValue += String.fromCharCode(byte);
  }

  return `Basic ${btoa(binaryValue)}`;
}
