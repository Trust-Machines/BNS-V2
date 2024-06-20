import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { initSimnet } from "@hirosystems/clarinet-sdk";
import crypto from "crypto";

// Initialize simnet
const simnet = await initSimnet();

// Define constants for commission trait name and address, for market functions
const commTraitName = "gamma-bns-v2-commission-container";
const commTraitAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
// Define constants for commission trait name and address, for market functions
const commTraitNameWrong = "wrong-bns-v2-commission-container";
const commTraitAddressWrong = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

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

const invalidNamespaceBuffSalt = createHash160NameSpace(
  encoder.encode("namespace*"),
  saltBuff
);

// Encode the strings to Uint8Arrays
const name1Buff = encoder.encode("name1");
const name2Buff = encoder.encode("name2");
const invalidNameBuff = encoder.encode("name*");
const invalidNamespaceBuff = encoder.encode("namespace*");
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

const successfullyTwoStepRegisterANameInAnUnmanagedNamespace = () => {
  // Preorder the Namespace
  const preorderNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-preorder",
    // Passing 2 arguments:
    // 1. the namespace + salt with hash160
    // 2. the amount of STX to burn for the namespace
    [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
    // Called by any address, in this case address1
    address1
  );
  // This should give ok u146 since the blockheight is 2 + 144 TTL
  expect(preorderNamespace.result).toBeOk(Cl.uint(146));

  // Reveal the namespace
  simnet.mineEmptyBlock();

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
      Cl.principal(address1),
      // 11. Manager address: in this case is none to not have a manager
      Cl.none(),
    ],
    // Called by the address that made the preorder of the namespace
    address1
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
    address1
  );
  // This should give ok true since it should be successful
  expect(launchNamespace.result).toBeOk(Cl.bool(true));

  // Preorder the name
  const preorderName = simnet.callPublicFn(
    "BNS-V2",
    "name-preorder",
    // Passing 2 arguments:
    // 1. the name + salt with hash160
    // 2. the amount of STX to burn for the name since it is unmanaged
    [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
    // Called by any address, in this case address1
    address1
  );
  // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
  expect(preorderName.result).toBeOk(Cl.uint(150));

  simnet.mineEmptyBlock();

  // Register the name
  const registerName = simnet.callPublicFn(
    "BNS-V2",
    "name-register",
    // Passing 4 arguments:
    // 1. the namespace,
    // 2. the name,
    // 3. the salt used to hash160 the name with
    // 4. the zonefile
    [
      Cl.buffer(namespaceBuff),
      Cl.buffer(name1Buff),
      Cl.buffer(saltBuff),
      Cl.buffer(zonefileBuff),
    ],
    // Called by the address that preordered the name
    address1
  );
  // This should give ok true since it should be successful
  expect(registerName.result).toBeOk(Cl.bool(true));
};

const successfullyTwoStepRegisterASecondNameInAnUnmanagedNamespace = () => {
  // Preorder the name
  const preorderName = simnet.callPublicFn(
    "BNS-V2",
    "name-preorder",
    // Passing 2 arguments:
    // 1. the name + salt with hash160
    // 2. the amount of STX to burn for the name since it is unmanaged
    [Cl.buffer(name2BuffSalt), Cl.uint(200000000)],
    // Called by any address, in this case address1
    address1
  );
  // This should return 151, the current blockheight 7 plus the TTL 144 of the name preorder
  expect(preorderName.result).toBeOk(Cl.uint(153));

  simnet.mineEmptyBlock();

  // Register the name
  const registerName = simnet.callPublicFn(
    "BNS-V2",
    "name-register",
    // Passing 4 arguments:
    // 1. the namespace,
    // 2. the name,
    // 3. the salt used to hash160 the name with
    // 4. the zonefile
    [
      Cl.buffer(namespaceBuff),
      Cl.buffer(name2Buff),
      Cl.buffer(saltBuff),
      Cl.buffer(zonefileBuff),
    ],
    // Called by the address that preordered the name
    address1
  );
  // This should give ok true since it should be successful
  expect(registerName.result).toBeOk(Cl.bool(true));
};

const successfullyTwoStepRegisterANameInAManagedNamespace = () => {
  // Preorder the Namespace
  const preorderNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-preorder",
    // Passing 2 arguments:
    // 1. the namespace + salt with hash160
    // 2. the amount of STX to burn for the namespace
    [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
    // Called by any address, in this case address1
    address1
  );
  // This should give ok u146 since the blockheight is 2 + 144 TTL
  expect(preorderNamespace.result).toBeOk(Cl.uint(146));

  // Reveal the namespace
  simnet.mineEmptyBlock();

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
      Cl.principal(address1),
      // 11. Manager address: in this the managerAddress
      Cl.some(Cl.principal(managerAddress)),
    ],
    // Called by the address that made the preorder of the namespace
    address1
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
    address1
  );
  // This should give ok true since it should be successful
  expect(launchNamespace.result).toBeOk(Cl.bool(true));

  // Preorder the name
  const preorderName = simnet.callPublicFn(
    "BNS-V2",
    "mng-name-preorder",
    // Passing 1 argument:
    // 1. the name + salt with hash160
    [Cl.buffer(name1BuffSalt)],
    // Called by the managerAddress
    managerAddress
  );
  // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
  expect(preorderName.result).toBeOk(Cl.uint(150));

  // Register the name
  const registerName = simnet.callPublicFn(
    "BNS-V2",
    "mng-name-register",
    // Passing 5 arguments:
    // 1. the namespace,
    // 2. the name,
    // 3. the salt used to hash160 the name with
    // 4. the zonefile
    // 5. the address to send the name to
    [
      Cl.buffer(namespaceBuff),
      Cl.buffer(name1Buff),
      Cl.buffer(saltBuff),
      Cl.buffer(zonefileBuff),
      Cl.principal(address1),
    ],
    // Called by the managerAddress
    managerAddress
  );
  // This should give ok true since it should be successful
  expect(registerName.result).toBeOk(Cl.bool(true));
};

const successfullyTwoStepRegisterASecondNameInAManagedNamespace = () => {
  // Preorder the name
  const preorderName = simnet.callPublicFn(
    "BNS-V2",
    "mng-name-preorder",
    // Passing 1 argument:
    // 1. the name + salt with hash160
    [Cl.buffer(name2BuffSalt)],
    // Called by the managerAddress
    managerAddress
  );
  // This should return 151, the current blockheight 7 plus the TTL 144 of the name preorder
  expect(preorderName.result).toBeOk(Cl.uint(152));

  // Register the name
  const registerName = simnet.callPublicFn(
    "BNS-V2",
    "mng-name-register",
    // Passing 5 arguments:
    // 1. the namespace,
    // 2. the name,
    // 3. the salt used to hash160 the name with
    // 4. the zonefile
    // 5. the address to send the name to
    [
      Cl.buffer(namespaceBuff),
      Cl.buffer(name2Buff),
      Cl.buffer(saltBuff),
      Cl.buffer(zonefileBuff),
      Cl.principal(address1),
    ],
    // Called by the managerAddress
    managerAddress
  );
  // This should give ok true since it should be successful
  expect(registerName.result).toBeOk(Cl.bool(true));
};

const successfullyFastClaimANameInAnUnmanagedNamespace = () => {
  // Preorder the Namespace
  const preorderNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-preorder",
    // Passing 2 arguments:
    // 1. the namespace + salt with hash160
    // 2. the amount of STX to burn for the namespace
    [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
    // Called by any address, in this case address1
    address1
  );
  // This should give ok u146 since the blockheight is 2 + 144 TTL
  expect(preorderNamespace.result).toBeOk(Cl.uint(146));

  // Reveal the namespace
  simnet.mineEmptyBlock();

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
      Cl.principal(address1),
      // 11. Manager address: in this case is none to not have a manager
      Cl.none(),
    ],
    // Called by the address that made the preorder of the namespace
    address1
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
    address1
  );
  // This should give ok true since it should be successful
  expect(launchNamespace.result).toBeOk(Cl.bool(true));

  // Fast claim the name
  const fastClaimName = simnet.callPublicFn(
    "BNS-V2",
    "name-claim-fast",
    // Passing 5 arguments:
    // 1. the name
    // 2. the namespace
    // 3. the zonefile
    // 4. the stx to burn
    // 5. the address to receive the name
    [
      Cl.buffer(name1Buff),
      Cl.buffer(namespaceBuff),
      Cl.buffer(zonefileBuff),
      Cl.uint(10000000),
      Cl.principal(address1),
    ],
    // Called by the address that is the send-to address in unmanaged namespaces, in this case address1
    address1
  );
  // This should give ok true since it should be successful
  expect(fastClaimName.result).toBeOk(Cl.bool(true));
};
const successfullyFastClaimASecondNameInAnUnmanagedNamespace = () => {
  // Fast claim the name
  const fastClaimName = simnet.callPublicFn(
    "BNS-V2",
    "name-claim-fast",
    // Passing 5 arguments:
    // 1. the name
    // 2. the namespace
    // 3. the zonefile
    // 4. the stx to burn
    // 5. the address to receive the name
    [
      Cl.buffer(name2Buff),
      Cl.buffer(namespaceBuff),
      Cl.buffer(zonefileBuff),
      Cl.uint(10000000),
      Cl.principal(address1),
    ],
    // Called by the address that is the send-to address in unmanaged namespaces, in this case address1
    address1
  );
  // This should give ok true since it should be successful
  expect(fastClaimName.result).toBeOk(Cl.bool(true));
};

