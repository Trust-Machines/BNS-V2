import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { prettyConsoleLog } from "../BNS-V2.helper";

export const GetLastTokenId = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
    })
    .map((r) => ({
      check: (model: Readonly<Model>) => {
        return true;
      },
      run: (model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;
        const { result } = real.callReadOnlyFn(
          "ST27PT00YS01KBAEEETAH45C1H46C3FMJR31SN2S3.TESTNET-BNS-V2",
          "get-last-token-id",
          [],
          address,
        );
        expect(result).toBeOk(Cl.uint(model.lastTokenId));

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "get-last-token-id",
          model.lastTokenId.toString(),
        );
      },
      toString: () => `get-last-token-id`,
    }));
