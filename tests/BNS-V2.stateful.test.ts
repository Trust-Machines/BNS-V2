import fc from "fast-check";
import { it } from "vitest";

import { GetLastTokenId } from "./state/GetLastTokenId.ts";
import { GetOwnerNone } from "./state/GetOwnerNone.ts";
import { GetBnsFromIdNone } from "./state/GetBnsFromIdNone.ts";
import { GetPrimaryNameNone } from "./state/GetPrimaryNameNone.ts";
import { GetNamespacePropertiesErr } from "./state/GetNamespacePropertiesErr.ts";
import { GetNamespacePrice } from "./state/GetNamespacePrice.ts";
import { CanNamespaceBeRegisteredTrue } from "./state/CanNamespaceBeRegistered.ts";
import { NamespacePreorder } from "./state/NamespacePreorder.ts";
import { NamespaceReveal } from "./state/NamespaceReveal.ts";
import { GetBnsInfoNone } from "./state/GetBnsInfoNone.ts";
import { MngNamePreorder } from "./state/MngNamePreorder.ts";
import { NamespaceLaunch } from "./state/NamespaceLaunch.ts";

it("executes BNS-V2 state interactions", async () => {
  const excludedAccounts = ["faucet", "deployer"];
  const filteredAccounts = new Map(
    [...simnet.getAccounts()].filter(([key]) =>
      !excludedAccounts.includes(key)
    ),
  );

  const model = {
    burnBlockHeight: 0,
    lastTokenId: 0,
    owners: new Map(),
    indexToName: new Map(),
    nameToIndex: new Map(),
    nameProperties: new Map(),
    namespaces: new Map(),
    namespaceProperties: new Map(),
    namespaceSinglePreorder: new Map(),
    nameSinglePreorder: new Map(),
    namespacePreorders: new Map(),
    namePreorders: new Map(),
  };

  const invariants = [
    GetLastTokenId(filteredAccounts),
    GetOwnerNone(filteredAccounts),
    GetBnsFromIdNone(filteredAccounts),
    GetPrimaryNameNone(filteredAccounts),
    GetNamespacePropertiesErr(filteredAccounts),
    GetNamespacePrice(filteredAccounts),
    GetBnsInfoNone(filteredAccounts),
    CanNamespaceBeRegisteredTrue(filteredAccounts),
    NamespacePreorder(filteredAccounts),
    NamespaceLaunch(filteredAccounts, model),
    { arbitrary: MngNamePreorder(filteredAccounts, model), weight: 2 },
    { arbitrary: NamespaceReveal(filteredAccounts, model), weight: 3 },
  ];

  fc.assert(
    fc.property(
      fc.array(fc.oneof(...invariants), { size: "medium" }),
      (cmds) => {
        const state = () => ({ model, real: simnet });
        fc.modelRun(state, cmds);
      },
    ),
    { numRuns: 100, verbose: fc.VerbosityLevel.VeryVerbose },
  );
});
