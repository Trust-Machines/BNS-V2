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
    { arbitrary: MngNamePreorder(filteredAccounts), weight: 3 },
    NamespaceReveal(filteredAccounts, model),
  ];

  fc.assert(
    fc.property(
      fc.array(fc.oneof(...invariants), { size: "+1" }),
      (cmds) => {
        const state = () => ({ model, real: simnet });
        fc.modelRun(state, cmds);
      },
    ),
    { numRuns: 10000, verbose: fc.VerbosityLevel.VeryVerbose },
  );
});
