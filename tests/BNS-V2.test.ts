import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { initSimnet } from "@hirosystems/clarinet-sdk";
import crypto from "crypto";
const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
// Function to create a Hash-160
function createHash160NameSpace(input: Uint8Array, salt: Uint8Array) {
  // Concatenate the input buffer + the salt buffer
  const saltedInput = Buffer.concat([Buffer.from(input), salt]);
  // hash with sha256
  const sha256Hash = crypto.createHash("sha256").update(saltedInput).digest();
  // hash the result with ripemd160
  const ripemd160Hash = crypto
    .createHash("ripemd160")
    .update(sha256Hash)
    .digest();
  // Final 20 bytes hash
  return ripemd160Hash;
}
// Function to create a Hash-160
function createHash160Name(
  input: Uint8Array,
  period: string,
  namespace: Uint8Array,
  salt: Uint8Array
) {
  // Convert period to a Buffer
  const periodBuffer = Buffer.from(period);
  // Concatenate the input buffer + the salt buffer
  const saltedInput = Buffer.concat([
    Buffer.from(input),
    periodBuffer,
    namespace,
    salt,
  ]);
  // hash with sha256
  const sha256Hash = crypto.createHash("sha256").update(saltedInput).digest();
  // hash the result with ripemd160
  const ripemd160Hash = crypto
    .createHash("ripemd160")
    .update(sha256Hash)
    .digest();
  // Final 20 bytes hash
  return ripemd160Hash;
}
// Create a UTF-8 Encoder
const encoder = new TextEncoder();
// Define the salt
const salt = "stratalabs";
// Encode the salt string to a Uint8Array
const saltBuff = encoder.encode(salt);
// Hash the strings and encode to a Uint8Array
const namespaceBuffSalt = createHash160NameSpace(
  encoder.encode("namespacetest"),
  saltBuff
);
// Encode the string to a Uint8Array
const name1Buff = encoder.encode("name1");
const name2Buff = encoder.encode("name2");
const zonefileBuff = encoder.encode("zonefile");
const namespaceBuff = encoder.encode("namespacetest");
// Hash 160 the Names with the namespace and salt
const name1BuffSalt = createHash160Name(
  encoder.encode("name1"),
  ".",
  namespaceBuff,
  saltBuff
);
const name2BuffSalt = createHash160Name(
  encoder.encode("name2"),
  ".",
  namespaceBuff,
  saltBuff
);

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
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
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
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
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
        // Cl.some(Cl.principal(address1)),
        Cl.none(),
      ],
      address1
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("Launch a namespace", () => {
  it("This should successfully launch a Namespace", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
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
        // Cl.some(Cl.principal(address1)),
        Cl.none(),
      ],
      address1
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      address1
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("Preorder a name on the launched namespace", () => {
  it("This should successfully preorder a name on a launched namespace", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
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
        // Cl.some(Cl.principal(address1)),
        Cl.none(),
      ],
      address1
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      address1
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Call the name-preorder function from the BNS-V2 contract
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      address1
    );
    expect(preorderName.result).toBeOk(Cl.uint(149));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("Register a name on the launched namespace", () => {
  it("This should successfully register a preordered name on a launched namespace", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
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
        Cl.none(),
      ],
      address1
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      address1
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Call the name-preorder function from the BNS-V2 contract
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      address1
    );
    expect(preorderName.result).toBeOk(Cl.uint(149));

    // Call the name-register function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("Register 2 names on the launched namespace", () => {
  it("This should successfully register 2 names from 2 preordered names on a launched namespace", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
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
        Cl.none(),
      ],
      address1
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      address1
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Call the name-preorder function from the BNS-V2 contract
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      address1
    );
    expect(preorderName.result).toBeOk(Cl.uint(149));

    // Call the name-register function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));

    // Call the name-preorder function from the BNS-V2 contract
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name2BuffSalt), Cl.uint(200000000)],
      address1
    );
    expect(preorderName2.result).toBeOk(Cl.uint(151));

    // Call the name-register function from the BNS-V2 contract
    const registerName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name2Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      address1
    );
    expect(registerName2.result).toBeOk(Cl.bool(true));

    // Call the get get-all-names-owned-by-principal
    const allBnsNames = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-all-names-owned-by-principal",
      [Cl.principal(address1)],
      address1
    );
    console.log(allBnsNames);
    expect(allBnsNames.result).toBeSome(Cl.list([Cl.uint(1), Cl.uint(2)]));
  });
});
