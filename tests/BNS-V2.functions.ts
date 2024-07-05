import { expect } from "vitest";
import { initSimnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";
import {
  saltBuff,
  saltBuff2,
  namespaceBuffSalt,
  namespaceBuffSalt2,
  invalidNamespaceBuffSalt,
  name1Buff,
  name2Buff,
  invalidNameBuff,
  invalidNamespaceBuff,
  zonefileBuff,
  zonefile2Buff,
  namespaceBuff,
  name1BuffSalt,
  name1BuffDifferentSalt,
  name2BuffSalt,
} from "./BNS-V2.helper";

// Initialize simnet
const simnet = await initSimnet();
// Get accounts from simnet
const accounts = simnet.getAccounts();
// Assign wallet 1 to address1
const address1 = accounts.get("wallet_1")!;
// Assign wallet 2 to managerAddress
const managerAddress = accounts.get("wallet_2")!;
// Assign wallet 3 to address2
const address3 = accounts.get("wallet_3")!;

export const callPreorderAValidNamespace = (
  bufferParam: Uint8Array,
  uintParam: number,
  callerAddress: string,
  expectedReturnValue: number,
  isError: boolean
) => {
  const preorderNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-preorder",
    [Cl.buffer(bufferParam), Cl.uint(uintParam)],
    callerAddress
  );

  if (isError) {
    expect(preorderNamespace.result).toBeErr(Cl.uint(expectedReturnValue));
  } else {
    expect(preorderNamespace.result).toBeOk(Cl.uint(expectedReturnValue));
  }
};

