import { expect } from "vitest";
import { initSimnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";

// Initialize simnet
const simnet = await initSimnet();
// Get accounts from simnet
const accounts = simnet.getAccounts();
// Assign wallet 1 to address1
const address1 = accounts.get("wallet_1")!;

export const callRevokeName = (
  nameBuffer: Uint8Array,
  namespaceBuffer: Uint8Array,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const revokeNameResult = simnet.callPublicFn(
    "zonefile-resolver",
    "revoke-name",
    [Cl.buffer(nameBuffer), Cl.buffer(namespaceBuffer)],
    callerAddress
  );

  if (isError) {
    expect(revokeNameResult.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(revokeNameResult.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callUpdateZonefileHash = (
  nameBuffer: Uint8Array,
  namespaceBuffer: Uint8Array,
  zonefileBuffer: Uint8Array,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const updateZonefileHashResult = simnet.callPublicFn(
    "zonefile-resolver",
    "update-zonefile",
    [
      Cl.buffer(nameBuffer),
      Cl.buffer(namespaceBuffer),
      Cl.some(Cl.buffer(zonefileBuffer)),
    ],
    callerAddress
  );

  if (isError) {
    expect(updateZonefileHashResult.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(updateZonefileHashResult.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callResolveZonefile = (
  name: Uint8Array,
  namespace: Uint8Array,
  expectedResult: Uint8Array | null | number,
  isError: boolean
) => {
  const result = simnet.callReadOnlyFn(
    "zonefile-resolver",
    "resolve-name",
    [Cl.buffer(name), Cl.buffer(namespace)],
    address1
  );
  if (isError) {
    expect(result.result).toBeErr(Cl.uint(expectedResult as number));
  } else {
    if (expectedResult != null) {
      expect(result.result).toBeOk(
        Cl.some(Cl.buffer(expectedResult as Uint8Array))
      );
    } else {
      expect(result.result).toBeOk(Cl.none());
    }
  }
};
