import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { encoder, prettyConsoleLog } from "../BNS-V2.helper";

export const getIdFromBnsNone = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      namespace: fc.string({ maxLength: 20 }),
      name: fc.string({ maxLength: 48 }),
    })
    .map((r) => ({
      check: (model: Readonly<Model>) => {
        return !model.nameToIndex.has(
          JSON.stringify({ name: r.name, namespace: r.namespace })
        );
      },
      run: (_model: Readonly<Model>, real: Simnet) => {
        const [wallet, address] = r.sender;
        const nameBuff = encoder.encode(r.name);
        const namespaceBuff = encoder.encode(r.namespace);

        // Act
        const { result: getIdFromBnsResponse } = real.callReadOnlyFn(
          "ST27PT00YS01KBAEEETAH45C1H46C3FMJR31SN2S3.TESTNET-BNS-V2",
          "get-bns-info",
          [
            // (name (buff 48))
            Cl.buffer(nameBuff),
            // (namespace (buff 20))
            Cl.buffer(namespaceBuff),
          ],
          address
        );

        expect(getIdFromBnsResponse).toBeNone();

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "get-id-from-bns",
          `name: "${r.name}"`,
          `namespace: "${r.namespace}"`,
          `id: none`
        );
      },
      toString: () => `get-id-from-bns name ${r.name} namespace ${r.namespace}`,
    }));
