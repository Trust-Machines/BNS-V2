import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { prettyConsoleLog } from "../BNS-V2.helper";

export const GetTokenUri = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      id: fc.integer({ min: 1 }),
    })
    .map((r) => ({
      check: (_model: Readonly<Model>) => true,
      run: (_model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;

        // Act
        const { result: getTokenUriResponse } = real.callReadOnlyFn(
          "ST27PT00YS01KBAEEETAH45C1H46C3FMJR31SN2S3.TESTNET-BNS-V2",
          "get-token-uri",
          [
            // (id uint)
            Cl.uint(r.id),
          ],
          address
        );

        // Assert
        expect(getTokenUriResponse).toBeOk(Cl.some(Cl.stringAscii("test")));

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "get-token-uri",
          `id: ${r.id}`,
          `uri: "test"`
        );
      },
      toString: () => `get-token-uri id ${r.id} uri "test"`,
    }));
