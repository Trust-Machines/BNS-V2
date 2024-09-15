import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { encoder, prettyConsoleLog } from "../BNS-V2.helper";

const NAMESPACE_LAUNCHABILITY_TTL = 52595;

export const CanNamespaceBeRegisteredTrue = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      namespace: fc.string({ maxLength: 20 }),
    })
    .map((r) => ({
      check: (model: Readonly<Model>) => {
        const namespace = model.namespaces.get(r.namespace);

        if (
          !namespace ||
          (!namespace.launchedAt &&
            model.burnBlockHeight + 1 >
              (namespace?.revealedAt || 0) + NAMESPACE_LAUNCHABILITY_TTL) ||
          !namespace.revealedAt
        ) {
          return true;
        }

        return false;
      },
      run: (_model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;
        const namespaceBuff = encoder.encode(r.namespace);
        // Act
        const { result: canRegisterNamespaceResponse } = real.callReadOnlyFn(
          "ST27PT00YS01KBAEEETAH45C1H46C3FMJR31SN2S3.TESTNET-BNS-V2",
          "can-namespace-be-registered",
          [Cl.buffer(namespaceBuff)],
          address,
        );

        // Assert
        expect(canRegisterNamespaceResponse).toBeOk(Cl.bool(true));

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "can-namespace-be-registered",
          `namespace: "${r.namespace}"`,
          "response: (ok true)",
        );
      },
      toString: () =>
        `can-namespace-be-registered namespace "${r.namespace}" response (ok true)`,
    }));
