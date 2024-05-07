import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { initSimnet } from "@hirosystems/clarinet-sdk";
import crypto from "crypto";

// Initialize simnet
const simnet = await initSimnet();

// Get accounts from simnet
const accounts = simnet.getAccounts();
// Assign deployer to deployer
const deployer = accounts.get("deployer")!;
// Assign wallet 1 to address1
const address1 = accounts.get("wallet_1")!;
// Assign wallet 2 to address2
const address2 = accounts.get("wallet_2")!;

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
  encoder.encode("locker"),
  saltBuff
);

// Encode the strings to Uint8Arrays
const name1Buff = encoder.encode("name1");
const name2Buff = encoder.encode("name2");
const invalidNameBuff = encoder.encode("name*");
const zonefileBuff = encoder.encode("zonefile");
const zonefile2Buff = encoder.encode("zonefile2");
const namespaceBuff = encoder.encode("locker");

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

const createLockerNamespace = () => {
  // Preorder the Namespace
  const preorderNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-preorder",
    // Passing 2 arguments:
    // 1. the namespace + salt with hash160
    // 2. the amount of STX to burn for the namespace
    [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
    // Called by any address, in this case deployer
    deployer
  );
  // This should give ok u146 since the blockheight is 2 + 144 TTL
  expect(preorderNamespace.result).toBeOk(Cl.uint(146));

  // Reveal the namespace
  const revealNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-reveal",
    // Pass all the arguments for the revealing of the name
    [
      // 1. The namespace
      Cl.buffer(namespaceBuff),
      // 2. The salt used to hash160 the namespace with
      Cl.buffer(saltBuff),
      // 3. Are transfers allowed on the namespace
      Cl.bool(true),
      // 4. Price base
      Cl.uint(1),
      // 5. Price coeff
      Cl.uint(1),
      // 6. Price buckets
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      Cl.uint(1),
      // 7. The non alpha discount
      Cl.uint(1),
      // 8. The no vowel discount
      Cl.uint(1),
      // 9. Lifetime of the namespace names
      Cl.uint(5000),
      // 10. Import address
      Cl.principal(deployer),
      // 11. Manager address: in this the managerAddress
      Cl.some(Cl.principal(deployer)),
    ],
    // Called by the address that made the preorder of the namespace
    deployer
  );
  // This should give ok true since it should be successful
  expect(revealNamespace.result).toBeOk(Cl.bool(true));

  // Launch the namespace
  const launchNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-ready",
    // 1. Only passing the namespace as argument
    [Cl.buffer(namespaceBuff)],
    // Called by the import address assigned in the namespace-reveal function
    deployer
  );
  // This should give ok true since it should be successful
  expect(launchNamespace.result).toBeOk(Cl.bool(true));

  // Transfer manager address to the .locker contract
  const transferToLockerAddress = simnet.callPublicFn(
    "BNS-V2",
    "mng-manager-transfer",
    // 1. New manager address
    // 2. The Namespace
    [Cl.contractPrincipal(deployer, "locker"), Cl.buffer(namespaceBuff)],
    // Called by the current manager
    deployer
  );
  // This should give ok true since it should be successful
  expect(transferToLockerAddress.result).toBeOk(Cl.bool(true));
};