const successfullyFastClaimANameInAManagedNamespace = () => {
  // Preorder the Namespace
  const preorderNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-preorder",
    // Passing 2 arguments:
    // 1. the namespace + salt with hash160
    // 2. the amount of STX to burn for the namespace
    [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
    // Called by any address, in this case address1
    address1
  );
  // This should give ok u146 since the blockheight is 2 + 144 TTL
  expect(preorderNamespace.result).toBeOk(Cl.uint(146));

  // Reveal the namespace
  simnet.mineEmptyBlock();

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
      Cl.principal(address1),
      // 11. Manager address: in this the managerAddress
      Cl.some(Cl.principal(managerAddress)),
    ],
    // Called by the address that made the preorder of the namespace
    address1
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
    address1
  );
  // This should give ok true since it should be successful
  expect(launchNamespace.result).toBeOk(Cl.bool(true));

  // Fast claim the name
  const fastClaimName = simnet.callPublicFn(
    "BNS-V2",
    "name-claim-fast",
    // Passing 5 arguments:
    // 1. the name
    // 2. the namespace
    // 3. the zonefile
    // 4. the stx to burn
    // 5. the address to receive the name
    [
      Cl.buffer(name1Buff),
      Cl.buffer(namespaceBuff),
      Cl.buffer(zonefileBuff),
      Cl.uint(10000000),
      Cl.principal(address1),
    ],
    // Called by the manager address
    managerAddress
  );
  // This should give ok true since it should be successful
  expect(fastClaimName.result).toBeOk(Cl.bool(true));
};

