import crypto from "crypto";

// Error Constants
export const ERR_UNWRAP = 101;
export const ERR_NOT_AUTHORIZED = 102;
export const ERR_NOT_LISTED = 103;
export const ERR_WRONG_COMMISSION = 104;
export const ERR_LISTED = 105;
export const ERR_NO_NAME = 106;
export const ERR_HASH_MALFORMED = 107;
export const ERR_STX_BURNT_INSUFFICIENT = 108;
export const ERR_PREORDER_NOT_FOUND = 109;
export const ERR_CHARSET_INVALID = 110;
export const ERR_NAMESPACE_ALREADY_EXISTS = 111;
export const ERR_PREORDER_CLAIMABILITY_EXPIRED = 112;
export const ERR_NAMESPACE_NOT_FOUND = 113;
export const ERR_OPERATION_UNAUTHORIZED = 114;
export const ERR_NAMESPACE_ALREADY_LAUNCHED = 115;
export const ERR_NAMESPACE_PREORDER_LAUNCHABILITY_EXPIRED = 116;
export const ERR_NAMESPACE_NOT_LAUNCHED = 117;
export const ERR_NAME_NOT_AVAILABLE = 118;
export const ERR_NAMESPACE_BLANK = 119;
export const ERR_NAME_BLANK = 120;
export const ERR_NAME_REVOKED = 121;
export const ERR_NAME_PREORDERED_BEFORE_NAMESPACE_LAUNCH = 122;
export const ERR_NAMESPACE_HAS_MANAGER = 123;
export const ERR_OVERFLOW = 124;
export const ERR_NO_NAMESPACE_MANAGER = 125;
export const ERR_FAST_MINTED_BEFORE = 126;
export const ERR_PREORDERED_BEFORE = 127;
export const ERR_NAME_NOT_CLAIMABLE_YET = 128;
export const ERR_IMPORTED_BEFORE = 129;

// Commission Trait Constants
export const commTraitName = "gamma-bns-v2-commission-container";
export const commTraitAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
export const commTraitNameWrong = "wrong-bns-v2-commission-container";
export const commTraitAddressWrong =
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

// Hashing Functions
export function createHash160NameSpace(input: Uint8Array, salt: Uint8Array) {
  const saltedInput = Buffer.concat([Buffer.from(input), salt]);
  const sha256Hash = crypto.createHash("sha256").update(saltedInput).digest();
  const ripemd160Hash = crypto
    .createHash("ripemd160")
    .update(sha256Hash)
    .digest();
  return ripemd160Hash;
}

export function createHash160Name(
  input: Uint8Array,
  period: string,
  namespace: Uint8Array,
  salt: Uint8Array
) {
  const periodBuffer = Buffer.from(period);
  const saltedInput = Buffer.concat([
    Buffer.from(input),
    periodBuffer,
    namespace,
    salt,
  ]);
  const sha256Hash = crypto.createHash("sha256").update(saltedInput).digest();
  const ripemd160Hash = crypto
    .createHash("ripemd160")
    .update(sha256Hash)
    .digest();
  return ripemd160Hash;
}

// Encoder and Salt Buffers
export const encoder = new TextEncoder();
export const salt = "stratalabs";
export const salt2 = "trustmachines";
export const saltBuff = encoder.encode(salt);
export const saltBuff2 = encoder.encode(salt2);
export const namespaceBuffSalt = createHash160NameSpace(
  encoder.encode("namespacetest"),
  saltBuff
);
export const namespaceBuffSalt2 = createHash160NameSpace(
  encoder.encode("namespacetest2"),
  saltBuff2
);
export const invalidNamespaceBuffSalt = createHash160NameSpace(
  encoder.encode("namespace*"),
  saltBuff
);
export const name1Buff = encoder.encode("name1");
export const name2Buff = encoder.encode("name2");
export const invalidNameBuff = encoder.encode("name*");
export const invalidNamespaceBuff = encoder.encode("namespace*");
export const zonefileBuff = encoder.encode("zonefile");
export const zonefile2Buff = encoder.encode("zonefile2");
export const namespaceBuff = encoder.encode("namespacetest");
export const namespaceBuff2 = encoder.encode("namespacetest2");
export const name1BuffSalt = createHash160Name(
  encoder.encode("name1"),
  ".",
  namespaceBuff,
  saltBuff
);
export const name1BuffDifferentSalt = createHash160Name(
  encoder.encode("name1"),
  ".",
  namespaceBuff,
  saltBuff2
);
export const name2BuffSalt = createHash160Name(
  encoder.encode("name2"),
  ".",
  namespaceBuff,
  saltBuff
);

export const name1BuffSaltDiff = createHash160Name(
  encoder.encode("name1"),
  ".",
  namespaceBuff2,
  saltBuff
);
