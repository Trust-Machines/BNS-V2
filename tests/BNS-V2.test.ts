import { describe, it } from "vitest";
import { initSimnet } from "@hirosystems/clarinet-sdk";
import {
  ERR_UNWRAP,
  ERR_NOT_AUTHORIZED,
  ERR_NOT_LISTED,
  ERR_WRONG_COMMISSION,
  ERR_LISTED,
  ERR_NO_NAME,
  ERR_HASH_MALFORMED,
  ERR_STX_BURNT_INSUFFICIENT,
  ERR_PREORDER_NOT_FOUND,
  ERR_CHARSET_INVALID,
  ERR_NAMESPACE_ALREADY_EXISTS,
  ERR_PREORDER_CLAIMABILITY_EXPIRED,
  ERR_NAMESPACE_NOT_FOUND,
  ERR_OPERATION_UNAUTHORIZED,
  ERR_NAMESPACE_ALREADY_LAUNCHED,
  ERR_NAMESPACE_PREORDER_LAUNCHABILITY_EXPIRED,
  ERR_NAMESPACE_NOT_LAUNCHED,
  ERR_NAME_NOT_AVAILABLE,
  ERR_NAMESPACE_BLANK,
  ERR_NAME_BLANK,
  ERR_NAME_REVOKED,
  ERR_NAME_PREORDERED_BEFORE_NAMESPACE_LAUNCH,
  ERR_NAMESPACE_HAS_MANAGER,
  ERR_OVERFLOW,
  ERR_NO_NAMESPACE_MANAGER,
  ERR_FAST_MINTED_BEFORE,
  ERR_PREORDERED_BEFORE,
  ERR_NAME_NOT_CLAIMABLE_YET,
  ERR_IMPORTED_BEFORE,
  commTraitName,
  commTraitAddress,
  commTraitNameWrong,
  commTraitAddressWrong,
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
import {
  callPreorderAValidNamespace,
  callRevealNamespace,
  callLaunchNamespace,
  callPreorderName,
  callRegisterName,
  callManagedPreorderName,
  callManagedRegisterNameWithAddress,
  callFastClaimName,
  successfullyTwoStepRegisterANameInAnUnmanagedNamespace,
  successfullyTwoStepRegisterANameInAManagedNamespace,
  successfullyFastClaimANameInAnUnmanagedNamespace,
  successfullyFastClaimANameInAManagedNamespace,
  successfullyTwoStepRegisterASecondNameInAnUnmanagedNamespace,
  successfullyTwoStepRegisterASecondNameInAManagedNamespace,
  callTransferName,
  callTurnOffManagerTransfers,
  callRenewName,
  callRevokeName,
  callImportName,
  callUpdateZonefileHash,
  callClaimPreorder,
  callNamespaceFreezePrice,
  callNamespaceUpdatePrice,
  callFreezeManager,
  callManagerTransfer,
  callMngBurn,
  callSetPrimaryName,
  callBuyInUstx,
  callListInUstx,
  callUnlistInUstx,
  callMngTransfer,
  callGetBnsInfo,
  callGetNamespaceProperties,
  callGetOwner,
  callGetPrimaryName,
  callGetBnsFromId,
  callGetIdFromBns,
} from "./BNS-V2.functions";

const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_4")!;
const address3 = accounts.get("wallet_3")!;
const managerAddress = accounts.get("wallet_2")!;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("TRANSFER FUNCTION", () => {
  it("This should successfully transfer a 2 step registered name in an unmanaged namespace", () => {
    // Register a name with the 2 step flow in an unmanaged namespace
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Check the information of the name
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    callGetOwner(1, address1);
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Call the transfer function
    callTransferName(1, address1, address3, address1, true, false);
    // Check the information of the name
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address3,
    });
    // Check Primary names
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);
  });

  it("This should successfully transfer a 2 step registered name in a managed namespace where manager transfers are turned off", () => {
    // Register a name with the 2 step flow in a managed namespace
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Turn off manager transfers
    callTurnOffManagerTransfers(namespaceBuff, managerAddress, true, false);
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Call the transfer function
    callTransferName(1, address1, address3, address1, true, false);
    // Check the final state
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address3,
    });
    // Check Primary Names
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);
  });

  it("This should successfully transfer a fast claimed name in an unmanaged namespace, when allowing one block before transfering", () => {
    // Fast claim a name in an unmanaged namespace
    successfullyFastClaimANameInAnUnmanagedNamespace();
    // Mine an empty block to allow transfer
    simnet.mineEmptyBlock();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5007,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Call the transfer function
    callTransferName(1, address1, address3, address1, true, false);
    // Check the final state
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5007,
      "stx-burn": 10,
      owner: address3,
    });
    // Check Primary Names
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);
  });

  it("This should successfully transfer a fast claimed name, when one block has passed in a managed namespace that has manager transfers turned off", () => {
    // Fast claim a name in a managed namespace
    successfullyFastClaimANameInAManagedNamespace();
    // Mine an empty block to allow transfer
    simnet.mineEmptyBlock();
    // Turn off manager transfers
    callTurnOffManagerTransfers(namespaceBuff, managerAddress, true, false);
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Call the transfer function
    callTransferName(1, address1, address3, address1, true, false);
    // Check the final state
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address3,
    });
    // Check Primary Names
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);
  });

  it("This should successfully transfer a name that was previously transferred", () => {
    // Register a name with the 2 step flow in an unmanaged namespace
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // First transfer
    callTransferName(1, address1, address3, address1, true, false);
    // Check state after first transfer
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address3,
    });
    // Check Primary Names after first transfer
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);

    // Second transfer
    callTransferName(1, address3, address2, address3, true, false);
    // Check state after second transfer
    callGetOwner(1, address2);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address2,
    });
    // Check Primary Names after second transfer
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, null);
    callGetPrimaryName(address2, 1);
  });

  it("This should successfully transfer a name back to its original owner", () => {
    // Register a name with the 2 step flow in an unmanaged namespace
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Transfer to address3
    callTransferName(1, address1, address3, address1, true, false);
    // Check state after first transfer
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address3,
    });
    // Check Primary Names after first transfer
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);

    // Transfer back to address1
    callTransferName(1, address3, address1, address3, true, false);
    // Check state after second transfer
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    // Check Primary Names after second transfer
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
  });

  it("This should successfully transfer a name to an address that already has a primary name, and should not change the primary name of the recipient", () => {
    // Register a name with the 2 step flow in an unmanaged namespace
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
    callFastClaimName(
      name2Buff,
      namespaceBuff,
      zonefileBuff,
      address3,
      address3,
      2,
      false
    );
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, 2);

    // Transfer to address3
    callTransferName(1, address1, address3, address1, true, false);
    // Check state after first transfer
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address3,
    });
    // Check Primary Names after first transfer
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 2);
  });

  it("This should successfully transfer a name, the owner is transferring a non primary name", () => {
    // Register a name with the 2 step flow in an unmanaged namespace
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
    callFastClaimName(
      name2Buff,
      namespaceBuff,
      zonefileBuff,
      address1,
      address1,
      2,
      false
    );
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
    simnet.mineEmptyBlock();

    // Transfer to address3
    callTransferName(2, address1, address3, address1, true, false);
    // Check state after first transfer
    callGetOwner(2, address3);
    callGetBnsInfo(name2Buff, namespaceBuff, {
      "registered-at": 10,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5010,
      "stx-burn": 10,
      owner: address3,
    });
    // Check Primary Names after first transfer
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, 2);
  });

  it("This should successfully transfer a name that was imported", () => {
    // Import a name
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
    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address1,
      address1,
      true,
      false
    );
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Launch
    callLaunchNamespace(namespaceBuff, address1, true, false);

    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5006,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Transfer the imported name
    callTransferName(1, address1, address3, address1, true, false);
    // Check state after transfer
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5006,
      "stx-burn": 10,
      owner: address3,
    });
    // Check Primary Names after transfer
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);
  });

  it("This should fail to transfer a name that doesn't exist", () => {
    // Check the initial state
    callGetOwner(1, null);
    callGetBnsInfo(name1Buff, namespaceBuff, null);
    // Attempt to transfer a non-existent name
    callTransferName(1, address1, address3, address1, ERR_NO_NAME, true);
    // Check that the state hasn't changed
    callGetOwner(1, null);
    callGetBnsInfo(name1Buff, namespaceBuff, null);
  });

  it("This should fail to transfer a fast claimed name in an unmanaged namespace when trying to transfer before the block time has passed", () => {
    // Fast claim a name in an unmanaged namespace
    successfullyFastClaimANameInAnUnmanagedNamespace();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5007,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Attempt to transfer immediately (should fail)
    callTransferName(
      1,
      address1,
      address3,
      address1,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );
    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5007,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
  });

  it("This should fail to transfer a fast claimed name in an managed namespace, that has manager transfers turned off when trying to transfer before the block time has passed", () => {
    // Fast claim a name in an unmanaged namespace
    successfullyFastClaimANameInAManagedNamespace();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Attempt to transfer immediately (should fail)
    callTransferName(
      1,
      address1,
      address3,
      address1,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );
    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
  });

  it("This should block transfers from imported names when the namespace has not been launched", () => {
    // Import a name without launching the namespace
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

    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address1,
      address1,
      true,
      false
    );

    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Check namespace properties to confirm it's not launched
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
      "manager-transferable": false,
      "manager-frozen": true,
    });

    // Attempt to transfer the imported name (should fail)
    callTransferName(
      1,
      address1,
      address3,
      address1,
      ERR_NAMESPACE_NOT_LAUNCHED,
      true
    );

    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
  });

  it("This should block transfers of revoked names", () => {
    // Register a name
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });

    // Revoke the name
    callRevokeName(namespaceBuff, name1Buff, address1, true, false);

    // Check the state after revocation
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": true,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });

    // Attempt to transfer the revoked name (should fail)
    callTransferName(1, address1, address3, address1, ERR_NAME_REVOKED, true);

    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": true,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
  });

  it("This should fail to transfer when owner and recipient are the same", () => {
    // Register a name with the 2 step flow in an unmanaged namespace
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Attempt to transfer to the same address (should fail)
    callTransferName(
      1,
      address1,
      address1,
      address1,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );
    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
  });

  it("This should fail to transfer a name in a managed namespace when manager transfers are on, even if the contract-caller is the manager", () => {
    // Fast claim a name in a managed namespace
    successfullyFastClaimANameInAManagedNamespace();
    // Mine an empty block to allow transfer
    simnet.mineEmptyBlock();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Attempt to transfer as manager (should fail)
    callTransferName(
      1,
      address1,
      address3,
      managerAddress,
      ERR_NOT_AUTHORIZED,
      true
    );
    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
  });

  it("This should fail to transfer a name in a managed namespace when manager transfers are on even if the tx-sender is the owner", () => {
    // Fast claim a name in a managed namespace
    successfullyFastClaimANameInAManagedNamespace();
    // Mine an empty block to allow transfer
    simnet.mineEmptyBlock();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Attempt to transfer as owner (should fail)
    callTransferName(1, address1, address3, address1, ERR_NOT_AUTHORIZED, true);
    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
  });

  it("This should fail to transfer a name in a managed namespace when the contract-caller is the namespace manager but manager transfers are off", () => {
    // Fast claim a name in a managed namespace
    successfullyFastClaimANameInAManagedNamespace();
    // Mine an empty block to allow transfer
    simnet.mineEmptyBlock();
    // Turn off manager transfers
    callTurnOffManagerTransfers(namespaceBuff, managerAddress, true, false);
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Attempt to transfer as manager (should fail)
    callTransferName(
      1,
      address1,
      address3,
      managerAddress,
      ERR_NOT_AUTHORIZED,
      true
    );
    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
  });

  it("This should fail to transfer a name in an unmanaged namespace when the tx-sender is not the owner", () => {
    // Fast claim a name in an unmanaged namespace
    successfullyFastClaimANameInAnUnmanagedNamespace();
    // Mine an empty block to allow transfer
    simnet.mineEmptyBlock();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5007,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Attempt to transfer from non-owner address (should fail)
    callTransferName(1, address1, address3, address3, ERR_NOT_AUTHORIZED, true);
    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5007,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
  });

  it("This should fail to transfer when the provided owner doesn't match the current NFT owner", () => {
    // Register a name with the 2 step flow in an unmanaged namespace
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Attempt to transfer with incorrect owner (should fail)
    callTransferName(
      1,
      managerAddress,
      address3,
      address1,
      ERR_NOT_AUTHORIZED,
      true
    );
    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
  });

  it("This should fail to transfer a name in an unmanaged namespace when the name is listed in a market", () => {
    // Fast claim a name in an unmanaged namespace
    successfullyFastClaimANameInAnUnmanagedNamespace();
    // Mine an empty block to allow transfer
    simnet.mineEmptyBlock();
    // List the name in the market
    callListInUstx(
      1,
      10000,
      commTraitAddress,
      commTraitName,
      address1,
      null,
      false
    );
    // Check the initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5007,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    // Attempt to transfer listed name (should fail)
    callTransferName(1, address1, address3, address1, ERR_LISTED, true);
    // Check that the state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5007,
      "stx-burn": 10,
      owner: address1,
    });
    // Check Primary Names
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("MNG-TRANSFER FUNCTION", () => {
  it("This should successfully transfer a 2 step registered name in a managed namespace that does allow manager transfers when contract-caller is manager", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Check initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    callMngTransfer(1, address1, address3, managerAddress, true, false);

    // Check final state
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address3,
    });
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);
  });

  it("This should successfully transfer a fast claimed name in a managed namespace that does allow manager transfers and contract-caller is manager", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    // Check initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    callMngTransfer(1, address1, address3, managerAddress, true, false);

    // Check final state
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address3,
    });
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);
  });

  it("This should successfully transfer an imported name in a managed namespace", () => {
    // Import a name
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
      true,
      true,
      false,
      address1,
      true,
      false
    );
    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address1,
      managerAddress,
      true,
      false
    );
    callLaunchNamespace(namespaceBuff, address1, true, false);

    // Check initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);

    callMngTransfer(1, address1, address3, managerAddress, true, false);

    // Check final state
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address3,
    });
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);
  });

  it("This should successfully transfer a name multiple times", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });

    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, null);
    callGetPrimaryName(address2, null);

    // First transfer
    callMngTransfer(1, address1, address3, managerAddress, true, false);

    // Check state after first transfer
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address3,
    });
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);
    callGetPrimaryName(address2, null);

    // Second transfer
    callMngTransfer(1, address3, address2, managerAddress, true, false);

    // Check state after second transfer
    callGetOwner(1, address2);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address2,
    });
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, null);
    callGetPrimaryName(address2, 1);
  });

  it("This should successfully transfer a name back to its original owner", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // First transfer
    callMngTransfer(1, address1, address3, managerAddress, true, false);

    // Check state after first transfer
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address3,
    });
    callGetPrimaryName(address1, null);
    callGetPrimaryName(address3, 1);

    // Transfer back to original owner
    callMngTransfer(1, address3, address1, managerAddress, true, false);

    // Check state after second transfer
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
    callGetPrimaryName(address3, null);
    callGetPrimaryName(address1, 1);
  });

  it("This should fail to transfer a name that doesn't exist", () => {
    callMngTransfer(1, address1, address3, managerAddress, ERR_NO_NAME, true);
    callGetOwner(1, null);
    callGetBnsInfo(name1Buff, namespaceBuff, null);
  });

  it("This should fail to transfer a fast claimed name in a managed namespace when trying to transfer before the block time has passed", () => {
    successfullyFastClaimANameInAManagedNamespace();
    callMngTransfer(
      1,
      address1,
      address3,
      managerAddress,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );
    // Check state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
  });

  it("This should fail to transfer a name in a namespace that hasn't been launched", () => {
    // Setup a namespace without launching it
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
      true,
      true,
      false,
      address1,
      true,
      false
    );
    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address1,
      managerAddress,
      true,
      false
    );

    // Check initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });

    // Attempt to transfer
    callMngTransfer(
      1,
      address1,
      address3,
      managerAddress,
      ERR_NAMESPACE_NOT_LAUNCHED,
      true
    );

    // Check state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
  });

  it("This should fail to transfer a revoked name", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callRevokeName(namespaceBuff, name1Buff, managerAddress, true, false);
    callMngTransfer(
      1,
      address1,
      address3,
      managerAddress,
      ERR_NAME_REVOKED,
      true
    );
    // Check state hasn't changed (except for revocation)
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": true,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
  });

  it("This should fail to transfer when owner and recipient are the same", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callMngTransfer(
      1,
      address1,
      address1,
      managerAddress,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );
    // Check state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
  });

  it("This should fail to transfer a name in a managed namespace when manager transfers are off even if the contract-caller is the manager", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callTurnOffManagerTransfers(namespaceBuff, managerAddress, true, false);
    callMngTransfer(
      1,
      address1,
      address3,
      managerAddress,
      ERR_NOT_AUTHORIZED,
      true
    );
    // Check state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
  });

  it("This should fail to transfer a 2 step registered name in a managed namespace even if the tx-sender is the owner", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callMngTransfer(1, address1, address3, address1, ERR_NOT_AUTHORIZED, true);
    // Check state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
  });

  it("This should fail to transfer a fast claimed name in a managed namespace even if the block time has passed and tx-sender is owner", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callMngTransfer(1, address1, address3, address1, ERR_NOT_AUTHORIZED, true);
    // Check state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
  });

  it("This should fail to transfer when the provided owner doesn't match the current NFT owner", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callMngTransfer(
      1,
      managerAddress,
      address3,
      managerAddress,
      ERR_NOT_AUTHORIZED,
      true
    );
    // Check state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
  });

  it("This should fail to transfer a name in a managed namespace when the name is listed in a market", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      10000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      null,
      false
    );
    callMngTransfer(1, address1, address3, managerAddress, ERR_LISTED, true);
    // Check state hasn't changed
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address1,
    });
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("LIST-IN-USTX-FUNCTION", () => {
  it("This should successfully list a 2 step registered name in an unmanaged namespace", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address1,
      null,
      false
    );
  });

  it("This should successfully list a 2 step registered name in a managed namespace", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      null,
      false
    );
  });

  it("This should successfully list a fast claimed name in an unmanaged namespace", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address1,
      null,
      false
    );
  });

  it("This should successfully list a fast claimed name in a managed namespace", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      null,
      false
    );
  });

  it("This should fail to list a name that doesn't exist", () => {
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address3,
      ERR_NO_NAME,
      true
    );
  });

  it("This should fail to list a name in an unmanaged namespace when it was fast claimed but the lock time has not passed", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address1,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );
  });

  it("This should fail to list a name in a managed namespace when it was fast claimed but the lock time has not passed", () => {
    successfullyFastClaimANameInAManagedNamespace();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );
  });

  it("This should fail to list a name in an unmanaged namespace when the tx-sender is not the owner", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address3,
      ERR_NOT_AUTHORIZED,
      true
    );
  });

  it("This should fail to list a name in an unmanaged namespace when the contract-caller is not the manager", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address1,
      ERR_NOT_AUTHORIZED,
      true
    );
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("UNLIST-IN-USTX-FUNCTION", () => {
  it("This should successfully unlist a 2 step registered name without a manager", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address1,
      null,
      false
    );
    callUnlistInUstx(1, address1, null, false);
  });

  it("This should successfully unlist a 2 step registered name with a manager", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      null,
      false
    );
    callUnlistInUstx(1, managerAddress, null, false);
  });

  it("This should successfully unlist a fast claimed name without a manager", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address1,
      null,
      false
    );
    callUnlistInUstx(1, address1, null, false);
  });

  it("This should successfully unlist a fast claimed name with a manager", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      null,
      false
    );
    callUnlistInUstx(1, managerAddress, null, false);
  });

  it("This should fail to unlist a name that doesn't exist", () => {
    callUnlistInUstx(1, address1, ERR_NO_NAME, true);
  });

  it("This should fail to unlist a name without a manager, when the name is not listed", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();
    callUnlistInUstx(1, address1, ERR_NOT_LISTED, true);
  });

  it("This should fail to unlist a name with a manager, when the name is not listed", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callUnlistInUstx(1, managerAddress, ERR_NOT_LISTED, true);
  });

  it("This should fail to unlist a name without a manager, when tx-sender is not the owner", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address1,
      null,
      false
    );
    callUnlistInUstx(1, address3, ERR_NOT_AUTHORIZED, true);
  });

  it("This should fail to unlist a name with a manager, when contract-caller is not the manager", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      null,
      false
    );
    callUnlistInUstx(1, address3, ERR_NOT_AUTHORIZED, true);
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("BUY-IN-USTX-FUNCTION", () => {
  it("This should successfully buy a 2 step registered name without a manager", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    callGetPrimaryName(address3, null);
    callGetPrimaryName(address1, 1);

    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address1,
      null,
      false
    );
    callBuyInUstx(1, commTraitAddress, commTraitName, address3, null, false);
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address3,
    });
    callGetPrimaryName(address3, 1);
    callGetPrimaryName(address1, null);
  });

  it("This should successfully buy a 2 step registered name with a manager", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      null,
      false
    );
    callBuyInUstx(1, commTraitAddress, commTraitName, address3, null, false);
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address3,
    });
    callGetPrimaryName(address3, 1);
    callGetPrimaryName(address1, null);
  });

  it("This should successfully buy a fast claimed name without a manager", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      address1,
      null,
      false
    );
    callBuyInUstx(1, commTraitAddress, commTraitName, address3, null, false);
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 5007,
      "stx-burn": 10,
      owner: address3,
    });
    callGetPrimaryName(address3, 1);
    callGetPrimaryName(address1, null);
  });

  it("This should successfully buy a fast claimed name with a manager", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      null,
      false
    );
    callBuyInUstx(1, commTraitAddress, commTraitName, address3, null, false);
    callGetOwner(1, address3);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": null,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address3,
    });
    callGetPrimaryName(address3, 1);
    callGetPrimaryName(address1, null);
  });

  it("This should fail to buy a name that doesn't exist", () => {
    callBuyInUstx(
      1,
      commTraitAddressWrong,
      commTraitNameWrong,
      address3,
      ERR_NO_NAME,
      true
    );
  });

  it("This should fail to buy a name without a manager, if it is not listed", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();
    simnet.mineEmptyBlock();
    callBuyInUstx(
      1,
      commTraitAddress,
      commTraitName,
      address3,
      ERR_NOT_LISTED,
      true
    );
  });

  it("This should fail to buy a name with a manager, if it is not listed", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callBuyInUstx(
      1,
      commTraitAddress,
      commTraitName,
      address3,
      ERR_NOT_LISTED,
      true
    );
  });

  it("This should fail to buy a name wrong commission trait", () => {
    successfullyFastClaimANameInAManagedNamespace();
    simnet.mineEmptyBlock();
    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      null,
      false
    );
    callBuyInUstx(
      1,
      commTraitAddressWrong,
      commTraitNameWrong,
      address3,
      ERR_WRONG_COMMISSION,
      true
    );
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("SET-PRIMARY-NAME FUNCTION", () => {
  it("This should successfully change the primary name of an address in an unmanaged namespace, when tx-sender is owner", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    callGetPrimaryName(address1, 1);
    successfullyTwoStepRegisterASecondNameInAnUnmanagedNamespace();
    callGetPrimaryName(address1, 1);
    callSetPrimaryName(2, address1, true, false);
    callGetPrimaryName(address1, 2);
  });

  it("This should successfully change the primary name of an address in a managed namespace, when tx-sender is owner", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callGetPrimaryName(address1, 1);
    successfullyTwoStepRegisterASecondNameInAManagedNamespace();
    callGetPrimaryName(address1, 1);
    callSetPrimaryName(2, address1, true, false);
    callGetPrimaryName(address1, 2);
  });

  it("This should fail to change the primary name of an address, if the name doesn't exist", () => {
    callSetPrimaryName(2, address1, ERR_NO_NAME, true);
    callGetPrimaryName(address1, null);
  });

  it("This should fail to change the primary name of an address, if the tx-sender is not the owner of the name", () => {
    successfullyFastClaimANameInAManagedNamespace();
    callGetPrimaryName(address1, 1);
    callFastClaimName(
      name2Buff,
      namespaceBuff,
      zonefileBuff,
      address3,
      managerAddress,
      2,
      false
    );
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, 2);
    callSetPrimaryName(1, address3, ERR_NOT_AUTHORIZED, true);
    callGetPrimaryName(address1, 1);
    callGetPrimaryName(address3, 2);
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("MNG-BURN FUNCTIONS", () => {
  it("This should successfully burn a name by the manager from a managed namespace", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    // Check initial state
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
    callGetPrimaryName(address1, 1);
    callGetBnsFromId(1, name1Buff, namespaceBuff);
    callGetIdFromBns(name1Buff, namespaceBuff, 1);
    // Burn
    callMngBurn(1, managerAddress, true, false);
    // Check final state
    callGetOwner(1, null);
    callGetBnsInfo(name1Buff, namespaceBuff, null);
    callGetPrimaryName(address1, null);
    callGetBnsFromId(1, null, null);
    callGetIdFromBns(name1Buff, namespaceBuff, null);
  });

  it("This should still burn the name if it is listed when called by the manager address", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    callListInUstx(
      1,
      200000,
      commTraitAddress,
      commTraitName,
      managerAddress,
      null,
      false
    );
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
    callGetPrimaryName(address1, 1);
    callGetBnsFromId(1, name1Buff, namespaceBuff);
    callGetIdFromBns(name1Buff, namespaceBuff, 1);
    // Burn
    callMngBurn(1, managerAddress, true, false);
    // Check final state
    callGetOwner(1, null);
    callGetBnsInfo(name1Buff, namespaceBuff, null);
    callGetPrimaryName(address1, null);
    callGetBnsFromId(1, null, null);
    callGetIdFromBns(name1Buff, namespaceBuff, null);
  });

  it("This should fail to burn a nonexistent name", () => {
    callMngBurn(1, managerAddress, ERR_NO_NAME, true);
  });

  it("This should fail in a namespace with no manager", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    callGetPrimaryName(address1, 1);
    callGetBnsFromId(1, name1Buff, namespaceBuff);
    callGetIdFromBns(name1Buff, namespaceBuff, 1);
    callMngBurn(1, managerAddress, ERR_NO_NAMESPACE_MANAGER, true);
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 8,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 5008,
      "stx-burn": 200000000,
      owner: address1,
    });
    callGetPrimaryName(address1, 1);
    callGetBnsFromId(1, name1Buff, namespaceBuff);
    callGetIdFromBns(name1Buff, namespaceBuff, 1);
  });

  it("This should fail by not allowing a different address than the manager address to burn an nft from a managed namespace", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
    callGetPrimaryName(address1, 1);
    callGetBnsFromId(1, name1Buff, namespaceBuff);
    callGetIdFromBns(name1Buff, namespaceBuff, 1);
    callMngBurn(1, address1, ERR_NOT_AUTHORIZED, true);
    callGetOwner(1, address1);
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": 7,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name1BuffSalt,
      "preordered-by": address1,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address1,
    });
    callGetPrimaryName(address1, 1);
    callGetBnsFromId(1, name1Buff, namespaceBuff);
    callGetIdFromBns(name1Buff, namespaceBuff, 1);
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("MNG-MANAGER-TRANSFER FUNCTION", () => {
  it("This should successfully change the manager of a namespace if manager is not frozen", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
    callManagerTransfer(address1, namespaceBuff, managerAddress, true, false);
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": address1,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should successfully transfer the manager to none", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    // Transfer manager to none
    callManagerTransfer(null, namespaceBuff, managerAddress, true, false);

    // Check final state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should successfully transfer the manager multiple times in succession", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    // First transfer
    callManagerTransfer(address1, namespaceBuff, managerAddress, true, false);

    // Check intermediate state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": address1,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    // Second transfer
    callManagerTransfer(address2, namespaceBuff, address1, true, false);

    // Check final state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": address2,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should verify that the new manager can perform manager-specific operations after the transfer", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    // Transfer manager to address1
    callManagerTransfer(address1, namespaceBuff, managerAddress, true, false);

    // Check state after transfer
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": address1,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    // Verify that the new manager can perform a manager-specific operation (mng-transfer)
    callManagerTransfer(address2, namespaceBuff, address1, true, false);

    // Check state after second transfer
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": address2,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    // Verify that the new manager can perform another manager-specific operation (mng-burn)
    // First, register a name in the namespace
    callManagedPreorderName(name2BuffSalt, address2, 154, false);
    callManagedRegisterNameWithAddress(
      namespaceBuff,
      name2Buff,
      saltBuff,
      zonefileBuff,
      address3,
      address2,
      2,
      false
    );

    // Check the name exists
    callGetOwner(2, address3);
    callGetBnsInfo(name2Buff, namespaceBuff, {
      "registered-at": 11,
      "imported-at": null,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": name2BuffSalt,
      "preordered-by": address3,
      "renewal-height": 0,
      "stx-burn": 0,
      owner: address3,
    });

    // Burn the name
    callMngBurn(2, address2, true, false);

    // Verify the name no longer exists
    callGetOwner(2, null);
    callGetBnsInfo(name2Buff, namespaceBuff, null);
  });

  it("This should fail to change the manager of a namespace that doesn't exist", () => {
    callManagerTransfer(
      address1,
      namespaceBuff,
      managerAddress,
      ERR_NAMESPACE_NOT_FOUND,
      true
    );
  });

  it("This should fail to change the manager of an unmanaged namespace", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    callGetNamespaceProperties(namespaceBuff, {
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
    callManagerTransfer(
      address1,
      namespaceBuff,
      managerAddress,
      ERR_NO_NAMESPACE_MANAGER,
      true
    );
    callGetNamespaceProperties(namespaceBuff, {
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to change the manager of a namespace if the manager is not the contract-caller", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
    callManagerTransfer(
      address1,
      namespaceBuff,
      address1,
      ERR_NOT_AUTHORIZED,
      true
    );
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to change the manager of a namespace if the manager is the contract-caller but the manager is frozen", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
    callFreezeManager(namespaceBuff, managerAddress, true, false);
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
    callManagerTransfer(
      address1,
      namespaceBuff,
      managerAddress,
      ERR_NOT_AUTHORIZED,
      true
    );
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("FREEZE-MANAGER FUNCTION", () => {
  it("This should successfully freeze the manager", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callFreezeManager(namespaceBuff, managerAddress, true, false);

    // Check final state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to freeze the manager of a namespace that doesn't exist", () => {
    callFreezeManager(
      namespaceBuff,
      managerAddress,
      ERR_NAMESPACE_NOT_FOUND,
      true
    );
  });

  it("This should fail to freeze the manager of an unmanaged namespace", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callFreezeManager(
      namespaceBuff,
      managerAddress,
      ERR_NO_NAMESPACE_MANAGER,
      true
    );

    // Check final state (should be unchanged)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to freeze the manager of a namespace if the manager is not the contract-caller", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callFreezeManager(namespaceBuff, address1, ERR_NOT_AUTHORIZED, true);

    // Check final state (should be unchanged)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-PREORDER FUNCTION", () => {
  it("This should successfully preorder a Namespace", () => {
    callPreorderAValidNamespace(
      namespaceBuffSalt,
      1000000000,
      address1,
      146,
      false
    );
  });

  it("This should fail to preorder a Namespace if hash malformed", () => {
    callPreorderAValidNamespace(
      namespaceBuff,
      1000000000,
      address1,
      ERR_HASH_MALFORMED,
      true
    );
  });

  it("This should fail to preorder a Namespace if preordered before", () => {
    callPreorderAValidNamespace(
      namespaceBuffSalt,
      1000000000,
      address1,
      146,
      false
    );

    callPreorderAValidNamespace(
      namespaceBuffSalt,
      1000000000,
      address2,
      ERR_PREORDERED_BEFORE,
      true
    );
  });

  it("This should fail to preorder a Namespace if no stx burnt", () => {
    callPreorderAValidNamespace(
      namespaceBuffSalt,
      0,
      address1,
      ERR_STX_BURNT_INSUFFICIENT,
      true
    );
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-REVEAL FUNCTION", () => {
  it("This should successfully reveal a Namespace without a manager", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check final state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should successfully reveal a Namespace with a manager", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check final state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail if no namespace preorder", () => {
    simnet.mineEmptyBlock();

    callRevealNamespace(
      namespaceBuff,
      saltBuff,
      1,
      1,
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      1,
      1,
      5000,
      address1,
      managerAddress,
      false,
      true,
      false,
      address1,
      ERR_PREORDER_NOT_FOUND,
      true
    );
  });

  it("This should fail if the namespace contains invalid characters", () => {
    callPreorderAValidNamespace(
      invalidNamespaceBuffSalt,
      1000000000000,
      address1,
      146,
      false
    );
    simnet.mineEmptyBlock();

    callRevealNamespace(
      invalidNamespaceBuff,
      saltBuff,
      1,
      1,
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      1,
      1,
      5000,
      address1,
      managerAddress,
      false,
      true,
      false,
      address1,
      ERR_CHARSET_INVALID,
      true
    );
  });

  it("This should fail if the namespace already exists", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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
    simnet.mineEmptyBlock();

    // Check state after first reveal
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callRevealNamespace(
      namespaceBuff,
      saltBuff,
      1,
      1,
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      1,
      1,
      5000,
      address1,
      null,
      true,
      false,
      true,
      address1,
      ERR_NAMESPACE_ALREADY_EXISTS,
      true
    );

    // Check final state (should remain unchanged from first reveal)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail if burned stx is not enough for the price", () => {
    callPreorderAValidNamespace(namespaceBuffSalt, 10, address1, 146, false);
    simnet.mineEmptyBlock();

    // Check initial state

    callRevealNamespace(
      namespaceBuff,
      saltBuff,
      1,
      1,
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      1,
      1,
      5000,
      address1,
      managerAddress,
      false,
      true,
      false,
      address1,
      ERR_STX_BURNT_INSUFFICIENT,
      true
    );
  });

  it("This should fail if TTL has passed to reveal a namespace", () => {
    callPreorderAValidNamespace(
      namespaceBuffSalt,
      1000000000,
      address1,
      146,
      false
    );
    simnet.mineEmptyBlocks(148);
    simnet.mineEmptyBlock();

    callRevealNamespace(
      namespaceBuff,
      saltBuff,
      1,
      1,
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      1,
      1,
      5000,
      address1,
      managerAddress,
      false,
      true,
      false,
      address1,
      ERR_PREORDER_CLAIMABILITY_EXPIRED,
      true
    );
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-LAUNCH FUNCTION", () => {
  it("This should successfully launch a Namespace without a manager", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check state before launch
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callLaunchNamespace(namespaceBuff, address1, true, false);

    // Check state after launch
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should successfully launch a Namespace with a manager", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check state before launch
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callLaunchNamespace(namespaceBuff, address1, true, false);

    // Check state after launch
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to launch a Namespace that doesn't exist", () => {
    callLaunchNamespace(namespaceBuff, address1, ERR_NAMESPACE_NOT_FOUND, true);
  });

  it("This should fail to launch a Namespace when called by a different address than the import address assigned in the namespace-reveal", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check state before attempted launch
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callLaunchNamespace(
      namespaceBuff,
      address3,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );

    // Check state after failed launch attempt (should remain unchanged)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to launch a Namespace that has already been launched", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check state after first launch
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callLaunchNamespace(
      namespaceBuff,
      address1,
      ERR_NAMESPACE_ALREADY_LAUNCHED,
      true
    );

    // Check state after failed second launch attempt (should remain unchanged)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to launch a Namespace that TTL has already expired", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check state before TTL expiration
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    simnet.mineEmptyBlocks(52596);
    callLaunchNamespace(
      namespaceBuff,
      address1,
      ERR_NAMESPACE_PREORDER_LAUNCHABILITY_EXPIRED,
      true
    );

    // Check state after failed launch attempt (should remain unchanged except for block height)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": null,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("TURN-OFF-MANAGER-TRANSFERS FUNCTIONS", () => {
  it("This should successfully turn off manager-transfers when called by the manager from a managed namespace", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callTurnOffManagerTransfers(namespaceBuff, managerAddress, true, false);

    // Check final state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": false, // This should now be false
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to turn off transfers of a non-existent namespace", () => {
    callTurnOffManagerTransfers(
      namespaceBuff,
      address1,
      ERR_NAMESPACE_NOT_FOUND,
      true
    );
  });

  it("This should fail to turn off manager transfers from an unmanaged namespace", () => {
    successfullyFastClaimANameInAnUnmanagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callTurnOffManagerTransfers(
      namespaceBuff,
      address1,
      ERR_NO_NAMESPACE_MANAGER,
      true
    );

    // Check final state (should remain unchanged)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to turn off manager transfers from a managed namespace if contract-caller is not manager", () => {
    successfullyFastClaimANameInAManagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callTurnOffManagerTransfers(
      namespaceBuff,
      address1,
      ERR_NOT_AUTHORIZED,
      true
    );

    // Check final state (should remain unchanged)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAME-IMPORT FUNCTION", () => {
  it("This should successfully import a name", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check initial state
    callGetBnsInfo(name1Buff, namespaceBuff, null);
    callGetOwner(1, null);
    callGetPrimaryName(address3, null);

    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address3,
      address1,
      true,
      false
    );

    // Check final state
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address3,
    });
    callGetOwner(1, address3);
    callGetPrimaryName(address3, 1);
  });

  it("This should successfully import multiple names", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Import first name
    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address3,
      address1,
      true,
      false
    );

    // Import second name
    callImportName(
      namespaceBuff,
      name2Buff,
      zonefileBuff,
      address3,
      address1,
      true,
      false
    );

    // Check final state
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address3,
    });
    callGetBnsInfo(name2Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 6,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address3,
    });
    callGetOwner(1, address3);
    callGetOwner(2, address3);
    callGetPrimaryName(address3, 1);
  });

  it("This should fail to import a name if no namespace", () => {
    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address3,
      address1,
      ERR_NAMESPACE_NOT_FOUND,
      true
    );
  });

  it("This should fail to import the same name twice", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Import first name
    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address3,
      address1,
      true,
      false
    );

    // Import second name
    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address3,
      address1,
      ERR_NAME_NOT_AVAILABLE,
      true
    );

    // Check final state
    callGetBnsInfo(name1Buff, namespaceBuff, {
      "registered-at": null,
      "imported-at": 5,
      "revoked-at": false,
      "zonefile-hash": zonefileBuff,
      "hashed-salted-fqn-preorder": null,
      "preordered-by": null,
      "renewal-height": 0,
      "stx-burn": 10,
      owner: address3,
    });
    callGetOwner(1, address3);
    callGetPrimaryName(address3, 1);
  });

  it("This should fail to import a name, if the name has invalid characters", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check initial state
    callGetBnsInfo(invalidNameBuff, namespaceBuff, null);

    callImportName(
      namespaceBuff,
      invalidNameBuff,
      zonefileBuff,
      address3,
      address1,
      ERR_CHARSET_INVALID,
      true
    );

    // Check final state (should remain unchanged)
    callGetBnsInfo(invalidNameBuff, namespaceBuff, null);
  });

  it("This should fail to import a name if the tx-sender is not the import address", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check initial state
    callGetBnsInfo(name1Buff, namespaceBuff, null);

    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address3,
      address3,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );

    // Check final state (should remain unchanged)
    callGetBnsInfo(name1Buff, namespaceBuff, null);
  });

  it("This should fail to import a name in a launched namespace", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

    // Check initial state
    callGetBnsInfo(name1Buff, namespaceBuff, null);
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address3,
      address1,
      ERR_NAMESPACE_ALREADY_LAUNCHED,
      true
    );

    // Check final state (should remain unchanged)
    callGetBnsInfo(name1Buff, namespaceBuff, null);
  });

  it("This should fail to import a name if the namespace launchability TTL has passed", () => {
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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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
    simnet.mineEmptyBlocks(52596);

    // Check initial state
    callGetBnsInfo(name1Buff, namespaceBuff, null);

    callImportName(
      namespaceBuff,
      name1Buff,
      zonefileBuff,
      address3,
      address1,
      ERR_NAMESPACE_PREORDER_LAUNCHABILITY_EXPIRED,
      true
    );

    // Check final state (should remain unchanged)
    callGetBnsInfo(name1Buff, namespaceBuff, null);
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAMESPACE-UPDATE-PRICE FUNCTION", () => {
  it("This should successfully update the price in a namespace", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callNamespaceUpdatePrice(
      namespaceBuff,
      2,
      2,
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      2,
      2,
      address1,
      true,
      false
    );

    // Check final state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(2),
        base: 2,
        coeff: 2,
        "nonalpha-discount": 2,
        "no-vowel-discount": 2,
      },
    });
  });

  it("This should successfully update the price multiple times", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // First update
    callNamespaceUpdatePrice(
      namespaceBuff,
      2,
      2,
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      2,
      2,
      address1,
      true,
      false
    );

    // Check state after first update
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(2),
        base: 2,
        coeff: 2,
        "nonalpha-discount": 2,
        "no-vowel-discount": 2,
      },
    });

    // Second update
    callNamespaceUpdatePrice(
      namespaceBuff,
      3,
      3,
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      3,
      3,
      address1,
      true,
      false
    );

    // Check state after second update
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(3),
        base: 3,
        coeff: 3,
        "nonalpha-discount": 3,
        "no-vowel-discount": 3,
      },
    });
  });
  it("This should successfully update the price in a managed namespace when called by the manager", () => {
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
      true,
      true,
      false,
      address1,
      true,
      false
    );
    callLaunchNamespace(namespaceBuff, address1, true, false);

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callNamespaceUpdatePrice(
      namespaceBuff,
      2,
      2,
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      2,
      2,
      managerAddress,
      true,
      false
    );

    // Check final state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(2),
        base: 2,
        coeff: 2,
        "nonalpha-discount": 2,
        "no-vowel-discount": 2,
      },
    });
  });

  it("This should fail to update the price in a namespace, that doesn't exist", () => {
    callNamespaceUpdatePrice(
      namespaceBuff,
      2,
      2,
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      2,
      2,
      address1,
      ERR_NAMESPACE_NOT_FOUND,
      true
    );
  });

  it("This should fail to update the price in a managed namespace when called by the import address", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callNamespaceUpdatePrice(
      namespaceBuff,
      2,
      2,
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      2,
      2,
      address1,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );

    // Check final state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to update the price in a namespace when called by an unauthorized address", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callNamespaceUpdatePrice(
      namespaceBuff,
      2,
      2,
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      2,
      2,
      address3,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );

    // Check final state (should remain unchanged)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": true,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to update the price in a namespace that doesn't allow price namespace changes", () => {
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    callNamespaceFreezePrice(namespaceBuff, address1, true, false);

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callNamespaceUpdatePrice(
      namespaceBuff,
      2,
      2,
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      2,
      2,
      address1,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );

    // Check final state (should remain unchanged)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": null,
      "manager-transferable": false,
      "manager-frozen": true,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 5000,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to update the price in a managed namespace when called by an unauthorized address", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callNamespaceUpdatePrice(
      namespaceBuff,
      2,
      2,
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      2,
      2,
      address3,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );

    // Check final state (should remain unchanged)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });

  it("This should fail to update the price in a managed namespace that doesn't allow price namespace changes", () => {
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callNamespaceFreezePrice(namespaceBuff, managerAddress, true, false);

    // Check initial state
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });

    callNamespaceUpdatePrice(
      namespaceBuff,
      2,
      2,
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      2,
      2,
      managerAddress,
      ERR_OPERATION_UNAUTHORIZED,
      true
    );

    // Check final state (should remain unchanged)
    callGetNamespaceProperties(namespaceBuff, {
      "namespace-manager": managerAddress,
      "manager-transferable": true,
      "manager-frozen": false,
      "namespace-import": address1,
      "revealed-at": 4,
      "launched-at": 5,
      lifetime: 0,
      "can-update-price-function": false,
      "price-function": {
        buckets: new Array(16).fill(1),
        base: 1,
        coeff: 1,
        "nonalpha-discount": 1,
        "no-vowel-discount": 1,
      },
    });
  });
});

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("NAMESPACE-FREEZE-PRICE FUNCTION", () => {
//   it("This should successfully update the can-update-price-function of a namespace", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     callNamespaceFreezePrice(namespaceBuff, address1, true, false);
//   });

//   it("This should fail to update the can-update-price-function of a namespace if no namespace", () => {
//     callNamespaceFreezePrice(
//       namespaceBuff,
//       address1,
//       ERR_NAMESPACE_NOT_FOUND,
//       true
//     );
//   });

//   it("This should fail to update the can-update-price-function of a namespace if the tx-sender is not the import address", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     callNamespaceFreezePrice(
//       namespaceBuff,
//       address3,
//       ERR_OPERATION_UNAUTHORIZED,
//       true
//     );
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("NAME-CLAIM-FAST FUNCTION", () => {
//   it("This should successfully fast mint a name on a launched namespace without a manager", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address1,
//       address1,
//       1,
//       false
//     );
//   });

//   it("This should successfully fast mint a name on a launched namespace with a manager", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       1,
//       false
//     );
//   });

//   it("This should successfully fast mint two names on a launched namespace without a manager", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address1,
//       address1,
//       1,
//       false
//     );
//     callFastClaimName(
//       name2Buff,
//       namespaceBuff,
//       zonefile2Buff,
//       address1,
//       address1,
//       2,
//       false
//     );
//   });

//   it("This should successfully fast mint two names on a launched namespace with a manager", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       1,
//       false
//     );
//     callFastClaimName(
//       name2Buff,
//       namespaceBuff,
//       zonefile2Buff,
//       address1,
//       managerAddress,
//       2,
//       false
//     );
//   });

//   it("This should fail to fast mint name on a namespace that doesn't exist", () => {
//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address1,
//       address1,
//       ERR_NAMESPACE_NOT_FOUND,
//       true
//     );
//   });

//   it("This should fail to fast mint a name that is already claimed", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       1,
//       false
//     );
//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       ERR_NAME_NOT_AVAILABLE,
//       true
//     );
//   });

//   it("This should fail to fast mint name on a launched namespace with a manager when the contract-caller is not the manager", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address1,
//       address1,
//       ERR_NOT_AUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to fast mint a name on a launched namespace without a manager when the tx-sender is not the send-to address", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address3,
//       address1,
//       ERR_NOT_AUTHORIZED,
//       true
//     );
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("NAME-PREORDER FUNCTION", () => {
//   it("This should successfully preorder a name on a launched namespace without a manager", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);
//   });

//   it("This should successfully preorder a name on a launched namespace with a manager even though this is not the intended use", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callManagedPreorderName(name1BuffSalt, managerAddress, 150, false);
//   });

//   it("This should fail to preorder a name if hash is malformed", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callPreorderName(name1Buff, 200000000, address1, ERR_HASH_MALFORMED, true);
//   });

//   it("This should fail to preorder a name if stx to burn 0", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callPreorderName(
//       name1BuffSalt,
//       0,
//       address1,
//       ERR_STX_BURNT_INSUFFICIENT,
//       true
//     );
//   });

//   it("This should fail to preorder a name if stx to burn not enough in balance of user", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callPreorderName(name1BuffSalt, 9007199254740991, address1, 1, true);
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("NAME-REGISTER FUNCTION", () => {
//   it("This should succesfully register a name on an unmanaged namespace", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);

//     simnet.mineEmptyBlock();

//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       1,
//       false
//     );
//   });

//   it("This should succesfully register a name on an unmanaged namespace even if someone preordered it after me", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);

//     callPreorderName(name1BuffDifferentSalt, 200000000, address3, 151, false);

//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       1,
//       false
//     );
//   });

//   it("This should succesfully register a name on an unmanaged namespace even if someone preordered it after me and registered before me", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);

//     callPreorderName(name1BuffDifferentSalt, 200000000, address3, 151, false);

//     simnet.mineEmptyBlock();

//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff2,
//       zonefileBuff,
//       address3,
//       1,
//       false
//     );

//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       1,
//       false
//     );
//   });

//   it("This should succesfully register a name on an unmanaged namespace even if someone fastclaimed it after I made the preorder", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);

//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address3,
//       address3,
//       1,
//       false
//     );

//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       1,
//       false
//     );
//   });

//   it("This should succesfully register 2 different names", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);

//     simnet.mineEmptyBlock();

//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       1,
//       false
//     );

//     callPreorderName(name2BuffSalt, 200000000, address1, 153, false);

//     simnet.mineEmptyBlock();

//     callRegisterName(
//       namespaceBuff,
//       name2Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       2,
//       false
//     );
//   });

//   it("This should fail to register a name if no name-preorder", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       ERR_PREORDER_NOT_FOUND,
//       true
//     );
//   });

//   it("This should fail to register a name if no namespace", () => {
//     callPreorderName(name1BuffSalt, 200000000, address1, 146, false);

//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       ERR_NAMESPACE_NOT_FOUND,
//       true
//     );
//   });

//   it("This should fail to register a name if the namespace has a manager", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );

//     simnet.mineEmptyBlock();

//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );

//     callLaunchNamespace(namespaceBuff, address1, true, false);

//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);

//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       ERR_NOT_AUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to register a name if name already exists", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);
//     simnet.mineEmptyBlock();
//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       1,
//       false
//     );
//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       ERR_OPERATION_UNAUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to register a name if name was preordered before my preorder and registered by the principal of the first preorder", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callPreorderName(name1BuffDifferentSalt, 200000000, address3, 150, false);
//     callPreorderName(name1BuffSalt, 200000000, address1, 151, false);
//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff2,
//       zonefileBuff,
//       address3,
//       1,
//       false
//     );
//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       ERR_PREORDERED_BEFORE,
//       true
//     );
//   });

//   it("This should fail to register a name if name was fast claimed before my preorder", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callFastClaimName(
//       name1Buff,
//       namespaceBuff,
//       zonefileBuff,
//       address3,
//       address3,
//       1,
//       false
//     );
//     callPreorderName(name1BuffSalt, 200000000, address1, 151, false);
//     simnet.mineEmptyBlock();
//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       ERR_FAST_MINTED_BEFORE,
//       true
//     );
//   });

//   it("This should fail to register a name if name was preordered before namespace launch", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);
//     simnet.mineEmptyBlocks(150);
//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       ERR_PREORDER_CLAIMABILITY_EXPIRED,
//       true
//     );
//   });

//   it("This should fail to register a name if burned STX was not enough, this should also act as a blocker to preorder a name with mng-name-preorder", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callPreorderName(name1BuffSalt, 1, address1, 150, false);
//     simnet.mineEmptyBlock();
//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       ERR_STX_BURNT_INSUFFICIENT,
//       true
//     );
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("CLAIM-PREORDER FUNCTION", () => {
//   it("This should succesfully claim the stx from a preorder that has not been claimed by the owner of the preorder", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);
//     simnet.mineEmptyBlock();
//     simnet.mineEmptyBlocks(144);
//     callClaimPreorder(name1BuffSalt, address1, true, false);
//   });

//   it("This should fail to claim the stx from a preorder that has been claimed by the owner of the preorder", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);
//     simnet.mineEmptyBlock();
//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       1,
//       false
//     );
//     callClaimPreorder(
//       name1BuffSalt,
//       address1,
//       ERR_OPERATION_UNAUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to claim the stx from a preorder that does not exist", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callClaimPreorder(name1BuffSalt, address1, ERR_PREORDER_NOT_FOUND, true);
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("MNG-NAME-PREORDER FUNCTION", () => {
//   it("This should successfully preorder a name on a launched namespace without a manager even though it is not its intended use", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedPreorderName(name1BuffSalt, address1, 150, false);
//   });

//   it("This should successfully preorder a name on a launched namespace with a manager", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedPreorderName(name1BuffSalt, managerAddress, 150, false);
//   });

//   it("This should fail to preorder a name if hash is malformed", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedPreorderName(
//       name1Buff,
//       managerAddress,
//       ERR_HASH_MALFORMED,
//       true
//     );
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("MNG-NAME-REGISTER FUNCTION", () => {
//   it("This should successfully register a name in a managed namespace", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedPreorderName(name1BuffSalt, managerAddress, 150, false);
//     callManagedRegisterNameWithAddress(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       1,
//       false
//     );
//   });

//   it("This should succesfully register 2 different names in a managed namespace", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedPreorderName(name1BuffSalt, managerAddress, 150, false);
//     callManagedRegisterNameWithAddress(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       1,
//       false
//     );
//     callManagedPreorderName(name2BuffSalt, managerAddress, 152, false);
//     callManagedRegisterNameWithAddress(
//       namespaceBuff,
//       name2Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       2,
//       false
//     );
//   });

//   it("This should fail to register a name if the namespace has no manager", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedPreorderName(name1BuffSalt, managerAddress, 150, false);
//     callManagedRegisterNameWithAddress(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       ERR_NO_NAMESPACE_MANAGER,
//       true
//     );
//   });

//   it("This should fail to register a name if no name-preorder", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedRegisterNameWithAddress(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       ERR_PREORDER_NOT_FOUND,
//       true
//     );
//   });

//   it("This should fail to register a name in a managed namespace if contract-caller not the manager", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedPreorderName(name1BuffSalt, address1, 150, false);
//     callManagedRegisterNameWithAddress(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       address1,
//       ERR_PREORDER_NOT_FOUND,
//       true
//     );
//   });

//   it("This should fail to register a name if name already exists", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedPreorderName(name1BuffSalt, managerAddress, 150, false);
//     callManagedRegisterNameWithAddress(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       1,
//       false
//     );
//     simnet.mineEmptyBlocks(144);
//     callManagedPreorderName(name1BuffDifferentSalt, managerAddress, 296, false);
//     callManagedRegisterNameWithAddress(
//       namespaceBuff,
//       name1Buff,
//       saltBuff2,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       ERR_NAME_NOT_AVAILABLE,
//       true
//     );
//   });

//   it("This should fail to register a name if name was preordered before namespace launch", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callManagedPreorderName(name1BuffSalt, managerAddress, 149, false);
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedRegisterNameWithAddress(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       ERR_NAME_PREORDERED_BEFORE_NAMESPACE_LAUNCH,
//       true
//     );
//   });

//   it("This should fail to register a name if TTL has passed", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callManagedPreorderName(name1BuffSalt, managerAddress, 150, false);
//     simnet.mineEmptyBlocks(150);
//     callManagedRegisterNameWithAddress(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       managerAddress,
//       ERR_PREORDER_CLAIMABILITY_EXPIRED,
//       true
//     );
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("UPDATE-ZONEFILE-HASH FUNCTION", () => {
//   it("This should successfully update the zonefile hash of a name in an unmanaged namespace", () => {
//     successfullyFastClaimANameInAnUnmanagedNamespace();
//     callUpdateZonefileHash(
//       namespaceBuff,
//       name1Buff,
//       zonefile2Buff,
//       address1,
//       true,
//       false
//     );
//   });

//   it("This should successfully update the zonefile hash of a name in a managed namespace", () => {
//     successfullyTwoStepRegisterANameInAManagedNamespace();
//     callUpdateZonefileHash(
//       namespaceBuff,
//       name1Buff,
//       zonefile2Buff,
//       address1,
//       true,
//       false
//     );
//   });

//   it("This should fail to update the zonefile hash of a nonexistent name", () => {
//     callUpdateZonefileHash(
//       namespaceBuff,
//       name1Buff,
//       zonefile2Buff,
//       managerAddress,
//       ERR_NO_NAME,
//       true
//     );
//   });

//   it("This should fail to update the zonefile hash if the zonefile is the same", () => {
//     successfullyTwoStepRegisterANameInAManagedNamespace();
//     callUpdateZonefileHash(
//       namespaceBuff,
//       name1Buff,
//       zonefileBuff,
//       managerAddress,
//       ERR_OPERATION_UNAUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to update the zonefile hash if the name is revoked", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     callRevokeName(namespaceBuff, name1Buff, address1, true, false);
//     callUpdateZonefileHash(
//       namespaceBuff,
//       name1Buff,
//       zonefile2Buff,
//       address1,
//       ERR_NAME_REVOKED,
//       true
//     );
//   });

//   it("This should fail to update the zonefile hash of a name in an unmanaged namespace when the tx-sender is not the owner", () => {
//     successfullyFastClaimANameInAnUnmanagedNamespace();
//     callUpdateZonefileHash(
//       namespaceBuff,
//       name1Buff,
//       zonefile2Buff,
//       address3,
//       ERR_NOT_AUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to update the zonefile hash of a name in a managed namespace when the contract-caller is not the owner", () => {
//     successfullyTwoStepRegisterANameInAManagedNamespace();
//     callUpdateZonefileHash(
//       namespaceBuff,
//       name1Buff,
//       zonefile2Buff,
//       managerAddress,
//       ERR_NOT_AUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to update the zonefile hash of a name if the name is not in a valid grace period", () => {
//     successfullyTwoStepRegisterANameInAManagedNamespace();
//     simnet.mineEmptyBlocks(11000);
//     callUpdateZonefileHash(
//       namespaceBuff,
//       name1Buff,
//       zonefile2Buff,
//       address1,
//       ERR_OPERATION_UNAUTHORIZED,
//       true
//     );
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("NAME-REVOKE FUNCTION", () => {
//   it("This should successfully revoke a name in an unmanaged namespace", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     callRevokeName(namespaceBuff, name1Buff, address1, true, false);
//   });

//   it("This should successfully revoke a name in a managed namespace", () => {
//     successfullyTwoStepRegisterANameInAManagedNamespace();
//     callRevokeName(namespaceBuff, name1Buff, managerAddress, true, false);
//   });

//   it("This should fail to revoke a name in a namespace that does not exist", () => {
//     callRevokeName(
//       namespaceBuff,
//       name1Buff,
//       managerAddress,
//       ERR_NAMESPACE_NOT_FOUND,
//       true
//     );
//   });

//   it("This should fail to revoke a name in a managed namespace but the contract-caller is not the manager", () => {
//     successfullyTwoStepRegisterANameInAManagedNamespace();
//     callRevokeName(
//       namespaceBuff,
//       name1Buff,
//       address1,
//       ERR_NOT_AUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to revoke a name in an unmanaged namespace but the tx-sender is not the import address", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     callRevokeName(
//       namespaceBuff,
//       name1Buff,
//       address3,
//       ERR_NOT_AUTHORIZED,
//       true
//     );
//   });
// });

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// describe("NAME-RENEWAL FUNCTION", () => {
//   it("This should successfully renew a name in an unmanaged namespace when the name is still within the lifetime", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     callRenewName(namespaceBuff, name1Buff, null, address1, true, false);
//   });

//   it("This should successfully renew a name in an unmanaged namespace when the name is within the grace period", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     simnet.mineEmptyBlocks(6000);
//     callRenewName(namespaceBuff, name1Buff, null, address1, true, false);
//   });

//   it("This should successfully renew a name in an unmanaged namespace when the name is not in the grace period by the owner", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     simnet.mineEmptyBlocks(11000);
//     callRenewName(namespaceBuff, name1Buff, null, address1, true, false);
//   });

//   it("This should successfully renew a name in an unmanaged namespace when the name is not in the grace period by a different address than the owner", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     simnet.mineEmptyBlocks(11000);
//     callRenewName(namespaceBuff, name1Buff, null, address3, true, false);
//   });

//   it("This should fail to renew a name in an unmanaged namespace when the name does not exist", () => {
//     callRenewName(namespaceBuff, name1Buff, null, address1, ERR_NO_NAME, true);
//   });

//   it("This should fail to renew a name in a managed namespace", () => {
//     successfullyTwoStepRegisterANameInAManagedNamespace();
//     callRenewName(
//       namespaceBuff,
//       name1Buff,
//       null,
//       address1,
//       ERR_NAMESPACE_HAS_MANAGER,
//       true
//     );
//   });

//   it("This should fail to renew a name if the namespace is not launched", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       new Array(16).fill(1),
//       1,
//       1,
//       5000,
//       address1,
//       managerAddress,
//       false,
//       true,
//       false,
//       address1,
//       true,
//       false
//     );
//     callImportName(
//       namespaceBuff,
//       name1Buff,
//       zonefileBuff,
//       address3,
//       address1,
//       true,
//       false
//     );
//     callRenewName(
//       namespaceBuff,
//       name1Buff,
//       null,
//       address1,
//       ERR_NAMESPACE_NOT_LAUNCHED,
//       true
//     );
//   });

//   it("This should fail to renew a name if the namespace does not require renewals", () => {
//     callPreorderAValidNamespace(
//       namespaceBuffSalt,
//       1000000000,
//       address1,
//       146,
//       false
//     );
//     simnet.mineEmptyBlock();
//     callRevealNamespace(
//       namespaceBuff,
//       saltBuff,
//       1,
//       1,
//       new Array(16).fill(1),
//       1,
//       1,
//       0,
//       address1,
//       null,
//       true,
//       false,
//       true,
//       address1,
//       true,
//       false
//     );
//     callLaunchNamespace(namespaceBuff, address1, true, false);
//     callPreorderName(name1BuffSalt, 200000000, address1, 150, false);
//     simnet.mineEmptyBlock();
//     callRegisterName(
//       namespaceBuff,
//       name1Buff,
//       saltBuff,
//       zonefileBuff,
//       address1,
//       1,
//       false
//     );
//     callRenewName(
//       namespaceBuff,
//       name1Buff,
//       null,
//       address1,
//       ERR_OPERATION_UNAUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to renew a name if the owner is not the tx-sender and the name is in its current grace period", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     simnet.mineEmptyBlocks(7500);
//     callRenewName(
//       namespaceBuff,
//       name1Buff,
//       null,
//       address3,
//       ERR_NOT_AUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to renew a name if the owner is not the tx-sender and the name is in its current lifetime", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     callRenewName(
//       namespaceBuff,
//       name1Buff,
//       null,
//       address3,
//       ERR_NOT_AUTHORIZED,
//       true
//     );
//   });

//   it("This should fail to renew a name if the name is revoked", () => {
//     successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
//     callRevokeName(namespaceBuff, name1Buff, address1, true, false);
//     callRenewName(
//       namespaceBuff,
//       name1Buff,
//       null,
//       address1,
//       ERR_NAME_REVOKED,
//       true
//     );
//   });
// });