export const callRevealNamespace = (
  namespaceBuffer: Uint8Array,
  saltBuffer: Uint8Array,
  priceBase: number,
  priceCoeff: number,
  priceBuckets: number[],
  nonAlphaDiscount: number,
  noVowelDiscount: number,
  lifetime: number,
  importAddress: string,
  managerAddress: string | null,
  canUpdatePrice: boolean,
  managerTransfers: boolean,
  managerFrozen: boolean,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const revealNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-reveal",
    [
      Cl.buffer(namespaceBuffer),
      Cl.buffer(saltBuffer),
      Cl.uint(priceBase),
      Cl.uint(priceCoeff),
      ...priceBuckets.map((bucket) => Cl.uint(bucket)),
      Cl.uint(nonAlphaDiscount),
      Cl.uint(noVowelDiscount),
      Cl.uint(lifetime),
      Cl.principal(importAddress),
      managerAddress ? Cl.some(Cl.principal(managerAddress)) : Cl.none(),
      Cl.bool(canUpdatePrice),
      Cl.bool(managerTransfers),
      Cl.bool(managerFrozen),
    ],
    callerAddress
  );

  if (isError) {
    expect(revealNamespace.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(revealNamespace.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callLaunchNamespace = (
  namespaceBuffer: Uint8Array,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const launchNamespaceResult = simnet.callPublicFn(
    "BNS-V2",
    "namespace-launch",
    [Cl.buffer(namespaceBuffer)],
    callerAddress
  );

  if (isError) {
    expect(launchNamespaceResult.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(launchNamespaceResult.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callPreorderName = (
  nameBufferSalt: Uint8Array,
  amountStx: number,
  callerAddress: string,
  expectedReturnValue: number,
  isError: boolean
) => {
  const preorderNameResult = simnet.callPublicFn(
    "BNS-V2",
    "name-preorder",
    [Cl.buffer(nameBufferSalt), Cl.uint(amountStx)],
    callerAddress
  );

  if (isError) {
    expect(preorderNameResult.result).toBeErr(Cl.uint(expectedReturnValue));
  } else {
    expect(preorderNameResult.result).toBeOk(Cl.uint(expectedReturnValue));
  }
};

export const callRegisterName = (
  namespaceBuffer: Uint8Array,
  nameBuffer: Uint8Array,
  saltBuffer: Uint8Array,
  zonefileBuffer: Uint8Array,
  callerAddress: string,
  expectedReturnValue: number,
  isError: boolean
) => {
  const registerNameResult = simnet.callPublicFn(
    "BNS-V2",
    "name-register",
    [
      Cl.buffer(namespaceBuffer),
      Cl.buffer(nameBuffer),
      Cl.buffer(saltBuffer),
      Cl.buffer(zonefileBuffer),
    ],
    callerAddress
  );

  if (isError) {
    expect(registerNameResult.result).toBeErr(Cl.uint(expectedReturnValue));
  } else {
    expect(registerNameResult.result).toBeOk(Cl.uint(expectedReturnValue));
  }
};

export const callManagedPreorderName = (
  nameBufferSalt: Uint8Array,
  callerAddress: string,
  expectedReturnValue: number,
  isError: boolean
) => {
  const preorderNameResult = simnet.callPublicFn(
    "BNS-V2",
    "mng-name-preorder",
    [Cl.buffer(nameBufferSalt)],
    callerAddress
  );

  if (isError) {
    expect(preorderNameResult.result).toBeErr(Cl.uint(expectedReturnValue));
  } else {
    expect(preorderNameResult.result).toBeOk(Cl.uint(expectedReturnValue));
  }
};

export const callManagedRegisterNameWithAddress = (
  namespaceBuffer: Uint8Array,
  nameBuffer: Uint8Array,
  saltBuffer: Uint8Array,
  zonefileBuffer: Uint8Array,
  addressToSend: string,
  callerAddress: string,
  expectedReturnValue: number,
  isError: boolean
) => {
  const registerNameResult = simnet.callPublicFn(
    "BNS-V2",
    "mng-name-register",
    [
      Cl.buffer(namespaceBuffer),
      Cl.buffer(nameBuffer),
      Cl.buffer(saltBuffer),
      Cl.buffer(zonefileBuffer),
      Cl.principal(addressToSend),
    ],
    callerAddress
  );

  if (isError) {
    expect(registerNameResult.result).toBeErr(Cl.uint(expectedReturnValue));
  } else {
    expect(registerNameResult.result).toBeOk(Cl.uint(expectedReturnValue));
  }
};

export const callFastClaimName = (
  nameBuffer: Uint8Array,
  namespaceBuffer: Uint8Array,
  zonefileBuffer: Uint8Array,
  recipientAddress: string,
  callerAddress: string,
  expectedReturnValue: number,
  isError: boolean
) => {
  const fastClaimNameResult = simnet.callPublicFn(
    "BNS-V2",
    "name-claim-fast",
    [
      Cl.buffer(nameBuffer),
      Cl.buffer(namespaceBuffer),
      Cl.buffer(zonefileBuffer),
      Cl.principal(recipientAddress),
    ],
    callerAddress
  );

  if (isError) {
    expect(fastClaimNameResult.result).toBeErr(Cl.uint(expectedReturnValue));
  } else {
    expect(fastClaimNameResult.result).toBeOk(Cl.uint(expectedReturnValue));
  }
};

export const callTransferName = (
  nameId: number,
  ownerAddress: string,
  recipientAddress: string,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const transferNameResult = simnet.callPublicFn(
    "BNS-V2",
    "transfer",
    [
      Cl.uint(nameId),
      Cl.principal(ownerAddress),
      Cl.principal(recipientAddress),
    ],
    callerAddress
  );

  if (isError) {
    // Handle error case
    expect(transferNameResult.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    // Handle success case
    expect(transferNameResult.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callTurnOffManagerTransfers = (
  namespaceBuffer: Uint8Array,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const turnOffManagerTransfersResult = simnet.callPublicFn(
    "BNS-V2",
    "turn-off-manager-transfers",
    [Cl.buffer(namespaceBuffer)],
    callerAddress
  );

  if (isError) {
    expect(turnOffManagerTransfersResult.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(turnOffManagerTransfersResult.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callRenewName = (
  namespaceBuffer: Uint8Array,
  nameBuffer: Uint8Array,
  zonefileHash: Uint8Array | null,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const renewNameResult = simnet.callPublicFn(
    "BNS-V2",
    "name-renewal",
    [
      Cl.buffer(namespaceBuffer),
      Cl.buffer(nameBuffer),
      zonefileHash !== null ? Cl.buffer(zonefileHash) : Cl.none(),
    ],
    callerAddress
  );

  if (isError) {
    expect(renewNameResult.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(renewNameResult.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callRevokeName = (
  namespaceBuffer: Uint8Array,
  nameBuffer: Uint8Array,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const revokeNameResult = simnet.callPublicFn(
    "BNS-V2",
    "name-revoke",
    [Cl.buffer(namespaceBuffer), Cl.buffer(nameBuffer)],
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

export const callImportName = (
  namespaceBuffer: Uint8Array,
  nameBuffer: Uint8Array,
  zonefileBuffer: Uint8Array,
  recipientAddress: string,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const importNameResult = simnet.callPublicFn(
    "BNS-V2",
    "name-import",
    [
      Cl.buffer(namespaceBuffer),
      Cl.buffer(nameBuffer),
      Cl.principal(recipientAddress),
      Cl.buffer(zonefileBuffer),
    ],
    callerAddress
  );

  if (isError) {
    expect(importNameResult.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(importNameResult.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callUpdateZonefileHash = (
  namespaceBuffer: Uint8Array,
  nameBuffer: Uint8Array,
  zonefileBuffer: Uint8Array,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const updateZonefileHashResult = simnet.callPublicFn(
    "BNS-V2",
    "update-zonefile-hash",
    [
      Cl.buffer(namespaceBuffer),
      Cl.buffer(nameBuffer),
      Cl.buffer(zonefileBuffer),
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

export const callClaimPreorder = (
  nameBufferSalt: Uint8Array,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const reclaimPreorderResult = simnet.callPublicFn(
    "BNS-V2",
    "claim-preorder",
    [Cl.buffer(nameBufferSalt)],
    callerAddress
  );

  if (isError) {
    expect(reclaimPreorderResult.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(reclaimPreorderResult.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callNamespaceFreezePrice = (
  namespaceBuff: Uint8Array,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const updatePriceFunctionNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-freeze-price",
    [Cl.buffer(namespaceBuff)],
    callerAddress
  );

  if (isError) {
    expect(updatePriceFunctionNamespace.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(updatePriceFunctionNamespace.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callNamespaceUpdatePrice = (
  namespaceBuff: Uint8Array,
  priceBase: number,
  priceCoeff: number,
  priceBuckets: number[],
  nonAlphaDiscount: number,
  noVowelDiscount: number,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const updatePriceNamespace = simnet.callPublicFn(
    "BNS-V2",
    "namespace-update-price",
    [
      Cl.buffer(namespaceBuff),
      Cl.uint(priceBase),
      Cl.uint(priceCoeff),
      ...priceBuckets.map((bucket) => Cl.uint(bucket)),
      Cl.uint(nonAlphaDiscount),
      Cl.uint(noVowelDiscount),
    ],
    callerAddress
  );

  if (isError) {
    expect(updatePriceNamespace.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(updatePriceNamespace.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callFreezeManager = (
  namespaceBuff: Uint8Array,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const freezeManager = simnet.callPublicFn(
    "BNS-V2",
    "freeze-manager",
    [Cl.buffer(namespaceBuff)],
    callerAddress
  );

  if (isError) {
    expect(freezeManager.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(freezeManager.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callManagerTransfer = (
  newManagerAddress: string | null,
  namespaceBuff: Uint8Array,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const transferNamespace = simnet.callPublicFn(
    "BNS-V2",
    "mng-manager-transfer",
    [
      newManagerAddress ? Cl.some(Cl.principal(newManagerAddress)) : Cl.none(),
      Cl.buffer(namespaceBuff),
    ],
    callerAddress
  );

  if (isError) {
    expect(transferNamespace.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(transferNamespace.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callMngBurn = (
  nftId: number,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const burnName = simnet.callPublicFn(
    "BNS-V2",
    "mng-burn",
    [Cl.uint(nftId)],
    callerAddress
  );

  if (isError) {
    expect(burnName.result).toBeErr(Cl.uint(expectedReturnValue as number));
  } else {
    expect(burnName.result).toBeOk(Cl.bool(expectedReturnValue as boolean));
  }
};

export const callSetPrimaryName = (
  nameId: number,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const changePrimaryName = simnet.callPublicFn(
    "BNS-V2",
    "set-primary-name",
    [Cl.uint(nameId)],
    callerAddress
  );

  if (isError) {
    expect(changePrimaryName.result).toBeErr(
      Cl.uint(expectedReturnValue as number)
    );
  } else {
    expect(changePrimaryName.result).toBeOk(
      Cl.bool(expectedReturnValue as boolean)
    );
  }
};

export const callListInUstx = (
  nftId: number,
  price: number,
  commTraitAddress: string,
  commTraitName: string,
  callerAddress: string,
  expectedReturnValue: any,
  isError: boolean
) => {
  const listName = simnet.callPublicFn(
    "BNS-V2",
    "list-in-ustx",
    [
      Cl.uint(nftId),
      Cl.uint(price),
      Cl.contractPrincipal(commTraitAddress, commTraitName),
    ],
    callerAddress
  );

  if (isError) {
    expect(listName.result).toBeErr(Cl.uint(expectedReturnValue));
  } else {
    expect(listName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("list-in-ustx"),
        commission: Cl.contractPrincipal(commTraitAddress, commTraitName),
        id: Cl.uint(nftId),
        price: Cl.uint(price),
      })
    );
  }
};

export const callBuyInUstx = (
  nftId: number,
  commTraitAddress: string,
  commTraitName: string,
  buyerAddress: string,
  expectedReturnValue: any,
  isError: boolean
) => {
  const buyName = simnet.callPublicFn(
    "BNS-V2",
    "buy-in-ustx",
    [Cl.uint(nftId), Cl.contractPrincipal(commTraitAddress, commTraitName)],
    buyerAddress
  );

  if (isError) {
    expect(buyName.result).toBeErr(Cl.uint(expectedReturnValue));
  } else {
    expect(buyName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("buy-in-ustx"),
        id: Cl.uint(nftId),
      })
    );
  }
};

export const callUnlistInUstx = (
  nftId: number,
  callerAddress: string,
  expectedReturnValue: any,
  isError: boolean
) => {
  const unlistName = simnet.callPublicFn(
    "BNS-V2",
    "unlist-in-ustx",
    [Cl.uint(nftId)],
    callerAddress
  );

  if (isError) {
    expect(unlistName.result).toBeErr(Cl.uint(expectedReturnValue));
  } else {
    expect(unlistName.result).toBeOk(
      Cl.tuple({
        a: Cl.stringAscii("unlist-in-ustx"),
        id: Cl.uint(nftId),
      })
    );
  }
};

export const callMngTransfer = (
  nftId: number,
  ownerAddress: string,
  recipientAddress: string,
  callerAddress: string,
  expectedReturnValue: boolean | number,
  isError: boolean
) => {
  const transferName = simnet.callPublicFn(
    "BNS-V2",
    "mng-transfer",
    [
      Cl.uint(nftId),
      Cl.principal(ownerAddress),
      Cl.principal(recipientAddress),
    ],
    callerAddress
  );

  if (isError) {
    expect(transferName.result).toBeErr(Cl.uint(expectedReturnValue as number));
  } else {
    expect(transferName.result).toBeOk(Cl.bool(expectedReturnValue as boolean));
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////
export const successfullyTwoStepRegisterANameInAnUnmanagedNamespace = () => {
  callPreorderAValidNamespace(
    namespaceBuffSalt,
    1000000000,
    address1,
    146,
    false
  );
  simnet.mineEmptyBlock();
  callRevealNamespace(
    namespaceBuff,
    saltBuff,
    1,
    1,
    new Array(16).fill(1),
    1,
    1,
    5000,
    address1,
    null,
    true,
    false,
    true,
    address1,
    true,
    false
  );
  callLaunchNamespace(namespaceBuff, address1, true, false);
  callPreorderName(name1BuffSalt, 200000000, address1, 150, false);
  simnet.mineEmptyBlock();
  callRegisterName(
    namespaceBuff,
    name1Buff,
    saltBuff,
    zonefileBuff,
    address1,
    1,
    false
  );
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
export const successfullyTwoStepRegisterASecondNameInAnUnmanagedNamespace =
  () => {
    callPreorderName(name2BuffSalt, 200000000, address1, 153, false);
    simnet.mineEmptyBlock();
    callRegisterName(
      namespaceBuff,
      name2Buff,
      saltBuff,
      zonefileBuff,
      address1,
      2,
      false
    );
  };

/////////////////////////////////////////////////////////////////////////////////////////////////////
export const successfullyTwoStepRegisterANameInAManagedNamespace = () => {
  callPreorderAValidNamespace(
    namespaceBuffSalt,
    1000000000,
    address1,
    146,
    false
  );
  simnet.mineEmptyBlock();
  callRevealNamespace(
    namespaceBuff,
    saltBuff,
    1,
    1,
    new Array(16).fill(1),
    1,
    1,
    5000,
    address1,
    managerAddress,
    false,
    true,
    false,
    address1,
    true,
    false
  );
  callLaunchNamespace(namespaceBuff, address1, true, false);
  callManagedPreorderName(name1BuffSalt, managerAddress, 150, false);
  callManagedRegisterNameWithAddress(
    namespaceBuff,
    name1Buff,
    saltBuff,
    zonefileBuff,
    address1,
    managerAddress,
    1,
    false
  );
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
export const successfullyTwoStepRegisterASecondNameInAManagedNamespace = () => {
  callManagedPreorderName(name2BuffSalt, managerAddress, 152, false);
  simnet.mineEmptyBlock();
  callManagedRegisterNameWithAddress(
    namespaceBuff,
    name2Buff,
    saltBuff,
    zonefileBuff,
    address1,
    managerAddress,
    2,
    false
  );
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
export const successfullyFastClaimANameInAnUnmanagedNamespace = () => {
  callPreorderAValidNamespace(
    namespaceBuffSalt,
    1000000000,
    address1,
    146,
    false
  );
  simnet.mineEmptyBlock();
  callRevealNamespace(
    namespaceBuff,
    saltBuff,
    1,
    1,
    new Array(16).fill(1),
    1,
    1,
    5000,
    address1,
    null,
    true,
    false,
    true,
    address1,
    true,
    false
  );
  callLaunchNamespace(namespaceBuff, address1, true, false);
  callFastClaimName(
    name1Buff,
    namespaceBuff,
    zonefileBuff,
    address1,
    address1,
    1,
    false
  );
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
export const successfullyFastClaimASecondNameInAnUnmanagedNamespace = () => {
  callFastClaimName(
    name2Buff,
    namespaceBuff,
    zonefileBuff,
    address1,
    address1,
    2,
    false
  );
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
export const successfullyFastClaimANameInAManagedNamespace = () => {
  callPreorderAValidNamespace(
    namespaceBuffSalt,
    1000000000,
    address1,
    146,
    false
  );
  simnet.mineEmptyBlock();
  callRevealNamespace(
    namespaceBuff,
    saltBuff,
    1,
    1,
    new Array(16).fill(1),
    1,
    1,
    5000,
    address1,
    managerAddress,
    false,
    true,
    false,
    address1,
    true,
    false
  );
  callLaunchNamespace(namespaceBuff, address1, true, false);
  callFastClaimName(
    name1Buff,
    namespaceBuff,
    zonefileBuff,
    address1,
    managerAddress,
    1,
    false
  );
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
export const successfullyFastClaimASecondNameInAManagedNamespace = () => {
  callFastClaimName(
    name2Buff,
    namespaceBuff,
    zonefileBuff,
    address1,
    managerAddress,
    2,
    false
  );
};
