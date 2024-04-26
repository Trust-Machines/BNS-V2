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
  expect(preorderName.result).toBeOk(Cl.uint(149));

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
  expect(preorderName.result).toBeOk(Cl.uint(149));

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
  expect(preorderName.result).toBeOk(Cl.uint(151));

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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("TRANSFER FUNCTION", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should successfully transfer a fast claimed name in an unmanaged namespace", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Mine an empty block to avoid 122 error
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should successfully transfer a fast claimed name in a managed namespace", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Mine an empty block to avoid 122 error
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    // This should give err 122 which is ERR-NAME-OPERATION-UNAUTHORIZED
    expect(transferName.result).toBeErr(Cl.uint(122));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    // This should give err 122 which is ERR-NAME-OPERATION-UNAUTHORIZED
    expect(transferName.result).toBeErr(Cl.uint(122));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to transfer a name in a managed namespace when the contract-caller is not the namespace manager", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Mine an empty block to avoid 122 error
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
        Cl.bool(false),
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

    // Mine an empty block to avoid 122 error
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to transfer a name in an unmanaged namespace when the tx-sender is not the owner", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Mine an empty block to avoid 122 error
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to transfer a name in an unmanaged namespace when the name is listed in a market", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Mine an empty block to avoid 122 error
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to transfer a name in a managed namespace when the name is listed in a market", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Mine an empty block to avoid 122 error
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("LIST-IN-USTX-FUNCTION", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should successfully list a fast claimed name in an unmanaged namespace", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Mine an empty block to avoid 122 error
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should successfully list a fast claimed name in a managed namespace", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Mine an empty block to avoid 122 error
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    // Err 107 ERR-No-NAME
    expect(listName.result).toBeErr(Cl.uint(107));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    // Err 122 ERR-NAME-OPERATION-UNAUTHORIZED
    expect(listName.result).toBeErr(Cl.uint(122));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    // Err 122 ERR-NAME-OPERATION-UNAUTHORIZED
    expect(listName.result).toBeErr(Cl.uint(122));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to list a name in an unmanaged namespace when the tx-sender is not the owner", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Mine an empty block to avoid 122 error
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to list a name in an unmanaged namespace when the contract-caller is not the manager", () => {
    // Fast Claim a name
    successfullyFastClaimANameInAManagedNamespace();

    // Mine an empty block to avoid 122 error
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("UNLIST-IN-USTX-FUNCTION", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    // Err 103 ERR-NOT-LISTED
    expect(unlistName.result).toBeErr(Cl.uint(103));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("BUY-IN-USTX-FUNCTION", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    expect(buyName.result).toBeErr(Cl.uint(107));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    expect(buyName.result).toBeErr(Cl.uint(103));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    expect(buyName.result).toBeErr(Cl.uint(103));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    expect(buyName.result).toBeErr(Cl.uint(104));
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("SET-PRIMARY-NAME FUNCTION", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    expect(changePrimaryName.result).toBeOk(Cl.bool(true));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    expect(changePrimaryName.result).toBeErr(Cl.uint(107));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    expect(changePrimaryName.result).toBeErr(Cl.uint(153));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    expect(changePrimaryName.result).toBeErr(Cl.uint(102));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    expect(changePrimaryName.result).toBeErr(Cl.uint(106));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-PREORDER FUNCTION", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Test case to fail if the stx to burn is 0
  it("should fail if the stx to burn is 0", () => {
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Call namespace-preorder function with hashed salt and namespace, and 0 STX to burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(0)],
      // Use Address 1
      address1
    );
    // This should give err u111
    expect(preorderNamespace.result).toBeErr(Cl.uint(111));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-REVEAL FUNCTION", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should successfully reveal a Namespace without a manager", () => {
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail if no namespace preorder", () => {
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
    expect(revealNamespace.result).toBeErr(Cl.uint(113));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail if the namespace contains invalid characters", () => {
    // Call the namespace-preorder function from the BNS-V2 contract
    const preorderNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(invalidNamespaceBuffSalt), Cl.uint(1000000000)],
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
        Cl.buffer(invalidNamespaceBuff),
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
    expect(revealNamespace.result).toBeErr(Cl.uint(114));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail if the namespace already exists", () => {
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
    const preorderNamespace2 = simnet.callPublicFn(
      "BNS-V2",
      "namespace-preorder",
      // Pass the hashed salt + namespace in Uint8Array Format
      // Pass the amount of STX to Burn
      [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
      address2
    );
    // This should give ok u146 since the blockheight is 2 + 144 TTL
    expect(preorderNamespace2.result).toBeOk(Cl.uint(148));

    // Call the namespace-reveal function from the BNS-V2 contract
    const revealNamespace2 = simnet.callPublicFn(
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
        Cl.principal(address2),
        // Manager address
        Cl.some(Cl.principal(managerAddress)),
        // Cl.none(),
      ],
      address2
    );
    expect(revealNamespace2.result).toBeErr(Cl.uint(115));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail if burned stx is not enough for the price", () => {
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
    expect(revealNamespace.result).toBeErr(Cl.uint(111));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail if TTL has passed to reveal a namespace", () => {
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
    simnet.mineEmptyBlocks(148);

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
    expect(revealNamespace.result).toBeErr(Cl.uint(116));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-READY-FUNCTION", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAME-PREORDER FUNCTION", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should successfully preorder a name on a launched namespace with a manager even though this is not the intended use", () => {
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to preorder a name if a preorder for the same name and namespace exists", () => {
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
    // Call the name-preorder function from the BNS-V2 contract
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      address1
    );
    expect(preorderName2.result).toBeErr(Cl.uint(141));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to preorder a name if a preorder for the same name and namespace exists even if it was made from the name-preorder function", () => {
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
      "mng-name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt)],
      address1
    );
    expect(preorderName.result).toBeOk(Cl.uint(149));
    // Call the name-preorder function from the BNS-V2 contract
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt), Cl.uint(100000)],
      address1
    );
    expect(preorderName2.result).toBeErr(Cl.uint(141));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to preorder a name if hash is malformed", () => {
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
      [Cl.buffer(name1Buff), Cl.uint(200000000)],
      address1
    );
    expect(preorderName.result).toBeErr(Cl.uint(142));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to preorder a name if stx to burn 0", () => {
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
      [Cl.buffer(name1BuffSalt), Cl.uint(0)],
      address1
    );
    expect(preorderName.result).toBeErr(Cl.uint(133));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to preorder a name if stx to burn not enough in balance of user", () => {
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
      [Cl.buffer(name1BuffSalt), Cl.uint(9007199254740991)],
      address1
    );
    expect(preorderName.result).toBeErr(Cl.uint(112));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("MNG-NAME-PREORDER FUNCTION", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should successfully preorder a name on a launched namespace without a manager even though it is not its intended use", () => {
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
        // Cl.some(Cl.principal(address1)),
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

    // Call the name-preorder function from the BNS-V2 contract
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Pass the name in Uint8Array Format

      [Cl.buffer(name1BuffSalt)],
      managerAddress
    );
    expect(preorderName.result).toBeOk(Cl.uint(149));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should successfully preorder a name on a launched namespace with a manager", () => {
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
        // Cl.none(),
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
      "mng-name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt)],
      managerAddress
    );
    expect(preorderName.result).toBeOk(Cl.uint(149));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to preorder a name if a preorder for the same name and namespace exists", () => {
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
      "mng-name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt)],
      managerAddress
    );
    expect(preorderName.result).toBeOk(Cl.uint(149));
    // Call the name-preorder function from the BNS-V2 contract
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt)],
      managerAddress
    );
    expect(preorderName2.result).toBeErr(Cl.uint(141));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to preorder a name if a preorder for the same name and namespace exists even if it was made from the name-preorder function", () => {
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
      [Cl.buffer(name1BuffSalt), Cl.uint(100000)],
      managerAddress
    );
    expect(preorderName.result).toBeOk(Cl.uint(149));
    // Call the name-preorder function from the BNS-V2 contract
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "mng-name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt)],
      managerAddress
    );
    expect(preorderName2.result).toBeErr(Cl.uint(141));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to preorder a name if hash is malformed", () => {
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
      "mng-name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1Buff)],
      managerAddress
    );
    expect(preorderName.result).toBeErr(Cl.uint(142));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("name-register function", () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should succesfully register a name", () => {
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
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should succesfully register 2 different names", () => {
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
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to register a name if no name-preorder", () => {
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
    expect(registerName.result).toBeErr(Cl.uint(129));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to register a name if the name was preordered with mng-name-preorder", () => {
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
      "mng-name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt)],
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
    expect(registerName.result).toBeErr(Cl.uint(133));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to register a name if no namespace is launched or found", () => {
    // Call the name-preorder function from the BNS-V2 contract
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      address1
    );
    expect(preorderName.result).toBeOk(Cl.uint(146));

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
    expect(registerName.result).toBeErr(Cl.uint(117));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to register a name if the namespace has a manager", () => {
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
      ],
      address1
    );
    expect(registerName.result).toBeErr(Cl.uint(102));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to register a name if name already exists", () => {
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
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    simnet.mineEmptyBlocks(200);
    // Call the name-preorder function from the BNS-V2 contract
    const preorderName2 = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      address1
    );
    expect(preorderName2.result).toBeOk(Cl.uint(351));

    // Call the name-register function from the BNS-V2 contract
    const registerName2 = simnet.callPublicFn(
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
    expect(registerName2.result).toBeErr(Cl.uint(132));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to register a name if name was preordered before namespace launch", () => {
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

    // Call the name-preorder function from the BNS-V2 contract
    const preorderName = simnet.callPublicFn(
      "BNS-V2",
      "name-preorder",
      // Pass the name in Uint8Array Format
      // Pass the STX amount to burn
      [Cl.buffer(name1BuffSalt), Cl.uint(200000000)],
      address1
    );
    expect(preorderName.result).toBeOk(Cl.uint(148));

    // Call the namespace-ready function from the BNS-V2 contract
    const launchNamespace = simnet.callPublicFn(
      "BNS-V2",
      "namespace-ready",
      // Pass the namespace in Uint8Array Format
      [Cl.buffer(namespaceBuff)],
      address1
    );
    expect(launchNamespace.result).toBeOk(Cl.bool(true));

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
    expect(registerName.result).toBeErr(Cl.uint(143));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to register a name if name already claimed", () => {
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
      ],
      address1
    );
    expect(registerName.result).toBeOk(Cl.bool(true));
    // Call the name-register function from the BNS-V2 contract
    const registerName2 = simnet.callPublicFn(
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
    expect(registerName2.result).toBeErr(Cl.uint(132));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to register a name if TTL has passed", () => {
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

    simnet.mineEmptyBlocks(150);

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
    expect(registerName.result).toBeErr(Cl.uint(138));
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it("This should fail to register a name if burned STX waas not enough", () => {
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
      [Cl.buffer(name1BuffSalt), Cl.uint(1)],
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
    expect(registerName.result).toBeErr(Cl.uint(133));
  });
});

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("mng-name-register function", () => {
//   /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   it("This should succesfully register a name", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name1BuffSalt)],
//       managerAddress
//     );
//     expect(preorderName.result).toBeOk(Cl.uint(149));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//   });
//   /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   it("This should succesfully register 2 different names", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name1BuffSalt)],
//       managerAddress
//     );
//     expect(preorderName.result).toBeOk(Cl.uint(149));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName2 = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name2BuffSalt)],
//       managerAddress
//     );
//     expect(preorderName2.result).toBeOk(Cl.uint(151));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName2 = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name2Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName2.result).toBeOk(Cl.bool(true));
//   });
//   /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   it("This should fail to register a name if no name-preorder", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeErr(Cl.uint(129));
//   });
//   /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   it("This should fail to register a name if the name was preordered with name-preorder", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name1BuffSalt), Cl.uint(20000)],
//       managerAddress
//     );
//     expect(preorderName.result).toBeOk(Cl.uint(149));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeErr(Cl.uint(133));
//   });
//   /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   it("This should fail to register a name if no namespace is launched or found", () => {
//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name1BuffSalt)],
//       managerAddress
//     );
//     expect(preorderName.result).toBeOk(Cl.uint(146));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeErr(Cl.uint(117));
//   });
//   /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   it("This should fail to register a name if the namespace has no manager", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.none(),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name1BuffSalt)],
//       managerAddress
//     );
//     expect(preorderName.result).toBeOk(Cl.uint(149));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeErr(Cl.uint(154));
//   });
//   /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   it("This should fail to register a name if name already exists", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name1BuffSalt)],
//       managerAddress
//     );
//     expect(preorderName.result).toBeOk(Cl.uint(149));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     simnet.mineEmptyBlocks(200);
//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName2 = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name1BuffSalt)],
//       managerAddress
//     );
//     expect(preorderName2.result).toBeOk(Cl.uint(351));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName2 = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName2.result).toBeErr(Cl.uint(132));
//   });
//   /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   it("This should fail to register a name if name was preordered before namespace launch", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name1BuffSalt)],
//       managerAddress
//     );
//     expect(preorderName.result).toBeOk(Cl.uint(148));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeErr(Cl.uint(143));
//   });
//   /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   it("This should fail to register a name if name already claimed", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name1BuffSalt)],
//       managerAddress
//     );
//     expect(preorderName.result).toBeOk(Cl.uint(149));

//     // Call the name-register function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     // Call the name-register function from the BNS-V2 contract
//     const registerName2 = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName2.result).toBeErr(Cl.uint(132));
//   });
//   /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   it("This should fail to register a name if TTL has passed", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-preorder function from the BNS-V2 contract
//     const preorderName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-preorder",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [Cl.buffer(name1BuffSalt)],
//       managerAddress
//     );
//     expect(preorderName.result).toBeOk(Cl.uint(149));

//     simnet.mineEmptyBlocks(150);

//     // Call the name-register function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-name-register",
//       // Pass the name in Uint8Array Format
//       // Pass the STX amount to burn
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(saltBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(1),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeErr(Cl.uint(138));
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("Register a name on the launched namespace with the fast mint", () => {
//   it("This should successfully fast mint a name on a launched namespace without a manager", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.none(),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       address1
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//   });
//   it("This should successfully fast mint a name on a launched namespace with a manager", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(20000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//   });
//   it("This should fail to fast mint name on a launched namespace with a manager", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       address1
//     );
//     expect(registerName.result).toBeErr(Cl.uint(102));
//   });
//   it("This should fail to fast mint a name on a launched namespace without a manager", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.none(),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(managerAddress),
//       ],
//       address1
//     );
//     expect(registerName.result).toBeErr(Cl.uint(102));
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("mng-burn", () => {
//   it("This should successfully burn a name by the manager from a managed namespace", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     // Call the mng-burn function from the BNS-V2 contract
//     const burnName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-burn",
//       // Pass the uint id of the nft
//       [Cl.uint(1)],
//       managerAddress
//     );
//     expect(burnName.result).toBeOk(Cl.bool(true));
//   });
//   it("This should fail by burning a nonexistent name", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     // Call the mng-burn function from the BNS-V2 contract
//     const burnName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-burn",
//       // Pass the uint id of the nft
//       [Cl.uint(2)],
//       managerAddress
//     );
//     expect(burnName.result).toBeErr(Cl.uint(124));
//   });
//   it("This should fail in a namespace with no manager", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.none(),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       address1
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     // Call the mng-burn function from the BNS-V2 contract
//     const burnName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-burn",
//       // Pass the uint id of the nft
//       [Cl.uint(1)],
//       managerAddress
//     );
//     expect(burnName.result).toBeErr(Cl.uint(154));
//   });
//   it("This should fail by not allowing a different address from the manager address to burn an nft from a managed namespace", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     // Call the mng-burn function from the BNS-V2 contract
//     const burnName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-burn",
//       // Pass the uint id of the nft
//       [Cl.uint(1)],
//       address1
//     );
//     expect(burnName.result).toBeErr(Cl.uint(102));
//   });
//   it("This should still burn the name if it is listed when called by the manager address", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));

//     simnet.mineEmptyBlock();
//     simnet.mineEmptyBlock();

//     // Call the list-in-ustx function from the BNS-V2 contract
//     const listName = simnet.callPublicFn(
//       "BNS-V2",
//       "list-in-ustx",
//       [
//         Cl.uint(1),
//         Cl.uint(200000),
//         Cl.contractPrincipal(commTraitAddress, commTraitName),
//       ],
//       managerAddress
//     );
//     expect(listName.result).toBeOk(
//       Cl.tuple({
//         a: Cl.stringAscii("list-in-ustx"),
//         commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
//         id: Cl.uint(1),
//         price: Cl.uint(200000),
//       })
//     );

//     // Call the mng-burn function from the BNS-V2 contract
//     const burnName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-burn",
//       // Pass the uint id of the nft
//       [Cl.uint(1)],
//       managerAddress
//     );
//     expect(burnName.result).toBeOk(Cl.bool(true));
//   });
//   it("After Successful burn, check that all maps are updated correctly", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       managerAddress
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(managerAddress),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       managerAddress
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     simnet.mineEmptyBlock();
//     simnet.mineEmptyBlock();
//     // Call the list-in-ustx function from the BNS-V2 contract
//     const listName = simnet.callPublicFn(
//       "BNS-V2",
//       "list-in-ustx",
//       [
//         Cl.uint(1),
//         Cl.uint(200000),
//         Cl.contractPrincipal(commTraitAddress, commTraitName),
//       ],
//       managerAddress
//     );
//     expect(listName.result).toBeOk(
//       Cl.tuple({
//         a: Cl.stringAscii("list-in-ustx"),
//         commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
//         id: Cl.uint(1),
//         price: Cl.uint(200000),
//       })
//     );
//     // Call the mng-burn function from the BNS-V2 contract
//     const burnName = simnet.callPublicFn(
//       "BNS-V2",
//       "mng-burn",
//       // Pass the uint id of the nft
//       [Cl.uint(1)],
//       managerAddress
//     );
//     expect(burnName.result).toBeOk(Cl.bool(true));
//     // Call the get-owner function from the BNS-V2 contract
//     const getOwner = simnet.callReadOnlyFn(
//       "BNS-V2",
//       "get-owner",
//       // Pass the uint id of the nft
//       [Cl.uint(1)],
//       managerAddress
//     );
//     expect(getOwner.result).toBeOk(Cl.none());
//     // Call the get-bns-from-id function from the BNS-V2 contract
//     const idToBns = simnet.callReadOnlyFn(
//       "BNS-V2",
//       "get-bns-from-id",
//       // Pass the uint id of the nft
//       [Cl.uint(1)],
//       managerAddress
//     );
//     expect(idToBns.result).toBeNone();
//     // Call the get-id-from-bns function from the BNS-V2 contract
//     const bnsToId = simnet.callReadOnlyFn(
//       "BNS-V2",
//       "get-id-from-bns",
//       // Pass the uint id of the nft
//       [Cl.buffer(name1Buff), Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(bnsToId.result).toBeNone();
//     // Call the get-owner function from the BNS-V2 contract
//     const getAllNames = simnet.callReadOnlyFn(
//       "BNS-V2",
//       "get-all-names-owned-by-principal",
//       // Pass the uint id of the nft
//       [Cl.principal(address1)],
//       managerAddress
//     );
//     expect(getAllNames.result).toBeSome(Cl.list([]));
//     const getPrimary = simnet.callReadOnlyFn(
//       "BNS-V2",
//       "get-primary-name",
//       // Pass the uint id of the nft
//       [Cl.principal(address1)],
//       managerAddress
//     );
//     expect(getPrimary.result).toBeNone();
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("update-zonefile-hash", () => {
//   it("This should successfully update the zonefile hash of a name in an unmanaged namespace", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.none(),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       address1
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     simnet.mineEmptyBlock();
//     simnet.mineEmptyBlock();
//     // Call the transfer function from the BNS-V2 contract
//     const updateZoneName = simnet.callPublicFn(
//       "BNS-V2",
//       "update-zonefile-hash",
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(zonefile2Buff),
//       ],
//       address1
//     );
//     expect(updateZoneName.result).toBeOk(Cl.bool(true));
//   });
//   it("This should successfully update the zonefile hash of a name in a managed namespace", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     simnet.mineEmptyBlock();
//     simnet.mineEmptyBlock();
//     // Call the transfer function from the BNS-V2 contract
//     const updateZoneName = simnet.callPublicFn(
//       "BNS-V2",
//       "update-zonefile-hash",
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(zonefile2Buff),
//       ],
//       managerAddress
//     );
//     expect(updateZoneName.result).toBeOk(Cl.bool(true));
//   });
//   it("This should fail to update the zonefile hash of a nonexistent name", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     simnet.mineEmptyBlock();
//     simnet.mineEmptyBlock();
//     // Call the transfer function from the BNS-V2 contract
//     const updateZoneName = simnet.callPublicFn(
//       "BNS-V2",
//       "update-zonefile-hash",
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name2Buff),
//         Cl.buffer(zonefile2Buff),
//       ],
//       address1
//     );
//     expect(updateZoneName.result).toBeErr(Cl.uint(107));
//   });
//   it("This should fail to update the zonefile hash if the zonefile is the same", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     simnet.mineEmptyBlock();
//     simnet.mineEmptyBlock();
//     // Call the transfer function from the BNS-V2 contract
//     const updateZoneName = simnet.callPublicFn(
//       "BNS-V2",
//       "update-zonefile-hash",
//       [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff), Cl.buffer(zonefileBuff)],
//       address1
//     );
//     expect(updateZoneName.result).toBeErr(Cl.uint(122));
//   });
//   it("This should fail to update the zonefile hash if the name is revoked", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     simnet.mineEmptyBlock();
//     simnet.mineEmptyBlock();
//     // Call the transfer function from the BNS-V2 contract
//     const revokeName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-revoke",
//       [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff)],
//       address1
//     );
//     expect(revokeName.result).toBeOk(Cl.bool(true));
//     // Call the transfer function from the BNS-V2 contract
//     const updateZoneName = simnet.callPublicFn(
//       "BNS-V2",
//       "update-zonefile-hash",
//       [Cl.buffer(namespaceBuff), Cl.buffer(name1Buff), Cl.buffer(zonefileBuff)],
//       address1
//     );
//     expect(updateZoneName.result).toBeErr(Cl.uint(122));
//   });
//   it("This should fail to update the zonefile hash of a name in an unmanaged namespace when the tx-sender is not the owner", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.none(),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       address1
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     simnet.mineEmptyBlock();
//     simnet.mineEmptyBlock();
//     // Call the transfer function from the BNS-V2 contract
//     const updateZoneName = simnet.callPublicFn(
//       "BNS-V2",
//       "update-zonefile-hash",
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(zonefile2Buff),
//       ],
//       managerAddress
//     );
//     expect(updateZoneName.result).toBeErr(Cl.uint(102));
//   });
//   it("This should fail to update the zonefile hash of a name in a managed namespace when the contract-caller is not the manager", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     simnet.mineEmptyBlock();
//     simnet.mineEmptyBlock();
//     // Call the transfer function from the BNS-V2 contract
//     const updateZoneName = simnet.callPublicFn(
//       "BNS-V2",
//       "update-zonefile-hash",
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(zonefile2Buff),
//       ],
//       address1
//     );
//     expect(updateZoneName.result).toBeErr(Cl.uint(102));
//   });
//   it("This should fail to update the zonefile hash of a name if the name is not in a valid grace period", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));
//     simnet.mineEmptyBlocks(11000);
//     simnet.mineEmptyBlock();
//     // Call the transfer function from the BNS-V2 contract
//     const updateZoneName = simnet.callPublicFn(
//       "BNS-V2",
//       "update-zonefile-hash",
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(zonefile2Buff),
//       ],
//       managerAddress
//     );
//     expect(updateZoneName.result).toBeErr(Cl.uint(122));
//   });
//   it("This should fail to update the zonefile hash of a name if the name is locked", () => {
//     // Call the namespace-preorder function from the BNS-V2 contract
//     const preorderNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-preorder",
//       // Pass the hashed salt + namespace in Uint8Array Format
//       // Pass the amount of STX to Burn
//       [Cl.buffer(namespaceBuffSalt), Cl.uint(1000000000)],
//       address1
//     );
//     // This should give ok u146 since the blockheight is 2 + 144 TTL
//     expect(preorderNamespace.result).toBeOk(Cl.uint(146));

//     // Call the namespace-reveal function from the BNS-V2 contract
//     const revealNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-reveal",
//       // Pass the namespace in Uint8Array Format
//       // Pass the salt in Uint8Array Format
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(saltBuff),
//         Cl.bool(true),
//         // Pass the pricing function
//         // Base
//         Cl.uint(1),
//         // Coeff
//         Cl.uint(1),
//         // p-funcs
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         Cl.uint(1),
//         // Pass the non alpha discount
//         Cl.uint(1),
//         // Pass the non vowel discount
//         Cl.uint(1),
//         // Lifetime
//         Cl.uint(5000),
//         // Import address
//         Cl.principal(address1),
//         // Manager address
//         Cl.some(Cl.principal(managerAddress)),
//       ],
//       address1
//     );
//     expect(revealNamespace.result).toBeOk(Cl.bool(true));

//     // Call the namespace-ready function from the BNS-V2 contract
//     const launchNamespace = simnet.callPublicFn(
//       "BNS-V2",
//       "namespace-ready",
//       // Pass the namespace in Uint8Array Format
//       [Cl.buffer(namespaceBuff)],
//       address1
//     );
//     expect(launchNamespace.result).toBeOk(Cl.bool(true));

//     // Call the name-claim-fast function from the BNS-V2 contract
//     const registerName = simnet.callPublicFn(
//       "BNS-V2",
//       "name-claim-fast",
//       // Pass the name in Uint8Array Format
//       // Pass the namespace in Uint8Array Format
//       // Pass the zonefile in Uint8Array Format
//       // Pass the STX amount to burn
//       // Pass the address to send to
//       [
//         Cl.buffer(name1Buff),
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(zonefileBuff),
//         Cl.uint(200000000),
//         Cl.principal(address1),
//       ],
//       managerAddress
//     );
//     expect(registerName.result).toBeOk(Cl.bool(true));

//     const lockName = simnet.callPublicFn(
//       "BNS-V2",
//       "lock-name",
//       [Cl.buffer(name1Buff), Cl.buffer(namespaceBuff)],
//       managerAddress
//     );
//     expect(lockName.result).toBeOk(Cl.bool(true));

//     // Call the transfer function from the BNS-V2 contract
//     const updateZoneName = simnet.callPublicFn(
//       "BNS-V2",
//       "update-zonefile-hash",
//       [
//         Cl.buffer(namespaceBuff),
//         Cl.buffer(name1Buff),
//         Cl.buffer(zonefile2Buff),
//       ],
//       managerAddress
//     );
//     expect(updateZoneName.result).toBeErr(Cl.uint(108));
//   });
// });
