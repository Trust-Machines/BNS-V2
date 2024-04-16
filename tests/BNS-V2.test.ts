import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { initSimnet } from "@hirosystems/clarinet-sdk";
import crypto from "crypto"; // Import the crypto module
const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
// Function to create a 20-byte hash from a string, including a salt
function createHash(input: Uint8Array, salt: string) {
  const hash = crypto.createHash("sha1");
  hash.update(salt + input); // Concatenate salt and input before hashing
  return hash.digest().slice(0, 20); // Truncate the 32-byte hash to 20 bytes
}
// Create a UTF-8 Encoder
const encoder = new TextEncoder();
// Define a salt
const salt = "stratalabs";
// Encode the salt string to a Uint8Array
const saltBuff = encoder.encode(salt);
// Hash the strings and encode to a Uint8Array
const namespaceBuffSalt = createHash(encoder.encode("namespacetest"), salt);
const name1BuffSalt = createHash(encoder.encode("name1"), salt);
const name2BuffSalt = createHash(encoder.encode("name2"), salt);
// Encode the string to a Uint8Array
const namespaceBuff = encoder.encode("namespacetest");
const name1Buff = encoder.encode("name1");
const name2Buff = encoder.encode("name2");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("Create/Register a namespace", () => {
  it("This should successfully create a Namespace", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(10)],
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("Reveal a namespace", () => {
  it("This should successfully reveal a Namespace", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(10)],
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Call the namespace-reveal function from the BNS-V2 contract
    const revealNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-reveal",
      // Pass the namespace in Uint8Array Format
      // Pass the salt in Uint8Array Format
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(saltBuff),
        // Pass the pricing function
        // Base
        Cl.uint(1),
        // Coeff
        Cl.uint(1),
        // p-funcs
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        Cl.uint(1),
        // Pass the non alpha discount
        Cl.uint(1),
        // Pass the non vowel discount
        Cl.uint(1),
        // Lifetime
        Cl.uint(5000),
        // Import address
        Cl.principal(address1),
        // Manager address
        Cl.some(Cl.principal(address1)),
      ],
      address1
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));
  });
});
