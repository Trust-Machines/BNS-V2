import { describe, it } from "vitest";
import { initSimnet } from "@hirosystems/clarinet-sdk";
import {
  name1Buff,
  namespaceBuff,
  name1BuffSalt,
  ERR_NAMESPACE_NOT_FOUND,
  name2Buff,
} from "./BNS-V2.helper";
import {
  successfullyTwoStepRegisterANameInAnUnmanagedNamespace,
  successfullyTwoStepRegisterANameInAManagedNamespace,
  successfullyFastClaimANameInAnUnmanagedNamespace,
  successfullyFastClaimANameInAManagedNamespace,
  callGetBnsInfo,
  callFlipSwitch,
  callTransferName,
} from "./BNS-V2.functions";
import {
  callResolveZonefile,
  callRevokeName,
  callUpdateZonefileHash,
} from "./zonefile-resolver.functions";
import {
  ERR_INVALID_PERIOD,
  ERR_NAME_REVOKED,
  ERR_NO_NAME,
  ERR_NO_NAMESPACE,
  ERR_NO_ZONEFILE_FOUND,
  ERR_NOT_AUTHORIZED,
  zonefile2Buff,
  zonefileBuff,
} from "./zonefile-resolver.helper";

const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address3 = accounts.get("wallet_3")!;
const managerAddress = accounts.get("wallet_2")!;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("UPDATE-ZONEFILE-HASH FUNCTION", () => {
  it("This should successfully update the zonefile hash of a name in an unmanaged namespace", () => {
    callFlipSwitch();
    successfullyFastClaimANameInAnUnmanagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefileBuff,
      address1,
      true,
      false
    );
    callResolveZonefile(name1Buff, namespaceBuff, zonefileBuff, false);
  });

  it("This should successfully update the zonefile hash of a name in a managed namespace", () => {
    callFlipSwitch();
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefileBuff,
      managerAddress,
      true,
      false
    );
    callResolveZonefile(name1Buff, namespaceBuff, zonefileBuff, false);
  });

  it("This should fail to update the zonefile hash of a nonexistent name", () => {
    callFlipSwitch();
    successfullyFastClaimANameInAManagedNamespace();
    callResolveZonefile(name2Buff, namespaceBuff, ERR_NO_NAME, true);
    callUpdateZonefileHash(
      name2Buff,
      namespaceBuff,
      zonefileBuff,
      managerAddress,
      ERR_NO_NAME,
      true
    );
    callResolveZonefile(name2Buff, namespaceBuff, ERR_NO_NAME, true);
  });

  it("This should fail to update the zonefile hash if the name is revoked", () => {
    callFlipSwitch();
    successfullyFastClaimANameInAnUnmanagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefileBuff,
      address1,
      true,
      false
    );
    callRevokeName(name1Buff, namespaceBuff, address1, true, false);
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NAME_REVOKED, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefile2Buff,
      address1,
      ERR_NAME_REVOKED,
      true
    );
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NAME_REVOKED, true);
  });

  it("This should fail to update the zonefile hash of a name in an unmanaged namespace when the tx-sender is not the owner", () => {
    callFlipSwitch();
    successfullyFastClaimANameInAnUnmanagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefileBuff,
      address3,
      ERR_NOT_AUTHORIZED,
      true
    );
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
  });

  it("This should fail to update the zonefile hash of a name in a managed namespace when the contract-caller is the owner", () => {
    callFlipSwitch();
    successfullyFastClaimANameInAManagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefileBuff,
      address1,
      ERR_NOT_AUTHORIZED,
      true
    );
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
  });

  it("This should fail to update the zonefile hash of a name if the name is not in a valid grace period and it should not resolve after valid period", () => {
    callFlipSwitch();
    successfullyFastClaimANameInAnUnmanagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefileBuff,
      address1,
      true,
      false
    );
    callResolveZonefile(name1Buff, namespaceBuff, zonefileBuff, false);

    simnet.mineEmptyBlocks(11000);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefile2Buff,
      address1,
      ERR_INVALID_PERIOD,
      true
    );
    callResolveZonefile(name1Buff, namespaceBuff, ERR_INVALID_PERIOD, true);
  });

  it("This should fail to resolve the zonefile of a name if the name was transfered", () => {
    callFlipSwitch();
    successfullyFastClaimANameInAnUnmanagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefileBuff,
      address1,
      true,
      false
    );
    callResolveZonefile(name1Buff, namespaceBuff, zonefileBuff, false);
    callTransferName(1, address1, address3, address1, true, false);
    callResolveZonefile(name1Buff, namespaceBuff, null, false);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefile2Buff,
      address3,
      true,
      false
    );
    callResolveZonefile(name1Buff, namespaceBuff, zonefile2Buff, false);
  });

  it("This should succesfully update the zonefile hash of a name if the name is not in a valid grace period and it should resolve after valid period in managed namespaces", () => {
    callFlipSwitch();
    successfullyFastClaimANameInAManagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefileBuff,
      managerAddress,
      true,
      false
    );
    callResolveZonefile(name1Buff, namespaceBuff, zonefileBuff, false);
    simnet.mineEmptyBlocks(11000);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefile2Buff,
      managerAddress,
      true,
      false
    );
    callResolveZonefile(name1Buff, namespaceBuff, zonefile2Buff, false);
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe("NAME-REVOKE FUNCTION", () => {
  it("This should successfully revoke a name in an unmanaged namespace", () => {
    callFlipSwitch();
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callRevokeName(name1Buff, namespaceBuff, address1, true, false);
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NAME_REVOKED, true);
  });

  it("This should successfully revoke a name in a managed namespace", () => {
    callFlipSwitch();
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callRevokeName(name1Buff, namespaceBuff, managerAddress, true, false);
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NAME_REVOKED, true);
  });

  it("This should fail to revoke a name in a namespace that does not exist", () => {
    callFlipSwitch();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_NAME, true);
    callRevokeName(
      name1Buff,
      namespaceBuff,
      managerAddress,
      ERR_NAMESPACE_NOT_FOUND,
      true
    );
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_NAME, true);
  });

  it("This should fail to revoke a name in a managed namespace but the contract-caller is not the manager", () => {
    callFlipSwitch();
    successfullyTwoStepRegisterANameInAManagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefileBuff,
      managerAddress,
      true,
      false
    );
    callRevokeName(
      name1Buff,
      namespaceBuff,
      address1,
      ERR_NOT_AUTHORIZED,
      true
    );
    callResolveZonefile(name1Buff, namespaceBuff, zonefileBuff, false);
  });

  it("This should fail to revoke a name in an unmanaged namespace since the tx-sender is not the import address or the owner", () => {
    callFlipSwitch();
    successfullyTwoStepRegisterANameInAnUnmanagedNamespace();
    callResolveZonefile(name1Buff, namespaceBuff, ERR_NO_ZONEFILE_FOUND, true);
    callUpdateZonefileHash(
      name1Buff,
      namespaceBuff,
      zonefileBuff,
      address1,
      true,
      false
    );
    callRevokeName(
      name1Buff,
      namespaceBuff,
      address3,
      ERR_NOT_AUTHORIZED,
      true
    );
    callResolveZonefile(name1Buff, namespaceBuff, zonefileBuff, false);
  });
});
