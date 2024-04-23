import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { initSimnet } from "@hirosystems/clarinet-sdk";
import crypto from "crypto";

// Initialize simnet
const simnet = await initSimnet();

// Define constants for commission trait name and address, for market functions
const commTraitName = "gamma-bns-v2-commission-container";
const commTraitAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

// Get accounts from simnet
const accounts = simnet.getAccounts();
// Assign wallet 1 to address1
const address1 = accounts.get("wallet_1")!;
// Assign wallet 2 to managerAddress
const managerAddress = accounts.get("wallet_2")!;
// Assign wallet 3 to address2
const address2 = accounts.get("wallet_3")!;

// Function to create a Hash-160 for a namespace
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

// Function to create a Hash-160 for a name
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

// Encode the strings to Uint8Arrays
const name1Buff = encoder.encode("name1");
const name2Buff = encoder.encode("name2");
const zonefileBuff = encoder.encode("zonefile");
const zonefile2Buff = encoder.encode("zonefile2");
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
// Block for testing preorder a namespace functionality
describe("Preorder a namespace", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Test case to preorder a Namespace successfully
  it("should successfully preorder a Namespace", () => {
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with hashed salt and namespace, and amount of STX to burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Use Address 1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Test case to preorder the same Namespace from the same sender if TTL has passed
  it("should allow to preorder the same Namespace from the same sender if TTL has passed", () => {
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with hashed salt and namespace, and amount of STX to burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Use Address 1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));
    // mine 144 empty blocks so that TTL is passed
    simnet.mineEmptyBlocks(144);

    const preorderNamespace2 = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with hashed salt and namespace, and amount of STX to burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Use Address 1
      address1
    );
    // This should give ok u291 since the blockheight is 147 + 144 TTL
    expect(preorderNamespace2.result).toBeOk(Cl.uint(291));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Test case to fail preorder the same Namespace from the same sender
  it("should fail to preorder the same Namespace from the same sender", () => {
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with hashed salt and namespace, and amount of STX to burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Use Address 1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    const preorderNamespace2 = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with hashed salt and namespace, and amount of STX to burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Use Address 1 again
      address1
    );
    // This should give err u109
    expect(preorderNamespace2.result).toBeErr(Cl.uint(109));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Test case to allow to preorder the same Namespace from a different sender
  it("should allow to preorder the same Namespace from a different sender", () => {
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with hashed salt and namespace, and amount of STX to burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Use Address 1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    const preorderNamespace2 = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with hashed salt and namespace, and amount of STX to burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Use Address 2 this time
      address2
    );
    // This should give ok u147 since the blockheight is 3 + 144 TTL
    expect(preorderNamespace2.result).toBeOk(Cl.uint(147));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Test case to fail if the param of the hash is malformed
  it("should fail if the param of the hash is malformed", () => {
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with only namespace (without hash) and amount of STX to burn
      [Cl.buffer(namespaceBuff), Cl.uint(1000000000)],
      // Use Address 1
      address1
    );
    // This should give err u110
    expect(preorderNamespace.result).toBeErr(Cl.uint(110));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Test case to fail if the stx to burn is 0
  it("should fail if the stx to burn is 0", () => {
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with hashed salt and namespace, and 0 STX to burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Use Address 1
      address1
    );
    // This should give err u111
    expect(preorderNamespace.result).toBeErr(Cl.uint(111));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Test case to fail if the tx-sender has insufficient funds
  it("should fail if the tx-sender has insufficient funds", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with hashed salt and namespace, and extremely high amount of STX to burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(9007199254740991)],
      // Use Address 1
      address1
    );
    // This should give err u112
    expect(preorderNamespace.result).toBeErr(Cl.uint(112));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("Reveal a namespace", () => {
  it("This should successfully reveal a Namespace without a manager", () => {
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
        Cl.bool(true),
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
        // No Manager Address
        Cl.none(),
      ],
      address1
    );
    // Should return ok true
    expect(revealNamespace.result).toBeOk(Cl.bool(true));
  });
  it("This should successfully reveal a Namespace with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
        // Cl.none(),
      ],
      address1
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("Launch a namespace", () => {
  it("This should successfully launch a Namespace without a manager", () => {
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
        Cl.bool(true),
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
  it("This should successfully launch a Namespace with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
        // Cl.none(),
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
  it("This should successfully preorder a name on a launched namespace without a manager", () => {
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
        Cl.bool(true),
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
  it("This should successfully preorder a name on a launched namespace with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
        // Cl.none(),
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
      managerAddress
    );
    expect(preorderName.result).toBeOk(Cl.uint(149));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("Register a name on the launched namespace with the 2 step path", () => {
  it("This should successfully register a preordered name on a launched namespace without a manager", () => {
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
        Cl.bool(true),
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
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
  });
  it("This should successfully register a preordered name on a launched namespace with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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
      managerAddress
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
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
  });
  it("This should fail to register a preordered name on a launched namespace with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeErr(Cl.uint(102));
  });
  it("This should fail to register a preordered name on a launched namespace without a manager", () => {
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
        Cl.bool(true),
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
        Cl.principal(managerAddress),
      ],
      address1
    );
    expect(registerName.result).toBeErr(Cl.uint(102));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("Register a name on the launched namespace with the fast mint", () => {
  it("This should successfully fast mint a name on a launched namespace without a manager", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
  });
  it("This should successfully fast mint a name on a launched namespace with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(20000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
  });
  it("This should fail to fast mint name on a launched namespace with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeErr(Cl.uint(102));
  });
  it("This should fail to fast mint a name on a launched namespace without a manager", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(managerAddress),
      ],
      address1
    );
    expect(registerName.result).toBeErr(Cl.uint(102));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("List, Unlist and Buy market functions", () => {
  it("This should successfully list a name without a manager", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      address1
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
  });
  it("This should successfully list a name with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      managerAddress
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
  });
  it("This should fail to list a name without a manager", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      managerAddress
    );
    expect(listName.result).toBeErr(Cl.uint(102));
  });
  it("This should fail list a name with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      address1
    );
    expect(listName.result).toBeErr(Cl.uint(102));
  });
  it("This should successfully unlist a name without a manager", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      address1
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
    // Call the name-claim-fast function from the BNS-V2 contract
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      [Cl.uint(1)],
      address1
    );
    expect(unlistName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("unlist-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });
  it("This should successfully unlist a name with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      managerAddress
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
    // Call the name-claim-fast function from the BNS-V2 contract
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      [Cl.uint(1)],
      managerAddress
    );
    expect(unlistName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("unlist-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });
  it("This should fail unlist a name without a manager", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      address1
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
    // Call the name-claim-fast function from the BNS-V2 contract
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      [Cl.uint(1)],
      managerAddress
    );
    expect(unlistName.result).toBeErr(Cl.uint(102));
  });
  it("This should fail unlist a name with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      managerAddress
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
    // Call the name-claim-fast function from the BNS-V2 contract
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      [Cl.uint(1)],
      address1
    );
    expect(unlistName.result).toBeErr(Cl.uint(102));
  });
  it("This should successfully buy a name without a manager", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      address1
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
    const buyName = simnet.callPublicFn(
      "BNS-V2",
      "buy-in-ustx",
      [Cl.uint(1), Cl.contractPrincipal(commTraitAddress, commTraitName)],
      address2
    );
    expect(buyName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("buy-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });
  it("This should successfully buy a name with a manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      managerAddress
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
    const buyName = simnet.callPublicFn(
      "BNS-V2",
      "buy-in-ustx",
      [Cl.uint(1), Cl.contractPrincipal(commTraitAddress, commTraitName)],
      address2
    );
    expect(buyName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("buy-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("mng-burn", () => {
  it("This should successfully burn a name by the manager from a managed namespace", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      managerAddress
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
        Cl.bool(true),
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
        Cl.principal(managerAddress),
        // Manager address
        Cl.some(Cl.principal(managerAddress)),
      ],
      managerAddress
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      managerAddress
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    // Call the mng-burn function from the BNS-V2 contract
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // Pass the uint id of the nft
      [Cl.uint(1)],
      managerAddress
    );
    expect(burnName.result).toBeOk(Cl.bool(true));
  });
  it("This should fail by burning a nonexistent name", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      managerAddress
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
        Cl.bool(true),
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
        Cl.principal(managerAddress),
        // Manager address
        Cl.some(Cl.principal(managerAddress)),
      ],
      managerAddress
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      managerAddress
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    // Call the mng-burn function from the BNS-V2 contract
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // Pass the uint id of the nft
      [Cl.uint(2)],
      managerAddress
    );
    expect(burnName.result).toBeErr(Cl.uint(124));
  });
  it("This should fail in a namespace with no manager", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      managerAddress
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
        Cl.bool(true),
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
        Cl.principal(managerAddress),
        // Manager address
        Cl.none(),
      ],
      managerAddress
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      managerAddress
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    // Call the mng-burn function from the BNS-V2 contract
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // Pass the uint id of the nft
      [Cl.uint(1)],
      managerAddress
    );
    expect(burnName.result).toBeErr(Cl.uint(154));
  });
  it("This should fail by not allowing a different address from the manager address to burn an nft from a managed namespace", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      managerAddress
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
        Cl.bool(true),
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
        Cl.principal(managerAddress),
        // Manager address
        Cl.some(Cl.principal(managerAddress)),
      ],
      managerAddress
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      managerAddress
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    // Call the mng-burn function from the BNS-V2 contract
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // Pass the uint id of the nft
      [Cl.uint(1)],
      address1
    );
    expect(burnName.result).toBeErr(Cl.uint(102));
  });
  it("This should still burn the name if it is listed when called by the manager address", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      managerAddress
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
        Cl.bool(true),
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
        Cl.principal(managerAddress),
        // Manager address
        Cl.some(Cl.principal(managerAddress)),
      ],
      managerAddress
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      managerAddress
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));

    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();

    // Call the list-in-ustx function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      managerAddress
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Call the mng-burn function from the BNS-V2 contract
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // Pass the uint id of the nft
      [Cl.uint(1)],
      managerAddress
    );
    expect(burnName.result).toBeOk(Cl.bool(true));
  });
  it("After Successful burn, check that all maps are updated correctly", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      managerAddress
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
        Cl.bool(true),
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
        Cl.principal(managerAddress),
        // Manager address
        Cl.some(Cl.principal(managerAddress)),
      ],
      managerAddress
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      managerAddress
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the list-in-ustx function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      managerAddress
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
    // Call the mng-burn function from the BNS-V2 contract
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // Pass the uint id of the nft
      [Cl.uint(1)],
      managerAddress
    );
    expect(burnName.result).toBeOk(Cl.bool(true));
    // Call the get-owner function from the BNS-V2 contract
    const getOwner = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-owner",
      // Pass the uint id of the nft
      [Cl.uint(1)],
      managerAddress
    );
    expect(getOwner.result).toBeOk(Cl.none());
    // Call the get-bns-from-id function from the BNS-V2 contract
    const idToBns = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-bns-from-id",
      // Pass the uint id of the nft
      [Cl.uint(1)],
      managerAddress
    );
    expect(idToBns.result).toBeNone();
    // Call the get-id-from-bns function from the BNS-V2 contract
    const bnsToId = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-id-from-bns",
      // Pass the uint id of the nft
      [Cl.buffer(name1Buff), Cl.buffer(namespaceBuff)],
      managerAddress
    );
    expect(bnsToId.result).toBeNone();
    // Call the get-owner function from the BNS-V2 contract
    const getAllNames = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-all-names-owned-by-principal",
      // Pass the uint id of the nft
      [Cl.principal(address1)],
      managerAddress
    );
    expect(getAllNames.result).toBeSome(Cl.list([]));
    const getPrimary = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-primary-name",
      // Pass the uint id of the nft
      [Cl.principal(address1)],
      managerAddress
    );
    expect(getPrimary.result).toBeNone();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("transfer", () => {
  it("This should successfully transfer a name from an unmanaged namespace if fast minted", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(transferName.result).toBeOk(Cl.bool(true));
  });
  it("This should successfully transfer a name on a namespace without a manager when 2 step minted", () => {
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
        Cl.bool(true),
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
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(transferName.result).toBeOk(Cl.bool(true));
  });
  it("This should successfully transfer a name from a managed namespace if fast minted", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      managerAddress
    );
    expect(transferName.result).toBeOk(Cl.bool(true));
  });
  it("This should successfully transfer a name on a namespace with a manager when 2 step minted", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      managerAddress
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
        Cl.bool(true),
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
        Cl.principal(managerAddress),
        // Manager address
        Cl.some(Cl.principal(managerAddress)),
      ],
      managerAddress
    );
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      managerAddress
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Call the name-preorder function from the BNS-V2 contract
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      managerAddress
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
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      managerAddress
    );
    expect(transferName.result).toBeOk(Cl.bool(true));
  });
  it("This should fail to transfer a nonexistent name", () => {
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
        Cl.bool(false),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(2), Cl.principal(address1), Cl.principal(address2)],
      managerAddress
    );
    expect(transferName.result).toBeErr(Cl.uint(107));
  });
  it("This should fail to transfer if claim-fast and 1 blockheight has not passed from claiming", () => {
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
        Cl.bool(false),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      managerAddress
    );
    expect(transferName.result).toBeErr(Cl.uint(122));
  });
  it("This should fail to transfer a name from a managed namespace if called from a not namespace manager address", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(transferName.result).toBeErr(Cl.uint(102));
  });
  it("This should fail to transfer a name from a managed namespace with transferable set to false", () => {
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
        Cl.bool(false),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      managerAddress
    );
    expect(transferName.result).toBeErr(Cl.uint(102));
  });
  it("This should fail to transfer a name from an unmanaged namespace when called not by the owner", () => {
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
        Cl.bool(false),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      managerAddress
    );
    expect(transferName.result).toBeErr(Cl.uint(102));
  });
  it("This should fail to transfer a name when listed", () => {
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
        Cl.bool(false),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the name-claim-fast function from the BNS-V2 contract
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      address1
    );
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(transferName.result).toBeErr(Cl.uint(105));
  });
  it("Check all maps update correctly when succesfully transfering a name and owner only had 1 name", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(transferName.result).toBeOk(Cl.bool(true));
    // Call the get-owner function from the BNS-V2 contract
    const getOwner = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-owner",
      // Pass the uint id of the nft
      [Cl.uint(1)],
      managerAddress
    );
    expect(getOwner.result).toBeOk(Cl.some(Cl.principal(address2)));
    // Call the get-owner function from the BNS-V2 contract
    const getAllNames = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-all-names-owned-by-principal",
      // Pass the uint id of the nft
      [Cl.principal(address1)],
      managerAddress
    );
    expect(getAllNames.result).toBeSome(Cl.list([]));
    // Call the get-owner function from the BNS-V2 contract
    const getAllNames2 = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-all-names-owned-by-principal",
      // Pass the uint id of the nft
      [Cl.principal(address2)],
      managerAddress
    );
    expect(getAllNames2.result).toBeSome(Cl.list([Cl.uint(1)]));
    // Call the get-owner function from the BNS-V2 contract
    const getPrimary = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-primary-name",
      // Pass the uint id of the nft
      [Cl.principal(address1)],
      managerAddress
    );
    expect(getPrimary.result).toBeNone();
    const getPrimary2 = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-primary-name",
      // Pass the uint id of the nft
      [Cl.principal(address2)],
      managerAddress
    );
    expect(getPrimary2.result).toBeSome(Cl.uint(1));
  });
  it("Check all maps update correctly when succesfully transfering a name and owner had more than 1 name", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name2Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName2.result).toBeOk(Cl.bool(true));
    const getPrimaryPre = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-primary-name",
      // Pass the uint id of the nft
      [Cl.principal(address1)],
      managerAddress
    );
    expect(getPrimaryPre.result).toBeSome(Cl.uint(1));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(transferName.result).toBeOk(Cl.bool(true));
    // Call the get-owner function from the BNS-V2 contract
    const getOwner = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-owner",
      // Pass the uint id of the nft
      [Cl.uint(1)],
      managerAddress
    );
    expect(getOwner.result).toBeOk(Cl.some(Cl.principal(address2)));
    // Call the get-owner function from the BNS-V2 contract
    const getAllNames = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-all-names-owned-by-principal",
      // Pass the uint id of the nft
      [Cl.principal(address1)],
      managerAddress
    );
    expect(getAllNames.result).toBeSome(Cl.list([Cl.uint(2)]));
    // Call the get-owner function from the BNS-V2 contract
    const getAllNames2 = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-all-names-owned-by-principal",
      // Pass the uint id of the nft
      [Cl.principal(address2)],
      managerAddress
    );
    expect(getAllNames2.result).toBeSome(Cl.list([Cl.uint(1)]));
    // Call the get-owner function from the BNS-V2 contract
    const getPrimary = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-primary-name",
      // Pass the uint id of the nft
      [Cl.principal(address1)],
      managerAddress
    );
    expect(getPrimary.result).toBeSome(Cl.uint(2));
    const getPrimary2 = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-primary-name",
      // Pass the uint id of the nft
      [Cl.principal(address2)],
      managerAddress
    );
    expect(getPrimary2.result).toBeSome(Cl.uint(1));
  });
  it("Check all maps update correctly when succesfully transfering a name and recipient already had a name", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name2Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address2),
      ],
      address2
    );
    expect(registerName2.result).toBeOk(Cl.bool(true));
    const getPrimaryPre = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-primary-name",
      // Pass the uint id of the nft
      [Cl.principal(address1)],
      managerAddress
    );
    expect(getPrimaryPre.result).toBeSome(Cl.uint(1));
    const getPrimaryPre2 = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-primary-name",
      // Pass the uint id of the nft
      [Cl.principal(address2)],
      managerAddress
    );
    expect(getPrimaryPre2.result).toBeSome(Cl.uint(2));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      address1
    );
    expect(transferName.result).toBeOk(Cl.bool(true));
    // Call the get-owner function from the BNS-V2 contract
    const getOwner = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-owner",
      // Pass the uint id of the nft
      [Cl.uint(1)],
      managerAddress
    );
    expect(getOwner.result).toBeOk(Cl.some(Cl.principal(address2)));
    // Call the get-owner function from the BNS-V2 contract
    const getAllNames = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-all-names-owned-by-principal",
      // Pass the uint id of the nft
      [Cl.principal(address1)],
      managerAddress
    );
    expect(getAllNames.result).toBeSome(Cl.list([]));
    // Call the get-owner function from the BNS-V2 contract
    const getAllNames2 = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-all-names-owned-by-principal",
      // Pass the uint id of the nft
      [Cl.principal(address2)],
      managerAddress
    );
    expect(getAllNames2.result).toBeSome(Cl.list([Cl.uint(2), Cl.uint(1)]));
    // Call the get-owner function from the BNS-V2 contract
    const getPrimary = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-primary-name",
      // Pass the uint id of the nft
      [Cl.principal(address1)],
      managerAddress
    );
    expect(getPrimary.result).toBeNone();
    const getPrimary2 = simnet.callReadOnlyFn(
      "BNS-V2",
      "get-primary-name",
      // Pass the uint id of the nft
      [Cl.principal(address2)],
      managerAddress
    );
    expect(getPrimary2.result).toBeSome(Cl.uint(2));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("update-zonefile-hash", () => {
  it("This should successfully update the zonefile hash of a name in an unmanaged namespace", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      address1
    );
    expect(updateZoneName.result).toBeOk(Cl.bool(true));
  });
  it("This should successfully update the zonefile hash of a name in a managed namespace", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      managerAddress
    );
    expect(updateZoneName.result).toBeOk(Cl.bool(true));
  });
  it("This should fail to update the zonefile hash of a nonexistent name", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name2Buff),
        Cl.buffer(zonefile2Buff),
      ],
      address1
    );
    expect(updateZoneName.result).toBeErr(Cl.uint(107));
  });
  it("This should fail to update the zonefile hash if the zonefile is the same", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff), Cl.buffer(zonefileBuff)],
      address1
    );
    expect(updateZoneName.result).toBeErr(Cl.uint(122));
  });
  it("This should fail to update the zonefile hash if the name is revoked", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const revokeName = simnet.callPublicFn(
      "BNS-V2",
      "name-revoke",
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff)],
      address1
    );
    expect(revokeName.result).toBeOk(Cl.bool(true));
    // Call the transfer function from the BNS-V2 contract
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff), Cl.buffer(zonefileBuff)],
      address1
    );
    expect(updateZoneName.result).toBeErr(Cl.uint(122));
  });
  it("This should fail to update the zonefile hash of a name in an unmanaged namespace when the tx-sender is not the owner", () => {
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
        Cl.bool(true),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      managerAddress
    );
    expect(updateZoneName.result).toBeErr(Cl.uint(102));
  });
  it("This should fail to update the zonefile hash of a name in a managed namespace when the contract-caller is not the manager", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      address1
    );
    expect(updateZoneName.result).toBeErr(Cl.uint(102));
  });
  it("This should fail to update the zonefile hash of a name if the name is not in a valid grace period", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlocks(11000);
    simnet.mineEmptyBlock();
    // Call the transfer function from the BNS-V2 contract
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      managerAddress
    );
    expect(updateZoneName.result).toBeErr(Cl.uint(122));
  });
  it("This should fail to update the zonefile hash of a name if the name is locked", () => {
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
        Cl.bool(true),
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
        Cl.some(Cl.principal(managerAddress)),
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

    // Call the name-claim-fast function from the BNS-V2 contract
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Pass the name in Uint8Array Format
      // Pass the namespace in Uint8Array Format
      // Pass the zonefile in Uint8Array Format
      // Pass the STX amount to burn
      // Pass the address to send to
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(200000000),
        Cl.principal(address1),
      ],
      managerAddress
    );
    expect(registerName.result).toBeOk(Cl.bool(true));

    const lockName = simnet.callPublicFn(
      "BNS-V2",
      "lock-name",
      [Cl.buffer(name1Buff), Cl.buffer(namespaceBuff)],
      managerAddress
    );
    expect(lockName.result).toBeOk(Cl.bool(true));

    // Call the transfer function from the BNS-V2 contract
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      managerAddress
    );
    expect(updateZoneName.result).toBeErr(Cl.uint(108));
  });
});
