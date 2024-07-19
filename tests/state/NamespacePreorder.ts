import fc from "fast-check";
import { Model } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl, ClarityValue, cvToValue } from "@stacks/transactions";
import {
  createHash160NameSpace,
  encoder,
  prettyConsoleLog,
} from "../BNS-V2.helper";

const PREORDER_CLAIMABILITY_TTL = 144;

export const NamespacePreorder = (accounts: Map<string, string>) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      namespace: fc.string({ minLength: 1, maxLength: 20 }),
      salt: fc.string({ minLength: 1, maxLength: 20 }),
      ustxToBurn: fc.integer({ min: 0, max: 1000000000000 }),
    })
    .map((r) => ({
      check: (model: Readonly<Model>) =>
        !(model.namespaceSinglePreorder.has(JSON.stringify({
          salt: r.salt,
          namespace: r.namespace,
        }))) && r.ustxToBurn > 0,
      run: (model: Model, real: Simnet) => {
        const [wallet, address] = r.sender;
        const saltBuff = encoder.encode(r.salt);
        const namespaceBuff = encoder.encode(r.namespace);
        const namespaceBuffSalt = createHash160NameSpace(
          namespaceBuff,
          saltBuff,
        );

        // Act
        const { result: namespacePreorderResponse } = real.callPublicFn(
          "BNS-V2",
          "namespace-preorder",
          [
            // (hashed-salted-namespace (buff 20))
            Cl.buffer(namespaceBuffSalt),
            // (stx-to-burn uint)
            Cl.uint(r.ustxToBurn),
          ],
          address,
        );

        const burnBlockHeightCV = real.runSnippet(`burn-block-height`);
        const burnBlockHeightAfter = Number(
          cvToValue(burnBlockHeightCV as ClarityValue),
        );
        const expectedUint = burnBlockHeightAfter + PREORDER_CLAIMABILITY_TTL;

        // Assert
        expect(namespacePreorderResponse).toBeOk(
          Cl.uint(expectedUint),
        );

        model.burnBlockHeight = burnBlockHeightAfter;
        const namespaceSinglePreorder = model.namespaceSinglePreorder;
        const namespacePreorders = model.namespacePreorders;
        namespaceSinglePreorder.set(
          JSON.stringify({
            salt: r.salt,
            namespace: r.namespace,
          }),
          true,
        );

        namespacePreorders.set(
          JSON.stringify({
            salt: r.salt,
            namespace: r.namespace,
            buyer: address,
          }),
          {
            createdAt: model.burnBlockHeight,
            ustxBurned: r.ustxToBurn,
          },
        );

        prettyConsoleLog(
          "Ӿ tx-sender",
          wallet,
          "✓",
          "namespace-preorder",
          `namespace: "${r.namespace}"`,
          `salt: "${r.salt}"`,
          `ustx to burn: ${r.ustxToBurn}`,
          `result: (ok ${expectedUint})`,
        );
      },
      toString: () =>
        `namespace-preorder namespace "${r.namespace}" salt "${r.salt}" ustx to burn ${r.ustxToBurn}`,
    }));
