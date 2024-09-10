// Error Constants
export const ERR_NOT_AUTHORIZED = 100;
export const ERR_NO_ZONEFILE_FOUND = 101;
export const ERR_NO_NAME = 102;
export const ERR_NO_NAMESPACE = 103;
export const ERR_NAME_REVOKED = 104;
export const ERR_MIGRATION_IN_PROGRESS = 105;
export const ERR_INVALID_PERIOD = 106;

// Base58 alphabet
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// Base58 decoding function
function base58Decode(string: string): bigint {
  let result = 0n;
  for (let i = 0; i < string.length; i++) {
    result = result * 58n + BigInt(ALPHABET.indexOf(string[i]));
  }
  return result;
}

// Function to convert BigInt to Uint8Array
function bigIntToUint8Array(bigint: bigint): Uint8Array {
  let hex = bigint.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  let len = hex.length / 2;
  let u8 = new Uint8Array(len);
  let i = 0;
  let j = 0;
  while (i < len) {
    u8[i] = parseInt(hex.slice(j, j + 2), 16);
    i += 1;
    j += 2;
  }
  return u8;
}

// Function to decode CID
function decodeCID(cid: string): Uint8Array {
  const decoded = base58Decode(cid);
  const bytes = bigIntToUint8Array(decoded);
  return bytes;
}

const cid = "QmRbUW8n3aZvCBdnJX3AWFnd1oBs71vWSGnmBWQk5NhdMt";
const decodedCID = decodeCID(cid);

const cid2 = "QmVBsvFMiLdohT3zE36ayCA9hUayquVDXhVJFjSdgYZfAh";
const decodedCID2 = decodeCID(cid2);

// Encoder and Salt Buffers
export const encoder = new TextEncoder();
export const zonefileBuff = encoder.encode(`{principal: "1",
  zonefile: {
    btcAddress: "1",
    discord: "1",
    twitter: "1"
  }}`);
export const zonefile2Buff = encoder.encode(`{principal: "2",
  zonefile: {
    btcAddress: "2",
    discord: "2",
    twitter: "2"
  }}`);
export const cidBuff = decodedCID;
export const cid2Buff = decodedCID2;
