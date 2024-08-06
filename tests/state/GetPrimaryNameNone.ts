import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { prettyConsoleLog } from "../BNS-V2.helper";

export const GetPrimaryNameNone = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      owner: fc.constantFrom(...accounts),
    })
    .map((r) => ({
      check: (model: Readonly<Model>) => {
        const [, ownerAddress] = r.owner;
        return !(Array.from(model.owners.values()).includes(ownerAddress));
      },
      run: (_model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;
        const [ownerWallet, ownerAddress] = r.owner;
        // Act
        const { result: primaryNameOptional } = real.callReadOnlyFn(
          "ST27PT00YS01KBAEEETAH45C1H46C3FMJR31SN2S3.TESTNET-BNS-V2",
          "get-primary-name",
          [Cl.principal(ownerAddress)],
          address,
        );

        // Assert
        expect(primaryNameOptional).toBeNone();

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "get-primary-name",
          `owner: ${ownerWallet}`,
          "primary-name: none",
        );
      },
      toString: () => {
        const [ownerWallet] = r.owner;
        return `get-primary-name owner ${ownerWallet} primary-name none`;
      },
    }));
