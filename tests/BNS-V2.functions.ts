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
      zonefileHash !== null ? Cl.some(Cl.buffer(zonefileHash)) : Cl.none(),
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
  // Block 1 to start
  // Call Preorder a Namespace happens on block 2
  callPreorderAValidNamespace(
    namespaceBuffSalt,
    1000000000,
    address1,
    145,
    false
  );
  // Mine an empty block happens on block 3, to allow one block to pass between preorder and reveal
  simnet.mineEmptyBlock();
  // Reveal happens on block 4
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
  // Launch happens on block 5
  callLaunchNamespace(namespaceBuff, address1, true, false);
  // preorder happens on block 6
  callPreorderName(name1BuffSalt, 10, address1, 149, false);
  // Mine the empty block to fulfill request of 1 block between preorder and register, block 7
  simnet.mineEmptyBlock();
  // Register happens on block 8
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
    // Block 9
    // Preorder happens on block 10
    callPreorderName(name2BuffSalt, 10, address1, 152, false);
    // Mine an empty block to allow one block between preorder and register, block 11
    simnet.mineEmptyBlock();
    // Register happens on the next block 12
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
  // Block 1
  // Preorder a namespace block 2
  callPreorderAValidNamespace(
    namespaceBuffSalt,
    1000000000,
    address1,
    145,
    false
  );
  // Mine an empty block to allow one block between preorder and reveal block 3
  simnet.mineEmptyBlock();
  // Reveal the namespace block 4
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
  // Launch the namespace block 5
  callLaunchNamespace(namespaceBuff, address1, true, false);
  // Preorder a name in the managed namespace block 6
  callManagedPreorderName(name1BuffSalt, managerAddress, 149, false);
  // Register the name in the managed namespace block 7
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
  // Block 8
  // Preorder a second name in the managed namespace block 9
  callManagedPreorderName(name2BuffSalt, managerAddress, 151, false);
  // Register the second name in the managed namespace block 10
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
  // Block 1
  // Preorder a namespace block 2
  callPreorderAValidNamespace(
    namespaceBuffSalt,
    1000000000,
    address1,
    145,
    false
  );
  // Mine an empty block to allow one block between preorder and reveal block 3
  simnet.mineEmptyBlock();
  // Reveal the namespace block 4
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
  // Launch the namespace block 5
  callLaunchNamespace(namespaceBuff, address1, true, false);
  // Fast claim a name in the unmanaged namespace block 6, that for fast claim should register at block 7
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
  // Block 8
  // Fast claim a second name in the unmanaged namespace block 9, that for fast claim should register at block 10
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
  // Block 1
  // Preorder a namespace block 2
  callPreorderAValidNamespace(
    namespaceBuffSalt,
    1000000000,
    address1,
    145,
    false
  );
  // Mine an empty block to allow one block between preorder and reveal block 3
  simnet.mineEmptyBlock();
  // Reveal the namespace as managed block 4
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
  // Launch the namespace block 5
  callLaunchNamespace(namespaceBuff, address1, true, false);
  // Fast claim a name in the managed namespace block 6, should register at block 7
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
  // Block 8
  // Fast claim a second name in the managed namespace block 9, should register at block 10
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

// Read Only

export const callGetLastTokenId = (expectedId: number) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "get-last-token-id",
    [],
    address1
  );
  expect(result.result).toBeOk(Cl.uint(expectedId));
};

export const callGetTokenUri = (id: number, expectedUri: string | null) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "get-token-uri",
    [Cl.uint(id)],
    address1
  );
  expect(result.result).toBeOk(
    expectedUri ? Cl.some(Cl.stringAscii(expectedUri)) : Cl.none()
  );
};

export const callGetOwner = (id: number, expectedOwner: string | null) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "get-owner",
    [Cl.uint(id)],
    address1
  );
  expect(result.result).toBeOk(
    expectedOwner ? Cl.some(Cl.principal(expectedOwner)) : Cl.none()
  );
};

export const callGetNamespacePrice = (
  namespace: Uint8Array,
  expectedPrice: number
) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "get-namespace-price",
    [Cl.buffer(namespace)],
    address1
  );
  expect(result.result).toBeOk(Cl.uint(expectedPrice));
};

export const callCanNamespaceBeRegistered = (
  namespace: Uint8Array,
  expectedResult: boolean
) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "can-namespace-be-registered",
    [Cl.buffer(namespace)],
    address1
  );
  expect(result.result).toBeOk(Cl.bool(expectedResult));
};

