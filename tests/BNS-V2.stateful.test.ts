import fc from "fast-check";
import { it } from "vitest";

import { GetLastTokenId } from "./state/GetLastTokenId.ts";
import { GetOwnerNone } from "./state/GetOwnerNone.ts";
import { GetBnsFromIdNone } from "./state/GetBnsFromIdNone.ts";

it("executes BNS-V2 state interactions", async () => {
  const excludedAccounts = ["faucet", "deployer"];
  const filteredAccounts = new Map(
    [...simnet.getAccounts()].filter(([key]) =>
      !excludedAccounts.includes(key)
    ),
  );

  const invariants = [
    GetLastTokenId(filteredAccounts),
    GetOwnerNone(filteredAccounts),
    GetBnsFromIdNone(filteredAccounts),
  ];

  const model = {
    lastTokenId: 0,
    owners: new Map(),
    indexToName: new Map(),
  };

  fc.assert(
    fc.property(
      fc.commands(invariants, { size: "+1" }),
      (cmds) => {
        const state = () => ({ model: model, real: simnet });
        fc.modelRun(state, cmds);
      },
    ),
    { numRuns: 1, verbose: fc.VerbosityLevel.VeryVerbose },
  );
});
