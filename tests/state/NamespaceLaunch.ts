import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl, ClarityValue, cvToValue } from "@stacks/transactions";
import { encoder, prettyConsoleLog } from "../BNS-V2.helper";

export const NamespaceLaunch = (accounts: Map<string, string>, model: Model) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
    }).chain((r) => {
      const existingNamespaces = Array.from(model.namespaces.keys());
      const existingNamespacesOrFallback = existingNamespaces.length > 0
        ? existingNamespaces
        : [undefined];

      return fc.record({
        namespace: fc.constantFrom(...existingNamespacesOrFallback),
      }).map((namespace) => ({ ...r, ...namespace }));
    })
    .map((r) => ({
      check: (model: Readonly<Model>) =>
        r.namespace !== undefined &&
        model.namespaces.get(r.namespace)!.namespaceImport === r.sender[1] &&
        model.namespaces.get(r.namespace)!.launchedAt === undefined,
      run: (model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;
        const namespaceBuff = encoder.encode(r.namespace);

        // Act
        const { result: namespaceLaunchResponse } = real.callPublicFn(
          "ST27PT00YS01KBAEEETAH45C1H46C3FMJR31SN2S3.TESTNET-BNS-V2",
          "namespace-launch",
          [
            // (namespace (buff 20))
            Cl.buffer(namespaceBuff),
          ],
          address,
        );

        // Assert
        expect(namespaceLaunchResponse).toBeOk(Cl.bool(true));

        const burnBlockHeightCV = real.runSnippet(`burn-block-height`);
        const burnBlockHeightAfter = Number(
          cvToValue(burnBlockHeightCV as ClarityValue),
        );

        model.burnBlockHeight = burnBlockHeightAfter;

        const namespaceProps = model.namespaces.get(r.namespace!);

        model.namespaces.set(r.namespace!, {
          ...namespaceProps!,
          launchedAt: model.burnBlockHeight,
        });

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "namespace-launch",
          `namespace: "${r.namespace}"`,
          `result: (ok true)`,
        );
      },
      toString: () => `namespace-launch namespace "${r.namespace}"`,
    }));