const successfullyFastClaimASecondNameInAManagedNamespace = () => {
  // Fast claim the name
  const fastClaimName = simnet.callPublicFn(
    "BNS-V2",
    "name-claim-fast",
    // Passing 5 arguments:
    // 1. the name
    // 2. the namespace
    // 3. the zonefile
    // 4. the stx to burn
    // 5. the address to receive the name
    [
      Cl.buffer(name2Buff),
      Cl.buffer(namespaceBuff),
      Cl.buffer(zonefileBuff),
      Cl.uint(10000000),
      Cl.principal(address1),
    ],
    // Called by the manager address
    managerAddress
  );
  // This should give ok true since it should be successful
  expect(fastClaimName.result).toBeOk(Cl.bool(true));
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("TRANSFER FUNCTION", () => {
  it("This should successfully transfer a 2 step registered name in an unmanaged namespace", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by the address that is the owner
      address1
    );
    // This should give ok true since it should be successful
    expect(transferName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully transfer a 2 step registered name in a managed namespace", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by the managerAddress
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(transferName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully transfer a fast claimed name in an unmanaged namespace", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Mine an empty block
    simnet.mineEmptyBlock();

    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by the address that is the owner
      address1
    );
    // This should give ok true since it should be successful
    expect(transferName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully transfer a fast claimed name in a managed namespace", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Mine an empty block to
    simnet.mineEmptyBlock();

    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by the managerAddress
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(transferName.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to transfer a name the doesn't exist", () => {
    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by the managerAddress
      managerAddress
    );
    // This should give err 107 which is ERR-NO-NAME
    expect(transferName.result).toBeErr(Cl.uint(107));
  });

  it("This should fail to transfer a fast claimed name in an unmanaged namespace when trying to transfer before the block time has passed", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by the address that is the owner
      address1
    );
    // This should give err
    expect(transferName.result).toBeErr(Cl.uint(116));
  });

  it("This should fail to transfer a fast claimed name in a managed namespace when trying to transfer before the block time has passed", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by the managerAddress
      managerAddress
    );
    // This should give err
    expect(transferName.result).toBeErr(Cl.uint(116));
  });

  it("This should fail to transfer a name in a managed namespace when the contract-caller is not the namespace manager", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Mine an empty block
    simnet.mineEmptyBlock();

    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by address1 which should not be authorized to perform this even if it is the owner
      address1
    );
    // This should give err 102 which is ERR-NOT-AUTHORIZED
    expect(transferName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to transfer a name in a managed namespace when the contract-caller is the namespace manager but transfers are not allowed on the namespace", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(fastClaimName.result).toBeOk(Cl.bool(true));

    const switchTransfers = simnet.callPublicFn(
      "BNS-V2",
      "turn-off-manager-transfers",
      // Passing 1 argument:
      // 1. the namespace

      [Cl.buffer(namespaceBuff)],
      // Called by the manager address
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(switchTransfers.result).toBeOk(Cl.bool(true));

    // Mine an empty block
    simnet.mineEmptyBlock();

    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by managerAddress
      managerAddress
    );
    // This should give err 102 which is ERR-NOT-AUTHORIZED
    expect(transferName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to transfer a name in an unmanaged namespace when the tx-sender is not the owner", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Mine an empty block
    simnet.mineEmptyBlock();

    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by a non-owner address
      managerAddress
    );
    // This should give err 102 which is ERR-NOT-AUTHORIZED
    expect(transferName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to transfer a name in an unmanaged namespace when the name is listed in a market", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Mine an empty block
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the price,
      // 3. the comm-trait
      [
        Cl.uint(1),
        Cl.uint(10000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the a owner address
      address1
    );
    // This should give ok and the tuple containing the information of the listing
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(10000),
      })
    );

    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by the owner address
      address1
    );
    // This should give err 105 which is ERR-LISTED
    expect(transferName.result).toBeErr(Cl.uint(105));
  });

  it("This should fail to transfer a name in a managed namespace when the name is listed in a market", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Mine an empty block
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the price,
      // 3. the comm-trait
      [
        Cl.uint(1),
        Cl.uint(10000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the the manager address
      managerAddress
    );
    // This should give ok and the tuple containing the information of the listing
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(10000),
      })
    );

    // Transfer the name
    const transferName = simnet.callPublicFn(
      "BNS-V2",
      "transfer",
      // Passing 3 arguments:
      // 1. the id of the name,
      // 2. the owner,
      // 3. the recipient
      [Cl.uint(1), Cl.principal(address1), Cl.principal(address2)],
      // Called by the manager address
      managerAddress
    );
    // This should give err 105 which is ERR-LISTED
    expect(transferName.result).toBeErr(Cl.uint(105));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("LIST-IN-USTX-FUNCTION", () => {
  it("This should successfully list a 2 step registered name in an unmanaged namespace", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the owner of the name
      address1
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
  });

  it("This should successfully list a 2 step registered name in a managed namespace", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
  });

  it("This should successfully list a fast claimed name in an unmanaged namespace", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Mine an empty block
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the owner of the name
      address1
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
  });

  it("This should successfully list a fast claimed name in a managed namespace", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Mine an empty block
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
  });

  it("This should fail to list a name that doesn't exist", () => {
    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Call from a non-owner address
      address2
    );
    // Err 107 ERR-NO-NAME
    expect(listName.result).toBeErr(Cl.uint(107));
  });

  it("This should fail to list a name in an unmanaged namespace when it was fast claimed but the lock time has not passed", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Call from the owner address
      address1
    );
    // Err ERR-OPERATION-UNAUTHORIZED
    expect(listName.result).toBeErr(Cl.uint(116));
  });

  it("This should fail to list a name in a managed namespace when it was fast claimed but the lock time has not passed", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Call from the manager address
      managerAddress
    );
    // Err ERR-OPERATION-UNAUTHORIZED
    expect(listName.result).toBeErr(Cl.uint(116));
  });

  it("This should fail to list a name in an unmanaged namespace when the tx-sender is not the owner", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Mine an empty block
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Call from a non-owner address
      address2
    );
    // Err 102 ERR-NOT-AUTHORIZED
    expect(listName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to list a name in an unmanaged namespace when the contract-caller is not the manager", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Mine an empty block
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Call from a non-manager address
      address1
    );
    // Err 102 ERR-NOT-AUTHORIZED
    expect(listName.result).toBeErr(Cl.uint(102));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("UNLIST-IN-USTX-FUNCTION", () => {
  it("This should successfully unlist a 2 step registered name without a manager", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the owner of the name
      address1
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );
    // Unlist the name
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      // 1. the id of the name to unlist
      [Cl.uint(1)],
      // Called by the owner address
      address1
    );
    expect(unlistName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("unlist-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });

  it("This should successfully unlist a 2 step registered name with a manager", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Unlist the name
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      // 1. the id of the name to unlist
      [Cl.uint(1)],
      // Called by the manager address
      managerAddress
    );
    expect(unlistName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("unlist-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });

  it("This should successfully unlist a fast claimed name without a manager", () => {
    // Fast Claime a name
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the owner address
      address1
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Unlist the name
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      // 1. the id of the name to unlist
      [Cl.uint(1)],
      // Called by the owner address
      address1
    );
    expect(unlistName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("unlist-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });

  it("This should successfully unlist a fast claimed name with a manager", () => {
    // Fast Claime a name
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Unlist the name
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      // 1. the id of the name to unlist
      [Cl.uint(1)],
      // Called by the manager address
      managerAddress
    );
    expect(unlistName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("unlist-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });

  it("This should fail to unlist a name that doesn't exist", () => {
    // Unlist the name
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      // 1. the id of the name to unlist
      [Cl.uint(1)],
      // Called by an address
      address1
    );
    // Err 107 ERR-NO-NAME
    expect(unlistName.result).toBeErr(Cl.uint(107));
  });

  it("This should fail to unlist a name without a manager, when tx-sender is not the owner", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the owner address
      address1
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Unlist the name
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      // 1. the id of the name to unlist
      [Cl.uint(1)],
      // Called by a non-owner address
      address2
    );
    // Err 102 ERR-NOT-AUTHORIZED
    expect(unlistName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to unlist a name with a manager, when contrac-caller is not the manager", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Unlist the name
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      // 1. the id of the name to unlist
      [Cl.uint(1)],
      // Called by a non-manager address
      address2
    );
    // Err 102 ERR-NOT-AUTHORIZED
    expect(unlistName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to unlist a name without a manager, when the name is not listed", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();

    // Unlist the name
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      // 1. the id of the name to unlist
      [Cl.uint(1)],
      // Called by the owner address
      address1
    );
    // Should return err ERR-NOT-LISTED
    expect(unlistName.result).toBeErr(Cl.uint(103));
  });

  it("This should fail to unlist a name with a manager, when the name is not listed", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();

    // Unlist the name
    const unlistName = simnet.callPublicFn(
      "BNS-V2",
      "unlist-in-ustx",
      // 1. the id of the name to unlist
      [Cl.uint(1)],
      // Called by the manager address
      managerAddress
    );
    // Err 103 ERR-NOT-LISTED
    expect(unlistName.result).toBeErr(Cl.uint(103));
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
    simnet.mineEmptyBlock();

    // Reveal the namespace
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
    simnet.mineEmptyBlock();

    // Reveal the namespace
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
describe("BUY-IN-USTX-FUNCTION", () => {
  it("This should successfully buy a 2 step registered name without a manager", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the owner of the name
      address1
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Buy the name
    const buyName = simnet.callPublicFn(
      "BNS-V2",
      "buy-in-ustx",
      // 1. the id of the name to buy
      // 2. The commission trait
      [Cl.uint(1), Cl.contractPrincipal(commTraitAddress, commTraitName)],
      // Called by the buyer address
      address2
    );
    expect(buyName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("buy-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });

  it("This should successfully buy a 2 step registered name with a manager", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Buy the name
    const buyName = simnet.callPublicFn(
      "BNS-V2",
      "buy-in-ustx",
      // 1. the id of the name to buy
      // 2. The commission trait
      [Cl.uint(1), Cl.contractPrincipal(commTraitAddress, commTraitName)],
      // Called by the buyer address
      address2
    );
    expect(buyName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("buy-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });

  it("This should successfully buy a fast claimed name without a manager", () => {
    // Register a name
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the owner address
      address1
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Buy the name
    const buyName = simnet.callPublicFn(
      "BNS-V2",
      "buy-in-ustx",
      // 1. the id of the name to buy
      // 2. The commission trait
      [Cl.uint(1), Cl.contractPrincipal(commTraitAddress, commTraitName)],
      // Called by the buyer address
      address2
    );
    expect(buyName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("buy-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });

  it("This should successfully buy a fast claimed name with a manager", () => {
    // Register a name
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Buy the name
    const buyName = simnet.callPublicFn(
      "BNS-V2",
      "buy-in-ustx",
      // 1. the id of the name to buy
      // 2. The commission trait
      [Cl.uint(1), Cl.contractPrincipal(commTraitAddress, commTraitName)],
      // Called by the buyer address
      address2
    );
    expect(buyName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("buy-in-ustx"),
        id: Cl.uint(1),
      })
    );
  });

  it("This should fail to buy a name that doesn't exist", () => {
    // Buy the name
    const buyName = simnet.callPublicFn(
      "BNS-V2",
      "buy-in-ustx",
      // 1. the id of the name to buy
      // 2. The commission trait
      [
        Cl.uint(1),
        Cl.contractPrincipal(commTraitAddressWrong, commTraitNameWrong),
      ],
      // Called by the buyer address
      address2
    );
    // Should return err ERR-NO-NAME
    expect(buyName.result).toBeErr(Cl.uint(107));
  });

  it("This should fail to buy a name without a manager, if it is not listed", () => {
    // Register a name
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();

    // Buy the name
    const buyName = simnet.callPublicFn(
      "BNS-V2",
      "buy-in-ustx",
      // 1. the id of the name to buy
      // 2. The commission trait
      [Cl.uint(1), Cl.contractPrincipal(commTraitAddress, commTraitName)],
      // Called by the buyer address
      address2
    );
    // Should return err ERR-NOT-LISTED
    expect(buyName.result).toBeErr(Cl.uint(103));
  });

  it("This should fail to buy a name with a manager, if it is not listed", () => {
    // Register a name
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();

    // Buy the name
    const buyName = simnet.callPublicFn(
      "BNS-V2",
      "buy-in-ustx",
      // 1. the id of the name to buy
      // 2. The commission trait
      [Cl.uint(1), Cl.contractPrincipal(commTraitAddress, commTraitName)],
      // Called by the buyer address
      address2
    );
    // Should return err ERR-NOT-LISTED
    expect(buyName.result).toBeErr(Cl.uint(103));
  });

  it("This should fail to buy a name wrong commission trait", () => {
    // Register a name
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Buy the name
    const buyName = simnet.callPublicFn(
      "BNS-V2",
      "buy-in-ustx",
      // 1. the id of the name to buy
      // 2. The commission trait
      [
        Cl.uint(1),
        Cl.contractPrincipal(commTraitAddressWrong, commTraitNameWrong),
      ],
      // Called by the buyer address
      address2
    );
    // Should return err ERR-WRONG-COMMISSION
    expect(buyName.result).toBeErr(Cl.uint(104));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("SET-PRIMARY-NAME FUNCTION", () => {
  it("This should successfully change the primary name of an address in an unmanaged namespace, when 2 names are 2 step registered", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    successfullyTwoStepRegisterASecondNameInAnUnmanagedNamespace();

    // Change the primary name
    const changePrimaryName = simnet.callPublicFn(
      "BNS-V2",
      "set-primary-name",
      // 1. the id of the name to set as primary name
      [Cl.uint(2)],
      // Called by the owner address
      address1
    );
    expect(changePrimaryName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully change the primary name of an address in a managed namespace, when 2 names are 2 step registered", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAManagedNamespace();
    successfullyTwoStepRegisterASecondNameInAManagedNamespace();

    // Change the primary name
    const changePrimaryName = simnet.callPublicFn(
      "BNS-V2",
      "set-primary-name",
      // 1. the id of the name to set as primary name
      [Cl.uint(2)],
      // Called by the owner address
      address1
    );
    expect(changePrimaryName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully change the primary name of an address in an unmanaged namespace, when 2 names are fast claimed", () => {
    // Register a name
    successfullyFastClaimANameInAnUnmanagedNamespace();
    successfullyFastClaimASecondNameInAnUnmanagedNamespace();

    // Change the primary name
    const changePrimaryName = simnet.callPublicFn(
      "BNS-V2",
      "set-primary-name",
      // 1. the id of the name to set as primary name
      [Cl.uint(2)],
      // Called by the owner address
      address1
    );
    expect(changePrimaryName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully change the primary name of an address in a managed namespace, when 2 names are fast claimed", () => {
    // Register a name
    successfullyFastClaimANameInAManagedNamespace();
    successfullyFastClaimASecondNameInAManagedNamespace();

    // Change the primary name
    const changePrimaryName = simnet.callPublicFn(
      "BNS-V2",
      "set-primary-name",
      // 1. the id of the name to set as primary name
      [Cl.uint(2)],
      // Called by the owner address
      address1
    );
    // Successful response
    expect(changePrimaryName.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to change the primary name of an address, if the name doesn't exist", () => {
    // Change the primary name
    const changePrimaryName = simnet.callPublicFn(
      "BNS-V2",
      "set-primary-name",
      // 1. the id of the name to set as primary name
      [Cl.uint(2)],
      // Called by an address
      address1
    );
    // This returns err ERR-NO-NAME
    expect(changePrimaryName.result).toBeErr(Cl.uint(107));
  });

  it("This should fail to change the primary name of an address, if the tx-sender doesn't own names", () => {
    successfullyFastClaimANameInAManagedNamespace();

    // Change the primary name
    const changePrimaryName = simnet.callPublicFn(
      "BNS-V2",
      "set-primary-name",
      // 1. the id of the name to set as primary name
      [Cl.uint(1)],
      // Called by a non-owner address
      address2
    );
    // This returns err ERR-NO-BNS-NAMES-OWNED
    expect(changePrimaryName.result).toBeErr(Cl.uint(132));
  });

  it("This should fail to change the primary name of an address, if the tx-sender is not the owner of the name", () => {
    successfullyFastClaimANameInAManagedNamespace();
    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name2Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address2),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(fastClaimName.result).toBeOk(Cl.bool(true));

    // Change the primary name
    const changePrimaryName = simnet.callPublicFn(
      "BNS-V2",
      "set-primary-name",
      // 1. the id of the name to set as primary name
      [Cl.uint(1)],
      // Called by a non-owner address
      address2
    );
    // This returns err ERR-NOT-AUTHORIZED
    expect(changePrimaryName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to change the primary name of an address, if the name already is the primary name", () => {
    successfullyFastClaimANameInAManagedNamespace();

    // Change the primary name
    const changePrimaryName = simnet.callPublicFn(
      "BNS-V2",
      "set-primary-name",
      // 1. the id of the name to set as primary name
      [Cl.uint(1)],
      // Called by a non-owner address
      address1
    );
    // This returns err ERR-ALREADY-PRIMARY-NAME
    expect(changePrimaryName.result).toBeErr(Cl.uint(106));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("MNG-BURN FUNCTIONS", () => {
  it("This should successfully burn a name by the manager from a managed namespace", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Burn the name
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // 1. Pass the uint id of the nft that needs to be burned
      [Cl.uint(1)],
      // Called from the manager address
      managerAddress
    );
    // Expect and Ok true for success confirmation
    expect(burnName.result).toBeOk(Cl.bool(true));
  });

  it("This should fail by burning a nonexistent name", () => {
    // Burn the name
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // 1. Pass the uint id of the nft that doesn't exist
      [Cl.uint(1)],
      // Called from the manager address
      managerAddress
    );
    // This returns err ERR-NO-NAME
    expect(burnName.result).toBeErr(Cl.uint(107));
  });

  it("This should fail in a namespace with no manager", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Burn the name
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // 1. Pass the uint id of the nft
      [Cl.uint(1)],
      // Called from the manager address (which is not assigned in the namespace)
      managerAddress
    );
    // This returns err ERR-NO-NAMESPACE-MANAGER
    expect(burnName.result).toBeErr(Cl.uint(133));
  });

  it("This should fail by not allowing a different address from the manager address to burn an nft from a managed namespace", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Burn the name
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // 1. Pass the uint id of the nft
      [Cl.uint(1)],
      // Called from a non manager address
      address1
    );
    // This returns err ERR-NOT-AUTHORIZED
    expect(burnName.result).toBeErr(Cl.uint(102));
  });

  it("This should still burn the name if it is listed when called by the manager address", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // List the name
    const listName = simnet.callPublicFn(
      "BNS-V2",
      "list-in-ustx",
      // Call with 3 arguments
      // 1. the id of the name
      // 2. the price of the name
      // 3. the commission trait
      [
        Cl.uint(1),
        Cl.uint(200000),
        Cl.contractPrincipal(commTraitAddress, commTraitName),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should return ok and a tuple of the listing information
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(1),
        price: Cl.uint(200000),
      })
    );

    // Burn the name
    const burnName = simnet.callPublicFn(
      "BNS-V2",
      "mng-burn",
      // 1. Pass the uint id of the nft
      [Cl.uint(1)],
      // Called from the manager address
      managerAddress
    );
    // Successful response
    expect(burnName.result).toBeOk(Cl.bool(true));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("MNG-MANAGER-TRANSFER FUNCTION", () => {
  it("This should successfully change the manager of a namespace", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Transfer the Namespace
    const transferNamespace = simnet.callPublicFn(
      "BNS-V2",
      "mng-manager-transfer",
      // Passing 2 arguments:
      // 1. the new manager principal
      // 2. the namespace
      [Cl.principal(address1), Cl.buffer(namespaceBuff)],
      // Called by the manager address
      managerAddress
    );
    // Return a success response
    expect(transferNamespace.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to change the manager of a namespace that doesn't exist", () => {
    // Transfer the Namespace
    const transferNamespace = simnet.callPublicFn(
      "BNS-V2",
      "mng-manager-transfer",
      // Passing 2 arguments:
      // 1. the new manager principal
      // 2. the namespace
      [Cl.principal(address1), Cl.buffer(namespaceBuff)],
      // Called by the manager address
      managerAddress
    );
    // Return err ERR-NAMESPACE-NOT-FOUND
    expect(transferNamespace.result).toBeErr(Cl.uint(115));
  });

  it("This should fail to change the manager of an unmanaged namespace", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Transfer the Namespace
    const transferNamespace = simnet.callPublicFn(
      "BNS-V2",
      "mng-manager-transfer",
      // Passing 2 arguments:
      // 1. the new manager principal
      // 2. the namespace
      [Cl.principal(address1), Cl.buffer(namespaceBuff)],
      // Called by the manager address
      managerAddress
    );
    // Return err ERR-NO-NAMESPACE-MANAGER
    expect(transferNamespace.result).toBeErr(Cl.uint(133));
  });

  it("This should fail to change the manager of a namespace if the manager is not the contract-caller", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Transfer the Namespace
    const transferNamespace = simnet.callPublicFn(
      "BNS-V2",
      "mng-manager-transfer",
      // Passing 2 arguments:
      // 1. the new manager principal
      // 2. the namespace
      [Cl.principal(address1), Cl.buffer(namespaceBuff)],
      // Called by the manager address
      address1
    );
    // Return err ERR-NOT-AUTHORIZED
    expect(transferNamespace.result).toBeErr(Cl.uint(102));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-PREORDER FUNCTION", () => {
  it("this should successfully preorder a Namespace", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));
  });

  it("should allow to preorder the same Namespace from the same sender if TTL has passed", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // mine 144 empty blocks so that TTL is passed
    simnet.mineEmptyBlocks(144);

    // Preorder the Namespace
    const preorderNamespace2 = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u291 since the blockheight is 2 + 144 of time passed + 1 of the current block mined + 144 TTL
    expect(preorderNamespace2.result).toBeOk(Cl.uint(291));
  });

  it("should fail to preorder the same Namespace from the same sender", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Preorder the same Namespace again before the 144 ttl has passed
    const preorderNamespace2 = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by the same address that created the first order, in this case address1
      address1
    );
    // This should give err ERR-PREORDER-ALREADY-EXISTS
    expect(preorderNamespace2.result).toBeErr(Cl.uint(108));
  });

  it("should allow to preorder the same Namespace from a different sender", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Preorder the same Namespace again but with a different address
    const preorderNamespace2 = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address different than address1, in this case address2
      address2
    );
    // This should give ok u147 since the blockheight is 3 + 144 TTL
    expect(preorderNamespace2.result).toBeOk(Cl.uint(147));
  });

  it("should fail if the param of the hash is malformed", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace in buff formatted to force a malformatted param
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuff), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give err ERR-HASH-MALFORMED
    expect(preorderNamespace.result).toBeErr(Cl.uint(109));
  });

  it("should fail if the stx to burn is 0", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(0)],
      // Called by any address, in this case address1
      address1
    );
    // This should give err ERR-STX-BURNT-INSUFFICIENT
    expect(preorderNamespace.result).toBeErr(Cl.uint(110));
  });

  it("should fail if the tx-sender has insufficient funds", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace, extremely high
      [Cl.buffer(namespaceBuffSalt), Cl.uint(9007199254740991)],
      // Called by any address, in this case address1
      address1
    );
    // This should give err ERR-INSUFFICIENT-FUNDS
    expect(preorderNamespace.result).toBeErr(Cl.uint(1));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-REVEAL FUNCTION", () => {
  it("This should successfully reveal a Namespace without a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully reveal a Namespace with a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));
  });

  it("This should fail if no namespace preorder", () => {
    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // Return err ERR-PREORDER-NOT-FOUND
    expect(revealNamespace.result).toBeErr(Cl.uint(111));
  });

  it("This should fail if the namespace contains invalid characters", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(invalidNamespaceBuffSalt), Cl.uint(1000000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

    // Reveal the namespace
    const revealNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-reveal",
      // Pass all the arguments for the revealing of the name
      [
        // 1. The namespace
        Cl.buffer(invalidNamespaceBuff),
        // 2. The salt used to hash160 the namespace with
        Cl.buffer(saltBuff),

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // Return err ERR-CHARSET-INVALID
    expect(revealNamespace.result).toBeErr(Cl.uint(112));
  });

  it("This should fail if the namespace already exists", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Reveal the namespace
    simnet.mineEmptyBlock();

    // Reveal the namespace
    const revealNamespace2 = simnet.callPublicFn(
      "BNS-V2",
      "namespace-reveal",
      // Pass all the arguments for the revealing of the name
      [
        // 1. The namespace
        Cl.buffer(namespaceBuff),
        // 2. The salt used to hash160 the namespace with
        Cl.buffer(saltBuff),

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // Return err ERR-NAMESPACE-ALREADY-EXISTS
    expect(revealNamespace2.result).toBeErr(Cl.uint(113));
  });

  it("This should fail if burned stx is not enough for the price", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(10)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // Return err ERR-STX-BURNT-INSUFFICIENT
    expect(revealNamespace.result).toBeErr(Cl.uint(110));
  });

  it("This should fail if TTL has passed to reveal a namespace", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Mine 148 blocks to make sure TTL has passed
    simnet.mineEmptyBlocks(148);

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // Return err ERR-NAMESPACE-PREORDER-CLAIMABILITY-EXPIRED
    expect(revealNamespace.result).toBeErr(Cl.uint(114));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-READY FUNCTION", () => {
  it("This should successfully launch a Namespace without a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully launch a Namespace with a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to launch a Namespace that doesn't exist", () => {
    // Launch the namespace
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // 1. Only passing the namespace as argument
      [Cl.buffer(namespaceBuff)],
      // Called by the import address assigned in the namespace-reveal function
      address1
    );
    // Return err ERR-NAMESPACE-NOT-FOUND
    expect(launchNamespace.result).toBeErr(Cl.uint(115));
  });

  it("This should fail to launch a Namespace when called by a different address than the import address assigned in the namespace-reveal", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Launch the namespace
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // 1. Only passing the namespace as argument
      [Cl.buffer(namespaceBuff)],
      // Called by a different address than the import address assigned in the namespace-reveal function
      address2
    );
    // Return err ERR-OPERATION-UNAUTHORIZED
    expect(launchNamespace.result).toBeErr(Cl.uint(116));
  });

  it("This should fail to launch a Namespace that has already been launched", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Launch the namespace
    const launchNamespace2 = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // 1. Only passing the namespace as argument
      [Cl.buffer(namespaceBuff)],
      // Called by the import address assigned in the namespace-reveal function
      address1
    );
    // Return ERR-NAMESPACE-ALREADY-LAUNCHED
    expect(launchNamespace2.result).toBeErr(Cl.uint(117));
  });

  it("This should fail to launch a Namespace that TTL has already expired", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Mine blocks to pass the TTL
    simnet.mineEmptyBlocks(52596);

    // Launch the namespace
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // 1. Only passing the namespace as argument
      [Cl.buffer(namespaceBuff)],
      // Called by the import address assigned in the namespace-reveal function
      address1
    );
    // Return err ERR-NAMESPACE-PREORDER-LAUNCHABILITY-EXPIRED
    expect(launchNamespace.result).toBeErr(Cl.uint(118));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAME-IMPORT FUNCTION", () => {
  it("This should successfully import a name", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Import a name
    const importName = simnet.callPublicFn(
      "BNS-V2",
      "name-import",
      // Passing 5 arguments:
      // 1. the namespace
      // 2. the name
      // 3. the beneficiary
      // 4. the zonefile
      // 5. stx-burn
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.principal(address2),
        Cl.buffer(zonefileBuff),
        Cl.uint(1000000000),
      ],
      // Called by the import address
      address1
    );
    // This should give ok true
    expect(importName.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to import a name if no namespace", () => {
    // Import a name
    const importName = simnet.callPublicFn(
      "BNS-V2",
      "name-import",
      // Passing 5 arguments:
      // 1. the namespace
      // 2. the name
      // 3. the beneficiary
      // 4. the zonefile
      // 5. stx-burn
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.principal(address2),
        Cl.buffer(zonefileBuff),
        Cl.uint(1000000000),
      ],
      // Called by the import address
      address1
    );
    // Return err ERR-NAMESPACE-NOT-FOUND
    expect(importName.result).toBeErr(Cl.uint(115));
  });

  it("This should fail to import a name, if the name has invalid characters", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Import a name
    const importName = simnet.callPublicFn(
      "BNS-V2",
      "name-import",
      // Passing 5 arguments:
      // 1. the namespace
      // 2. the name
      // 3. the beneficiary
      // 4. the zonefile
      // 5. stx-burn
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(invalidNameBuff),
        Cl.principal(address2),
        Cl.buffer(zonefileBuff),
        Cl.uint(1000000000),
      ],
      // Called by the import address
      address1
    );
    // Return err ERR-CHARSET-INVALID
    expect(importName.result).toBeErr(Cl.uint(112));
  });

  it("This should fail to import a name if the tx-sender is not the import address", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Import a name
    const importName = simnet.callPublicFn(
      "BNS-V2",
      "name-import",
      // Passing 5 arguments:
      // 1. the namespace
      // 2. the name
      // 3. the beneficiary
      // 4. the zonefile
      // 5. stx-burn
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.principal(address2),
        Cl.buffer(zonefileBuff),
        Cl.uint(1000000000),
      ],
      // Called by a different address than the import address
      address2
    );
    // Return err ERR-OPERATION-UNAUTHORIZED
    expect(importName.result).toBeErr(Cl.uint(116));
  });

  it("This should fail to import a name in a launched namespace", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Import a name
    const importName = simnet.callPublicFn(
      "BNS-V2",
      "name-import",
      // Passing 5 arguments:
      // 1. the namespace
      // 2. the name
      // 3. the beneficiary
      // 4. the zonefile
      // 5. stx-burn
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.principal(address2),
        Cl.buffer(zonefileBuff),
        Cl.uint(1000000000),
      ],
      // Called by the import address
      address1
    );
    // Return err ERR-NAMESPACE-ALREADY-LAUNCHED
    expect(importName.result).toBeErr(Cl.uint(117));
  });

  it("This should fail to import a name if the namespace launchability TTL has passed", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Mine necessary blocks to pass the time
    simnet.mineEmptyBlocks(52596);

    // Import a name
    const importName = simnet.callPublicFn(
      "BNS-V2",
      "name-import",
      // Passing 5 arguments:
      // 1. the namespace
      // 2. the name
      // 3. the beneficiary
      // 4. the zonefile
      // 5. stx-burn
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.principal(address2),
        Cl.buffer(zonefileBuff),
        Cl.uint(1000000000),
      ],
      // Called by the import address
      address1
    );
    // Return err ERR-NAMESPACE-PREORDER-LAUNCHABILITY-EXPIRED
    expect(importName.result).toBeErr(Cl.uint(118));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-UPDATE-FUNCTION-PRICE FUNCTION", () => {
  it("This should successfully update the price in a namespace", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Update the price
    const updatePriceNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-update-function-price",
      // Pass all the arguments for updating the price of the namespace
      [
        // 1. The namespace
        Cl.buffer(namespaceBuff),
        // 2. Price base
        Cl.uint(2),
        // 3. Price coeff
        Cl.uint(2),
        // 4. Price buckets
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        // 7. The non alpha discount
        Cl.uint(2),
        // 8. The no vowel discount
        Cl.uint(2),
      ],
      // Called by the import addess from the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(updatePriceNamespace.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to update the price in a namespace, that doesn't exist", () => {
    // Update the price
    const updatePriceNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-update-function-price",
      // Pass all the arguments for updating the price of the namespace
      [
        // 1. The namespace
        Cl.buffer(namespaceBuff),
        // 2. Price base
        Cl.uint(2),
        // 3. Price coeff
        Cl.uint(2),
        // 4. Price buckets
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        // 7. The non alpha discount
        Cl.uint(2),
        // 8. The no vowel discount
        Cl.uint(2),
      ],
      // Called by the import addess from the namespace
      address1
    );
    // Return err ERR-NAMESPACE-NOT-FOUND
    expect(updatePriceNamespace.result).toBeErr(Cl.uint(115));
  });

  it("This should successfully update the price in a namespace", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Update the price
    const updatePriceNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-update-function-price",
      // Pass all the arguments for updating the price of the namespace
      [
        // 1. The namespace
        Cl.buffer(namespaceBuff),
        // 2. Price base
        Cl.uint(2),
        // 3. Price coeff
        Cl.uint(2),
        // 4. Price buckets
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        // 7. The non alpha discount
        Cl.uint(2),
        // 8. The no vowel discount
        Cl.uint(2),
      ],
      // Called by a different address than the import addess from the namespace
      address2
    );
    // Return err ERR-OPERATION-UNAUTHORIZED
    expect(updatePriceNamespace.result).toBeErr(Cl.uint(116));
  });

  it("This should fail to update the price in a namespace that doesn't allow price namespace changes", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Update the can-update-price-function
    const updatePriceFunctionNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-revoke-function-price-edition",
      // 1. namespace as argument
      [Cl.buffer(namespaceBuff)],
      // Call from the import address of the namespace
      address1
    );
    // Return a success response
    expect(updatePriceFunctionNamespace.result).toBeOk(Cl.bool(true));

    // Update the price
    const updatePriceNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-update-function-price",
      // Pass all the arguments for updating the price of the namespace
      [
        // 1. The namespace
        Cl.buffer(namespaceBuff),
        // 2. Price base
        Cl.uint(2),
        // 3. Price coeff
        Cl.uint(2),
        // 4. Price buckets
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        Cl.uint(2),
        // 7. The non alpha discount
        Cl.uint(2),
        // 8. The no vowel discount
        Cl.uint(2),
      ],
      // Called by the import addess from the namespace
      address1
    );
    // Return err ERR-OPERATION-UNAUTHORIZED
    expect(updatePriceNamespace.result).toBeErr(Cl.uint(116));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-REVOKE-FUNCTION-PRICE-EDITION FUNCTION", () => {
  it("This should successfully update the can-update-price-function of a namespace", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Update the can-update-price-function
    const updatePriceFunctionNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-revoke-function-price-edition",
      // 1. namespace as argument
      [Cl.buffer(namespaceBuff)],
      // Call from the import address of the namespace
      address1
    );
    // Return a success response
    expect(updatePriceFunctionNamespace.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to update the can-update-price-function of a namespace if no namespace", () => {
    // Update the can-update-price-function
    const updatePriceFunctionNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-revoke-function-price-edition",
      // 1. namespace as argument
      [Cl.buffer(namespaceBuff)],
      // Call from the import address of the namespace
      address1
    );
    // Return err ERR-NAMESPACE-NOT-FOUND
    expect(updatePriceFunctionNamespace.result).toBeErr(Cl.uint(115));
  });

  it("This should fail to update the can-update-price-function of a namespace if the tx-sender is not the import address", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Update the can-update-price-function
    const updatePriceFunctionNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-revoke-function-price-edition",
      // 1. namespace as argument
      [Cl.buffer(namespaceBuff)],
      // Call from a different address than the import address
      address2
    );
    // Return err ERR-OPERATION-UNAUTHORIZED
    expect(updatePriceFunctionNamespace.result).toBeErr(Cl.uint(116));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAME-CLAIM-FAST FUNCTION", () => {
  it("This should successfully fast mint a name on a launched namespace without a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by the address that is the send-to address in unmanaged namespaces, in this case address1
      address1
    );
    // This should give ok true since it should be successful
    expect(fastClaimName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully fast mint a name on a launched namespace with a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(fastClaimName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully fast mint a name on a launched namespace without a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by the address that is the send-to address in unmanaged namespaces, in this case address1
      address1
    );
    // This should give ok true since it should be successful
    expect(fastClaimName.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name2Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefile2Buff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by the address that is the send-to address in unmanaged namespaces, in this case address1
      address1
    );
    // This should give ok true since it should be successful
    expect(fastClaimName2.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully fast mint two names on a launched namespace with a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(fastClaimName.result).toBeOk(Cl.bool(true));
    // Fast claim the name
    const fastClaimName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name2Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefile2Buff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(fastClaimName2.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to fast mint name on a namespace that doesn't exist", () => {
    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by a non manager address
      address1
    );
    // Return err ERR-NAMESPACE-NOT-FOUND
    expect(fastClaimName.result).toBeErr(Cl.uint(115));
  });

  it("This should fail to fast mint a name that is already claimed", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by the manager address
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(fastClaimName.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by the manager address
      managerAddress
    );
    // Return err ERR-NAME-NOT-AVAILABLE
    expect(fastClaimName2.result).toBeErr(Cl.uint(120));
  });

  it("This should fail to fast mint name on a launched namespace with a manager when the contract-caller is not the manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address1),
      ],
      // Called by a non manager address
      address1
    );
    // Return err ERR-NOT-AUTHORIZED
    expect(fastClaimName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to fast mint a name on a launched namespace without a manager when the tx-sender is not the send-to address", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address2),
      ],
      // Called by a different address than the send-to address
      address1
    );
    // Return err ERR-NOT-AUTHORIZED
    expect(fastClaimName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to fast mint a name on a launched namespace without a manager and the user does not have sufficient funds to burn stx", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(9007199254740991),
        Cl.principal(address1),
      ],
      // Called by the send-to address
      address1
    );
    // Return err ERR-INSUFFICIENT-FUNDS
    expect(fastClaimName.result).toBeErr(Cl.uint(1));
  });

  it("This should fail to fast mint a name on a launched namespace without a manager and the user does not burn enough for the name price", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(1),
        Cl.principal(address1),
      ],
      // Called by the send-to address
      address1
    );
    // Return err ERR-STX-BURNT-INSUFFICIENT
    expect(fastClaimName.result).toBeErr(Cl.uint(110));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAME-PREORDER FUNCTION", () => {
  it("This should successfully preorder a name on a launched namespace without a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));
  });

  it("This should successfully preorder a name on a launched namespace without a manager if the previous preorder has expired", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Mine blocks for order to expire
    simnet.mineEmptyBlocks(145);

    // Preorder the name
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 295, the current blockheight 151 plus the TTL 144 of the name preorder
    expect(preorderName2.result).toBeOk(Cl.uint(296));
  });

  it("This should successfully preorder a name on a launched namespace with a manager even though this is not the intended use", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));
  });

  it("This should fail to preorder a name if a preorder for the same name and namespace exists", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Preorder the name
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // Return err ERR-NAME-PREORDER-ALREADY-EXISTS
    expect(preorderName2.result).toBeErr(Cl.uint(128));
  });

  it("This should fail to preorder a name if a preorder for the same name and namespace exists even if it was made from the mng-name-preorder function", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Preorder the name
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // Return err ERR-NAME-PREORDER-ALREADY-EXISTS
    expect(preorderName2.result).toBeErr(Cl.uint(128));
  });

  it("This should fail to preorder a name if hash is malformed", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name in a purposely bad format
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1Buff), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // Return err ERR-HASH-MALFORMED
    expect(preorderName.result).toBeErr(Cl.uint(109));
  });

  it("This should fail to preorder a name if stx to burn 0", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(0)],
      // Called by any address, in this case address1
      address1
    );
    // Return err ERR-STX-BURNT-INSUFFICIENT
    expect(preorderName.result).toBeErr(Cl.uint(110));
  });

  it("This should fail to preorder a name if stx to burn not enough in balance of user", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged, extremely high
      [Cl.buffer(name1BuffSalt), Cl.uint(9007199254740991)],
      // Called by any address, in this case address1
      address1
    );
    // Return err ERR-INSUFFICIENT-FUNDS
    expect(preorderName.result).toBeErr(Cl.uint(1));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAME-REGISTER FUNCTION", () => {
  it("This should succesfully register a name on an unmanaged namespace", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    simnet.mineEmptyBlock();

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));
  });

  it("This should succesfully register a name on an unmanaged namespace even if someone preordered it after me", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Preorder the name
    const preorderSameName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address2
      address2
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderSameName.result).toBeOk(Cl.uint(151));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));
  });

  it("This should succesfully register a name on an unmanaged namespace even if someone preordered it after me and registered before me", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Preorder the name
    const preorderSameName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address2
      address2
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderSameName.result).toBeOk(Cl.uint(151));

    simnet.mineEmptyBlock();

    // Register the name
    const registerSameName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address2
    );
    // This should give ok true since it should be successful
    expect(registerSameName.result).toBeOk(Cl.bool(true));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));
  });

  it("This should succesfully register a name on an unmanaged namespace even if someone fastclaimed it after I made the preorder", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address2),
      ],
      // Called by the address that is the send-to address in unmanaged namespaces, in this case address2
      address2
    );
    // This should give ok true since it should be successful
    expect(fastClaimName.result).toBeOk(Cl.bool(true));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));
  });

  it("This should succesfully register 2 different names", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    simnet.mineEmptyBlock();

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name2BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 151, the current blockheight 7 plus the TTL 144 of the name preorder
    expect(preorderName2.result).toBeOk(Cl.uint(153));

    simnet.mineEmptyBlock();

    // Register the name
    const registerName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name2Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // This should give ok true since it should be successful
    expect(registerName2.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to register a name if no name-preorder", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // Return err ERR-PREORDER-NOT-FOUND
    expect(registerName.result).toBeErr(Cl.uint(111));
  });

  it("This should fail to register a name if no namespace", () => {
    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 146, the current blockheight 2 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(146));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // Return err ERR-NAMESPACE-NOT-FOUND
    expect(registerName.result).toBeErr(Cl.uint(115));
  });

  it("This should fail to register a name if the namespace has a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // Return err ERR-NOT-AUTHORIZED
    expect(registerName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to register a name if name already exists", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    simnet.mineEmptyBlock();

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));

    // Register the name
    const registerName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // Return err ERR-OWNER-IS-THE-SAME
    expect(registerName2.result).toBeErr(Cl.uint(134));
  });

  it("This should fail to register a name if name was preordered before my preorder and registered by the principal of the first preorder", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderSameName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address2
      address2
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderSameName.result).toBeOk(Cl.uint(150));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(151));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address2
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));

    // Register the name
    const registerName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // Return err ERR-PREORDERED-BEFORE
    expect(registerName2.result).toBeErr(Cl.uint(136));
  });

  it("This should fail to register a name if name was fast claimed before my preorder", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Fast claim the name
    const fastClaimName = simnet.callPublicFn(
      "BNS-V2",
      "name-claim-fast",
      // Passing 5 arguments:
      // 1. the name
      // 2. the namespace
      // 3. the zonefile
      // 4. the stx to burn
      // 5. the address to receive the name
      [
        Cl.buffer(name1Buff),
        Cl.buffer(namespaceBuff),
        Cl.buffer(zonefileBuff),
        Cl.uint(10000000),
        Cl.principal(address2),
      ],
      // Called by the address that is the send-to address in unmanaged namespaces, in this case address1
      address2
    );
    // This should give ok true since it should be successful
    expect(fastClaimName.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(151));

    simnet.mineEmptyBlock();

    // Register the name
    const registerName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // Return err ERR-FAST-MINTED-BEFORE
    expect(registerName2.result).toBeErr(Cl.uint(135));
  });

  it("This should fail to register a name if name was preordered before namespace launch", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

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

    // Launch the namespace
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // 1. Only passing the namespace as argument
      [Cl.buffer(namespaceBuff)],
      // Called by the import address assigned in the namespace-reveal function
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // Return err ERR-NAME-PREORDERED-BEFORE-NAMESPACE-LAUNCH
    expect(registerName.result).toBeErr(Cl.uint(129));
  });

  it("This should fail to register a name if TTL has passed", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Mine blocks to pass TTL
    simnet.mineEmptyBlocks(150);

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // Return err ERR-PREORDER-CLAIMABILITY-EXPIRED
    expect(registerName.result).toBeErr(Cl.uint(114));
  });

  it("This should fail to register a name if burned STX was not enough, this should also act as a blocker to preorder a name with mng-name-preorder", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(1)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    simnet.mineEmptyBlock();

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // Return err ERR-STX-BURNT-INSUFFICIENT
    expect(registerName.result).toBeErr(Cl.uint(110));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("MNG-NAME-PREORDER FUNCTION", () => {
  it("This should successfully preorder a name on a launched namespace without a manager even though it is not its intended use", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));
  });

  it("This should successfully preorder a name on a launched namespace with a manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));
  });

  it("This should successfully preorder a name on a launched namespace with a manager, where the previous preorder has expired", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Mine blocks to pass ttl
    simnet.mineEmptyBlocks(144);

    // Preorder the name
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 294, the current blockheight 150 plus the TTL 144 of the name preorder
    expect(preorderName2.result).toBeOk(Cl.uint(295));
  });

  it("This should fail to preorder a name if a preorder for the same name and namespace exists and the ttl has not passed", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Preorder the name
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // Return err ERR-NAME-PREORDER-ALREADY-EXISTS
    expect(preorderName2.result).toBeErr(Cl.uint(128));
  });

  it("This should fail to preorder a name if a preorder for the same name and namespace exists even if it was made from the name-preorder function", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(1)],
      // Called by the manager address
      managerAddress
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Preorder the name
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // Return err ERR-NAME-PREORDER-ALREADY-EXISTS
    expect(preorderName2.result).toBeErr(Cl.uint(128));
  });

  it("This should fail to preorder a name if hash is malformed", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1Buff)],
      // Called by the managerAddress
      managerAddress
    );
    // Return err ERR-HASH-MALFORMED
    expect(preorderName.result).toBeErr(Cl.uint(109));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("MNG-NAME-REGISTER FUNCTION", () => {
  it("This should succesfully register a name in a managed namespace", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the managerAddress
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));
  });

  it("This should succesfully register 2 different names in a managed namespace", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the managerAddress
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name2BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 151, the current blockheight 7 plus the TTL 144 of the name preorder
    expect(preorderName2.result).toBeOk(Cl.uint(152));

    // Register the name
    const registerName2 = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name2Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the managerAddress
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(registerName2.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to register a name if no namespace", () => {
    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 146, the current blockheight 2 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(146));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the managerAddress
      managerAddress
    );
    // Return err ERR-NAMESPACE-NOT-FOUND
    expect(registerName.result).toBeErr(Cl.uint(115));
  });

  it("This should fail to register a name if the namespace has no manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the managerAddress
      managerAddress
    );
    // Return err ERR-NO-NAMESPACE-MANAGER
    expect(registerName.result).toBeErr(Cl.uint(133));
  });

  it("This should fail to register a name if no name-preorder", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the managerAddress
      managerAddress
    );
    // Return err ER-PREORDER-NOT-FOUND
    expect(registerName.result).toBeErr(Cl.uint(111));
  });

  it("This should fail to register a name in a managed namespace if contract-caller not the manager", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the address 1 not manager
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the address 1 not manager
      address1
    );
    // Return err ERR-PREORDER-NOT-FOUND
    expect(registerName.result).toBeErr(Cl.uint(111));
  });

  it("This should fail to register a name if name already exists", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the managerAddress
      managerAddress
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));

    // Mine empty blocks
    simnet.mineEmptyBlocks(144);

    // Preorder the name
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 295, the current blockheight 151 plus the TTL 144 of the name preorder
    expect(preorderName2.result).toBeOk(Cl.uint(296));

    // Register the name
    const registerName2 = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the managerAddress
      managerAddress
    );
    // Return err ERR-NAME-NOT-AVAILABLE
    expect(registerName2.result).toBeErr(Cl.uint(120));
  });

  it("This should fail to register a name if name was preordered before namespace launch", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 148, the current blockheight 4 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(149));

    // Launch the namespace
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // 1. Only passing the namespace as argument
      [Cl.buffer(namespaceBuff)],
      // Called by the import address assigned in the namespace-reveal function
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the managerAddress
      managerAddress
    );
    // Return err ERR-NAME-PREORDERED-BEFORE-NAMESPACE-LAUNCH
    expect(registerName.result).toBeErr(Cl.uint(129));
  });

  it("This should fail to register a name if TTL has passed", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this the managerAddress
        Cl.some(Cl.principal(managerAddress)),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Passing 1 argument:
      // 1. the name + salt with hash160
      [Cl.buffer(name1BuffSalt)],
      // Called by the managerAddress
      managerAddress
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    // Mine blocks to pass ttl
    simnet.mineEmptyBlocks(150);

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-register",
      // Passing 5 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      // 5. the address to send the name to
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
        Cl.principal(address1),
      ],
      // Called by the managerAddress
      managerAddress
    );
    // Return err ERR-PREORDER-CLAIMABILITY-EXPIRED
    expect(registerName.result).toBeErr(Cl.uint(114));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("UPDATE-ZONEFILE-HASH FUNCTION", () => {
  it("This should successfully update the zonefile hash of a name in an unmanaged namespace", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Update the zone file
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      // Pass 3 arguments:
      // 1. namespace
      // 2. name
      // 3. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      // Called from any address
      address1
    );
    // Should return a success response
    expect(updateZoneName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully update the zonefile hash of a name in a managed namespace", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Update the zone file
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      // Pass 3 arguments:
      // 1. namespace
      // 2. name
      // 3. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      // Called from the manager address
      managerAddress
    );
    // Should return a success response
    expect(updateZoneName.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to update the zonefile hash of a nonexistent name", () => {
    // Update the zone file
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      // Pass 3 arguments:
      // 1. namespace
      // 2. name
      // 3. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      // Called from the manager address
      managerAddress
    );
    // Return err ERR-NO-NAME
    expect(updateZoneName.result).toBeErr(Cl.uint(107));
  });

  it("This should fail to update the zonefile hash if the zonefile is the same", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Update the zone file
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      // Pass 3 arguments:
      // 1. namespace
      // 2. name
      // 3. zonefile-hash, in this case the same as before
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff), Cl.buffer(zonefileBuff)],
      // Called from the manager address
      managerAddress
    );
    // Return err ERR-OPERATION-UNAUTHORIZED
    expect(updateZoneName.result).toBeErr(Cl.uint(116));
  });

  it("This should fail to update the zonefile hash if the name is revoked", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Revoke the name
    const revokeName = simnet.callPublicFn(
      "BNS-V2",
      "name-revoke",
      // Pass 2 arguments
      // 1. namespace
      // 2. name
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff)],
      // Called from the import address
      address1
    );
    expect(revokeName.result).toBeOk(Cl.bool(true));

    // Update the zone file
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      // Pass 3 arguments:
      // 1. namespace
      // 2. name
      // 3. zonefile-hash, in this case the same as before
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      // Called from the manager address
      address1
    );
    // Return err ERR-NAME-REVOKED
    expect(updateZoneName.result).toBeErr(Cl.uint(126));
  });

  it("This should fail to update the zonefile hash of a name in an unmanaged namespace when the tx-sender is not the owner", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    // Update the zone file
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      // Pass 3 arguments:
      // 1. namespace
      // 2. name
      // 3. zonefile-hash, in this case the same as before
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      // Called from a different address than the owners
      address2
    );
    // Return err ERR-NOT-AUTHORIZED
    expect(updateZoneName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to update the zonefile hash of a name in a managed namespace when the contract-caller is not the manager", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    /// Update the zone file
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      // Pass 3 arguments:
      // 1. namespace
      // 2. name
      // 3. zonefile-hash, in this case the same as before
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      // Called from a non manager address
      address1
    );
    // Return err ERR-NOT-AUTHORIZED
    expect(updateZoneName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to update the zonefile hash of a name if the name is not in a valid grace period", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // Mine blocks to pass the grace period
    simnet.mineEmptyBlocks(11000);

    /// Update the zone file
    const updateZoneName = simnet.callPublicFn(
      "BNS-V2",
      "update-zonefile-hash",
      // Pass 3 arguments:
      // 1. namespace
      // 2. name
      // 3. zonefile-hash, in this case the same as before
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(zonefile2Buff),
      ],
      // Called from a non manager address
      managerAddress
    );
    // Return err ERR-OPERATION-UNAUTHORIZED
    expect(updateZoneName.result).toBeErr(Cl.uint(116));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAME-REVOKE FUNCTION", () => {
  it("This should successfully revoke a name in an unmanaged namespace", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Revoke the name
    const revokeName = simnet.callPublicFn(
      "BNS-V2",
      "name-revoke",
      // Pass 2 arguments
      // 1. namespace
      // 2. name
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff)],
      // Called from the import address
      address1
    );
    expect(revokeName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully revoke a name in a managed namespace", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Revoke the name
    const revokeName = simnet.callPublicFn(
      "BNS-V2",
      "name-revoke",
      // Pass 2 arguments
      // 1. namespace
      // 2. name
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff)],
      // Called from the manager address
      managerAddress
    );
    expect(revokeName.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to revoke a name in a namespace that does not exist", () => {
    // Revoke the name
    const revokeName = simnet.callPublicFn(
      "BNS-V2",
      "name-revoke",
      // Pass 2 arguments
      // 1. namespace
      // 2. name
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff)],
      // Called from the manager address
      managerAddress
    );
    // Return err ERR-NAMESPACE-NOT-FOUND
    expect(revokeName.result).toBeErr(Cl.uint(115));
  });

  it("This should fail to revoke a name in a managed namespace but the contract-caller is not the manager", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Revoke the name
    const revokeName = simnet.callPublicFn(
      "BNS-V2",
      "name-revoke",
      // Pass 2 arguments
      // 1. namespace
      // 2. name
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff)],
      // Called from a non manager address
      address1
    );
    // Return err ERR-NOT-AUTHORIZED
    expect(revokeName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to revoke a name in an unmanaged namespace but the tx-sender is not the import address", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Revoke the name
    const revokeName = simnet.callPublicFn(
      "BNS-V2",
      "name-revoke",
      // Pass 2 arguments
      // 1. namespace
      // 2. name
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff)],
      // Called from a non import address
      address2
    );
    // Return err ERR-NOT-AUTHORIZED
    expect(revokeName.result).toBeErr(Cl.uint(102));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAME-RENEWAL FUNCTION", () => {
  it("This should successfully renew a name in an unmanaged namespace when the name is still within the lifetime", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(20000000),
        Cl.none(),
      ],
      // Called from the owner address
      address1
    );
    // Expect a successful response
    expect(renewName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully renew a name in an unmanaged namespace when the name is within the grace period", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Mine Empty blocks to get into grace period
    simnet.mineEmptyBlocks(6000);

    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(20000000),
        Cl.none(),
      ],
      // Called from the owner address
      address1
    );
    // Expect a successful response
    expect(renewName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully renew a name in an unmanaged namespace when the name is not in the grace period by the owner", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Mine Empty blocks to get into grace period
    simnet.mineEmptyBlocks(11000);

    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(20000000),
        Cl.none(),
      ],
      // Called from the owner address
      address1
    );
    // Expect a successful response
    expect(renewName.result).toBeOk(Cl.bool(true));
  });

  it("This should successfully renew a name in an unmanaged namespace when the name is not in the grace period by a different address than the owner", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Mine Empty blocks to get into grace period
    simnet.mineEmptyBlocks(11000);

    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(20000000),
        Cl.none(),
      ],
      // Called from a non owner address
      address2
    );
    // Expect a successful response
    expect(renewName.result).toBeOk(Cl.bool(true));
  });

  it("This should fail to renew a name in an unmanaged namespace when the name does not exist", () => {
    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(20000000),
        Cl.none(),
      ],
      // Called from owner address
      address1
    );
    // Return err ERR-NO-NAME
    expect(renewName.result).toBeErr(Cl.uint(107));
  });

  it("This should fail to renew a name in a managed namespace", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(20000000),
        Cl.none(),
      ],
      // Called from owner address
      address1
    );
    // Return err ERR-NAMESPACE-HAS-MANAGER
    expect(renewName.result).toBeErr(Cl.uint(130));
  });

  it("This should fail to renew a name if the namespace is not launched", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
    );
    // This should give ok true since it should be successful
    expect(revealNamespace.result).toBeOk(Cl.bool(true));

    // Import a name
    const importName = simnet.callPublicFn(
      "BNS-V2",
      "name-import",
      // Passing 5 arguments:
      // 1. the namespace
      // 2. the name
      // 3. the beneficiary
      // 4. the zonefile
      // 5. stx-burn
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.principal(address2),
        Cl.buffer(zonefileBuff),
        Cl.uint(1000000000),
      ],
      // Called by the import address
      address1
    );
    // This should give ok true
    expect(importName.result).toBeOk(Cl.bool(true));

    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(20000000),
        Cl.none(),
      ],
      // Called from owner address
      address1
    );
    // Return err ERR-NAMESPACE-NOT-LAUNCHED
    expect(renewName.result).toBeErr(Cl.uint(119));
  });

  it("This should fail to renew a name if the namespace does not require renewals", () => {
    // Preorder the Namespace
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Passing 2 arguments:
      // 1. the namespace + salt with hash160
      // 2. the amount of STX to burn for the namespace
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace.result).toBeOk(Cl.uint(146));

    // Reveal the namespace
    simnet.mineEmptyBlock();

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
        Cl.uint(0),
        // 10. Import address
        Cl.principal(address1),
        // 11. Manager address: in this case is none to not have a manager
        Cl.none(),
      ],
      // Called by the address that made the preorder of the namespace
      address1
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
      address1
    );
    // This should give ok true since it should be successful
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

    // Preorder the name
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Passing 2 arguments:
      // 1. the name + salt with hash160
      // 2. the amount of STX to burn for the name since it is unmanaged
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      // Called by any address, in this case address1
      address1
    );
    // This should return 149, the current blockheight 5 plus the TTL 144 of the name preorder
    expect(preorderName.result).toBeOk(Cl.uint(150));

    simnet.mineEmptyBlock();

    // Register the name
    const registerName = simnet.callPublicFn(
      "BNS-V2",
      "name-register",
      // Passing 4 arguments:
      // 1. the namespace,
      // 2. the name,
      // 3. the salt used to hash160 the name with
      // 4. the zonefile
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.buffer(saltBuff),
        Cl.buffer(zonefileBuff),
      ],
      // Called by the address that preordered the name
      address1
    );
    // This should give ok true since it should be successful
    expect(registerName.result).toBeOk(Cl.bool(true));

    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(20000000),
        Cl.none(),
      ],
      // Called from owner address
      address1
    );
    // Return err ERR-OPERATION-UNAUTHORIZED
    expect(renewName.result).toBeErr(Cl.uint(116));
  });

  it("This should fail to renew a name if the owner is not the tx-sender and the name is in its current grace period", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Mine blocks to be on the grace period
    simnet.mineEmptyBlocks(7500);

    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(20000000),
        Cl.none(),
      ],
      // Called from non owner address
      address2
    );
    // Return err ERR-NOT-AUTHORIZED
    expect(renewName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to renew a name if the owner is not the tx-sender and the name is in its current lifetime", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(20000000),
        Cl.none(),
      ],
      // Called from non owner address
      address2
    );
    // Return err ERR-NOT-AUTHORIZED
    expect(renewName.result).toBeErr(Cl.uint(102));
  });

  it("This should fail to renew a name if the stx-burn is not sufficient for the price", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff), Cl.uint(2), Cl.none()],
      // Called from owner address
      address1
    );
    // Return err ERR-STX-BURNT-INSUFFICIENT
    expect(renewName.result).toBeErr(Cl.uint(110));
  });

  it("This should fail to renew a name if the name is revoked", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Revoke the name
    const revokeName = simnet.callPublicFn(
      "BNS-V2",
      "name-revoke",
      // Pass 2 arguments
      // 1. namespace
      // 2. name
      [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff)],
      // Called from the import address
      address1
    );
    expect(revokeName.result).toBeOk(Cl.bool(true));

    // Renew the name
    const renewName = simnet.callPublicFn(
      "BNS-V2",
      "name-renewal",
      // Pass 4 arguments
      // 1. namespace
      // 2. name
      // 3. stx-to-burn
      // 4. zonefile-hash
      [
        Cl.buffer(namespaceBuff),
        Cl.buffer(name1Buff),
        Cl.uint(200000000),
        Cl.none(),
      ],
      // Called from owner address
      address1
    );
    // Return err ERR-NAME-REVOKED
    expect(renewName.result).toBeErr(Cl.uint(126));
  });
});
