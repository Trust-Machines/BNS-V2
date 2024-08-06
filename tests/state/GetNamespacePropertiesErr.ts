import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl } from "@stacks/transactions";
import {
  encoder,
  ERR_NAMESPACE_NOT_FOUND,
  prettyConsoleLog,
} from "../BNS-V2.helper";

export const GetNamespacePropertiesErr = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      namespace: fc.string({ maxLength: 20 }),
    })
    .map((r) => ({
      check: (model: Readonly<Model>) => {
        return !(model.namespaces.has(r.namespace));
      },
      run: (_model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;
        const namespaceBuff = encoder.encode(r.namespace);
        // Act
        const { result: namespacePropertiesResponse } = real.callReadOnlyFn(
          "ST27PT00YS01KBAEEETAH45C1H46C3FMJR31SN2S3.TESTNET-BNS-V2",
          "get-namespace-properties",
          [
            // (namespace (buff 20))
            Cl.buffer(namespaceBuff),
          ],
          address,
        );

        // Assert
        expect(namespacePropertiesResponse).toBeErr(
          Cl.uint(ERR_NAMESPACE_NOT_FOUND),
        );

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "get-namespace-properties",
          `namespace: "${r.namespace}"`,
          `properties: ERR_NAMESPACE_NOT_FOUND ${ERR_NAMESPACE_NOT_FOUND}`,
        );
      },
      toString: () =>
        `get-namespace-properties namespace "${r.namespace}" properties ERR_NAMESPACE_NOT_FOUND ${ERR_NAMESPACE_NOT_FOUND}`,
    }));