export const callGetNamespaceProperties = (
  namespace: Uint8Array,
  expectedProperties: {
    "namespace-manager"?: string | null;
    "manager-transferable": boolean;
    "manager-frozen": boolean;
    "namespace-import": string;
    "revealed-at": number;
    "launched-at"?: number | null;
    lifetime: number;
    "can-update-price-function": boolean;
    "price-function": {
      buckets: number[];
      base: number;
      coeff: number;
      "nonalpha-discount": number;
      "no-vowel-discount": number;
    };
  }
) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "get-namespace-properties",
    [Cl.buffer(namespace)],
    address1
  );

  expect(result.result).toBeOk(
    Cl.tuple({
      namespace: Cl.buffer(namespace),
      properties: Cl.tuple({
        "namespace-manager":
          expectedProperties["namespace-manager"] !== undefined
            ? expectedProperties["namespace-manager"] !== null
              ? Cl.some(Cl.principal(expectedProperties["namespace-manager"]))
              : Cl.none()
            : Cl.none(),
        "manager-transferable": Cl.bool(
          expectedProperties["manager-transferable"]
        ),
        "manager-frozen": Cl.bool(expectedProperties["manager-frozen"]),
        "namespace-import": Cl.principal(
          expectedProperties["namespace-import"]
        ),
        "revealed-at": Cl.uint(expectedProperties["revealed-at"]),
        "launched-at":
          expectedProperties["launched-at"] !== undefined
            ? expectedProperties["launched-at"] !== null
              ? Cl.some(Cl.uint(expectedProperties["launched-at"]))
              : Cl.none()
            : Cl.none(),
        lifetime: Cl.uint(expectedProperties["lifetime"]),
        "can-update-price-function": Cl.bool(
          expectedProperties["can-update-price-function"]
        ),
        "price-function": Cl.tuple({
          buckets: Cl.list(
            expectedProperties["price-function"].buckets.map((b) => Cl.uint(b))
          ),
          base: Cl.uint(expectedProperties["price-function"].base),
          coeff: Cl.uint(expectedProperties["price-function"].coeff),
          "nonalpha-discount": Cl.uint(
            expectedProperties["price-function"]["nonalpha-discount"]
          ),
          "no-vowel-discount": Cl.uint(
            expectedProperties["price-function"]["no-vowel-discount"]
          ),
        }),
      }),
    })
  );
};

export const callGetBnsInfo = (
  name: Uint8Array,
  namespace: Uint8Array,
  expectedInfo: {
    "registered-at"?: number | null;
    "imported-at"?: number | null;
    "revoked-at": boolean;
    "zonefile-hash"?: Uint8Array | null;
    "hashed-salted-fqn-preorder"?: Uint8Array | null;
    "preordered-by"?: string | null;
    "renewal-height": number;
    "stx-burn": number;
    owner: string;
  } | null
) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "get-bns-info",
    [Cl.buffer(name), Cl.buffer(namespace)],
    address1
  );

  if (expectedInfo) {
    expect(result.result).toBeSome(
      Cl.tuple({
        "registered-at":
          expectedInfo["registered-at"] !== undefined
            ? expectedInfo["registered-at"] !== null
              ? Cl.some(Cl.uint(expectedInfo["registered-at"]))
              : Cl.none()
            : Cl.none(),
        "imported-at":
          expectedInfo["imported-at"] !== undefined
            ? expectedInfo["imported-at"] !== null
              ? Cl.some(Cl.uint(expectedInfo["imported-at"]))
              : Cl.none()
            : Cl.none(),
        "revoked-at": Cl.bool(expectedInfo["revoked-at"]),
        "zonefile-hash":
          expectedInfo["zonefile-hash"] !== undefined
            ? expectedInfo["zonefile-hash"] !== null
              ? Cl.some(Cl.buffer(expectedInfo["zonefile-hash"]))
              : Cl.none()
            : Cl.none(),
        "hashed-salted-fqn-preorder":
          expectedInfo["hashed-salted-fqn-preorder"] !== undefined
            ? expectedInfo["hashed-salted-fqn-preorder"] !== null
              ? Cl.some(Cl.buffer(expectedInfo["hashed-salted-fqn-preorder"]))
              : Cl.none()
            : Cl.none(),
        "preordered-by":
          expectedInfo["preordered-by"] !== undefined
            ? expectedInfo["preordered-by"] !== null
              ? Cl.some(Cl.principal(expectedInfo["preordered-by"]))
              : Cl.none()
            : Cl.none(),
        "renewal-height": Cl.uint(expectedInfo["renewal-height"]),
        "stx-burn": Cl.uint(expectedInfo["stx-burn"]),
        owner: Cl.principal(expectedInfo["owner"]),
      })
    );
  } else {
    expect(result.result).toBeNone();
  }
};

export const callGetIdFromBns = (
  name: Uint8Array,
  namespace: Uint8Array,
  expectedId: number | null
) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "get-id-from-bns",
    [Cl.buffer(name), Cl.buffer(namespace)],
    address1
  );
  if (expectedId !== null) {
    expect(result.result).toBeSome(Cl.uint(expectedId));
  } else {
    expect(result.result).toBeNone();
  }
};

export const callGetBnsFromId = (
  id: number,
  expectedName: Uint8Array | null,
  expectedNamespace: Uint8Array | null
) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "get-bns-from-id",
    [Cl.uint(id)],
    address1
  );
  if (expectedName && expectedNamespace) {
    expect(result.result).toBeSome(
      Cl.tuple({
        name: Cl.buffer(expectedName),
        namespace: Cl.buffer(expectedNamespace),
      })
    );
  } else {
    expect(result.result).toBeNone();
  }
};

export const callGetPrimaryName = (
  owner: string,
  expectedId: number | null
) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "get-primary-name",
    [Cl.principal(owner)],
    address1
  );
  if (expectedId !== null) {
    expect(result.result).toBeSome(Cl.uint(expectedId));
  } else {
    expect(result.result).toBeNone();
  }
};

export const callGetRenewalHeight = (
  id: number,
  expectedResult: number,
  isError: boolean
) => {
  const result = simnet.callReadOnlyFn(
    "BNS-V2",
    "get-renewal-height",
    [Cl.uint(id)],
    address1
  );
  if (!isError) {
    expect(result.result).toBeOk(Cl.uint(expectedResult));
  } else {
    expect(result.result).toBeErr(Cl.uint(expectedResult));
  }
};
