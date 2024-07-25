import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl, ClarityValue, cvToValue } from "@stacks/transactions";
import { createHash160Name, encoder, prettyConsoleLog } from "../BNS-V2.helper";

const PREORDER_CLAIMABILITY_TTL = 144;

export const MngNamePreorder = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      namespace: fc.string({ minLength: 1, maxLength: 20 }),
      salt: fc.string({ minLength: 1, maxLength: 20 }),
    })
    .map((r) => ({
      check: (model: Readonly<Model>) =>
        !model.nameSinglePreorder.has(
          JSON.stringify({
            salt: r.salt,
            name: r.name,
            namespace: r.namespace,
          }),
        ),
      run: (model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;
        const saltBuff = encoder.encode(r.salt);
        const namespaceBuff = encoder.encode(r.namespace);
        const nameBuff = encoder.encode(r.name);

        const fqnBuffSalt = createHash160Name(
          nameBuff,
          ".",
          namespaceBuff,
          saltBuff,
        );

        // Act
        const { result: namespacePreorderResponse } = real.callPublicFn(
          "BNS-V2",
          "mng-name-preorder",
          [
            // hashed-salted-fqn (buff 20)
            Cl.buffer(fqnBuffSalt),
          ],
          address,
        );

        const burnBlockHeightCV = real.runSnippet(`burn-block-height`);
        const burnBlockHeightAfter = Number(
          cvToValue(burnBlockHeightCV as ClarityValue),
        );
        const expectedUint = burnBlockHeightAfter + PREORDER_CLAIMABILITY_TTL;

        // Assert
        expect(namespacePreorderResponse).toBeOk(Cl.uint(expectedUint));

        model.burnBlockHeight = burnBlockHeightAfter;
        const nameSinglePreorder = model.nameSinglePreorder;
        const namePreorders = model.namePreorders;
        nameSinglePreorder.set(
          JSON.stringify({
            salt: r.salt,
            name: r.name,
            namespace: r.namespace,
          }),
          true,
        );

        namePreorders.set(
          JSON.stringify({
            salt: r.salt,
            namespace: r.namespace,
            buyer: address,
          }),
          {
            createdAt: model.burnBlockHeight,
            ustxBurned: 0,
            claimed: false,
          },
        );

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "mng-name-preorder",
          `fqn: "${r.name}"."${r.namespace}"`,
          `salt: "${r.salt}"`,
          `result: (ok ${expectedUint})`,
        );
      },
      toString: () =>
        `mng-name-preorder fqn "${r.name}"."${r.namespace}" salt "${r.salt}"`,
    }));
