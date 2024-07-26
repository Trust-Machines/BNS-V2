import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { encoder, prettyConsoleLog } from "../BNS-V2.helper";

const namespacePriceTiers = [
  640_000_000_000,
  64_000_000_000,
  64_000_000_000,
  6_400_000_000,
  6_400_000_000,
  6_400_000_000,
  6_400_000_000,
  640_000_000,
];

export const GetNamespacePrice = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      namespace: fc.string({ minLength: 1, maxLength: 20 }),
    })
    .map((r) => ({
      check: (_model: Readonly<Model>) => true,
      run: (_model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;
        const tierIndex = Math.min(r.namespace.length - 1, 7);
        const expectedPrice = namespacePriceTiers[tierIndex];

        const namespaceBuff = encoder.encode(r.namespace);
        // Act
        const { result: namespacePriceResponse } = real.callReadOnlyFn(
          "ST27PT00YS01KBAEEETAH45C1H46C3FMJR31SN2S3.TESTNET-BNS-V2",
          "get-namespace-price",
          [
            // (namespace (buff 20))
            Cl.buffer(namespaceBuff),
          ],
          address,
        );

        // Assert
        expect(namespacePriceResponse).toBeOk(
          Cl.uint(expectedPrice),
        );

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "get-namespace-price",
          `namespace: "${r.namespace}"`,
          `price: ${expectedPrice}`,
        );
      },
      toString: () => {
        const tierIndex = Math.min(r.namespace.length - 1, 7);
        const expectedPrice = namespacePriceTiers[tierIndex];
        return `get-namespace-price namespace "${r.namespace}" price ${expectedPrice}`;
      },
    }));
