import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { prettyConsoleLog } from "../BNS-V2.helper";

export const GetBnsFromIdNone = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      tokenId: fc.integer({ min: 1 }),
    })
    .map((r) => ({
      check: (model: Readonly<Model>) => {
        return (
          !(model.lastTokenId >= r.tokenId) ||
          !(model.indexToName.has(r.tokenId))
        );
      },
      run: (_model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;
        // Act
        const { result: bnsOptional } = real.callReadOnlyFn(
          "ST27PT00YS01KBAEEETAH45C1H46C3FMJR31SN2S3.TESTNET-BNS-V2",
          "get-bns-from-id",
          [Cl.uint(r.tokenId)],
          address,
        );

        // Assert
        expect(bnsOptional).toBeNone();

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "get-bns-from-id",
          `token-id: ${r.tokenId}`,
          "bns: none",
        );
      },
      toString: () => `get-bns-from-id token-id ${r.tokenId} bns none`,
    }));
