import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { prettyConsoleLog } from "../BNS-V2.helper";

export const GetOwnerNone = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      tokenId: fc.integer({ min: 1 }),
    })
    .map((r) => ({
      check: (model: Readonly<Model>) => {
        return (
          !(model.lastTokenId >= r.tokenId) ||
          !(model.owners.has(r.tokenId))
        );
      },
      run: (_model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;
        // Act
        const { result: ownerResult } = real.callReadOnlyFn(
          "BNS-V2",
          "get-owner",
          [Cl.uint(r.tokenId)],
          address,
        );

        // Assert
        expect(ownerResult).toBeOk(Cl.none());

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "get-owner",
          `token-id: ${r.tokenId}`,
          "owner: none",
        );
      },
      toString: () => `get-owner token-id ${r.tokenId} owner none`,
    }));
