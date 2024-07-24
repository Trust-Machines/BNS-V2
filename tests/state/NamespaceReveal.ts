import fc from "fast-check";
import { Model, PriceFunction, SaltNamespaceBuyerKey } from "./types";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl, ClarityValue, cvToValue } from "@stacks/transactions";
import { encoder, prettyConsoleLog } from "../BNS-V2.helper";

const NAMESPACE_LAUNCHABILITY_TTL = 52595;
const PREORDER_CLAIMABILITY_TTL = 144;

const isValidNamespace = (namespace: string) => {
  const regex = /^[a-z_-]+$/;
  return regex.test(namespace);
};

const findKeyByValue = (map: Map<string, string>, searchValue: string) => {
  for (const [key, value] of map.entries()) {
    if (value === searchValue) {
      return key;
    }
  }
  return undefined;
};

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

export const NamespaceReveal = (accounts: Map<string, string>, model: Model) =>
  fc
    .record({
      sender: fc.constantFrom(...accounts),
      namespaceSaltTuple: fc.constant({
        salt: undefined,
        namespace: undefined,
      }),
      pFuncBase: fc.integer({ min: 1, max: 10 }),
      pFuncCoeff: fc.integer({ min: 1, max: 10 }),
      pFuncB1: fc.integer({ min: 1, max: 10 }),
      pFuncB2: fc.integer({ min: 1, max: 10 }),
      pFuncB3: fc.integer({ min: 1, max: 10 }),
      pFuncB4: fc.integer({ min: 1, max: 10 }),
      pFuncB5: fc.integer({ min: 1, max: 10 }),
      pFuncB6: fc.integer({ min: 1, max: 10 }),
      pFuncB7: fc.integer({ min: 1, max: 10 }),
      pFuncB8: fc.integer({ min: 1, max: 10 }),
      pFuncB9: fc.integer({ min: 1, max: 10 }),
      pFuncB10: fc.integer({ min: 1, max: 10 }),
      pFuncB11: fc.integer({ min: 1, max: 10 }),
      pFuncB12: fc.integer({ min: 1, max: 10 }),
      pFuncB13: fc.integer({ min: 1, max: 10 }),
      pFuncB14: fc.integer({ min: 1, max: 10 }),
      pFuncB15: fc.integer({ min: 1, max: 10 }),
      pFuncB16: fc.integer({ min: 1, max: 10 }),
      pFuncNonAlphaDiscount: fc.integer({ min: 1, max: 10 }),
      pFuncNoVowelDiscount: fc.integer({ min: 1, max: 10 }),
      lifetime: fc.constant(5000),
      namespaceImport: fc.constantFrom(...accounts),
      namespaceManager: fc.option(fc.constantFrom(...accounts)),
      canUpdatePrice: fc.boolean(),
      managerTransfers: fc.boolean(),
      managerFrozen: fc.boolean(),
    })
    .chain((r) => {
      const namespacePreorders = model.namespacePreorders;
      const keysArray = Array.from(namespacePreorders.keys());
      const keysArrayOrFallback = keysArray.length > 0 ? keysArray : [
        JSON.stringify({
          salt: undefined,
          namespace: undefined,
          buyer: undefined,
        }),
      ];

      return fc
        .record({
          namespaceSaltBuyerTupleStringified: fc.constantFrom(
            ...keysArrayOrFallback,
          ),
        })
        .map((namespaceSaltBuyerTuple) => ({
          ...r,
          ...namespaceSaltBuyerTuple,
        }));
    })
    .map((r) => ({
      check: (model: Readonly<Model>) => {
        const namespaceSaltBuyerTuple = JSON.parse(
          r.namespaceSaltBuyerTupleStringified,
        ) as SaltNamespaceBuyerKey;

        if (
          namespaceSaltBuyerTuple.namespace === undefined ||
          namespaceSaltBuyerTuple.salt === undefined ||
          namespaceSaltBuyerTuple.buyer === undefined
        ) {
          return false;
        }

        const namespaceValue = model.namespaces.get(
          namespaceSaltBuyerTuple.namespace,
        );

        const namespacePreorderValue = model.namespacePreorders.get(
          r.namespaceSaltBuyerTupleStringified,
        );

        const namespaceSaltKey = JSON.stringify({
          salt: namespaceSaltBuyerTuple.salt,
          namespace: namespaceSaltBuyerTuple.namespace,
        });

        const tierIndex = Math.min(
          namespaceSaltBuyerTuple.namespace.length - 1,
          7,
        );

        const expectedPrice = namespacePriceTiers[tierIndex];

        return (
          model.namespaceSinglePreorder.size > 0 &&
          namespaceSaltBuyerTuple.namespace !== undefined &&
          namespaceSaltBuyerTuple.salt !== undefined &&
          namespaceSaltBuyerTuple.buyer !== undefined &&
          model.namespaceSinglePreorder.has(namespaceSaltKey) &&
          model.namespaceSinglePreorder.get(namespaceSaltKey) === true &&
          isValidNamespace(namespaceSaltBuyerTuple.namespace) &&
          model.namespacePreorders.has(r.namespaceSaltBuyerTupleStringified) &&
          (!namespaceValue ||
            (!namespaceValue?.launchedAt &&
              (model.burnBlockHeight + 1 >
                (namespaceValue?.revealedAt || 0) +
                  NAMESPACE_LAUNCHABILITY_TTL))) &&
          namespacePreorderValue?.createdAt !== undefined &&
          (model.burnBlockHeight + 1 <=
            (namespacePreorderValue?.createdAt ||
              0 + PREORDER_CLAIMABILITY_TTL)) &&
          expectedPrice <=
            (model.namespacePreorders.get(r.namespaceSaltBuyerTupleStringified)
              ?.ustxBurned || 0)
        );
      },
      run: (model: Model, real: Simnet) => {
        const namespaceSaltBuyerTuple = JSON.parse(
          r.namespaceSaltBuyerTupleStringified,
        ) as SaltNamespaceBuyerKey;
        const senderAddress = namespaceSaltBuyerTuple.buyer as string;
        const senderWallet = findKeyByValue(accounts, senderAddress);
        const [, namespaceImportAddress] = r.namespaceImport;
        const saltBuff = encoder.encode(namespaceSaltBuyerTuple.salt);
        const namespaceBuff = encoder.encode(namespaceSaltBuyerTuple.namespace);
        const namespaceManager = r.namespaceManager
          ? r.namespaceManager[1]
          : undefined;

        let namespaceManagerCv: ClarityValue = Cl.none();

        if (namespaceManager) {
          namespaceManagerCv = Cl.some(Cl.principal(namespaceManager));
        }

        // Act
        const { result: namespaceRevealResponse } = real.callPublicFn(
          "BNS-V2",
          "namespace-reveal",
          [
            Cl.buffer(namespaceBuff),
            Cl.buffer(saltBuff),
            Cl.uint(r.pFuncBase),
            Cl.uint(r.pFuncCoeff),
            Cl.uint(r.pFuncB1),
            Cl.uint(r.pFuncB2),
            Cl.uint(r.pFuncB3),
            Cl.uint(r.pFuncB4),
            Cl.uint(r.pFuncB5),
            Cl.uint(r.pFuncB6),
            Cl.uint(r.pFuncB7),
            Cl.uint(r.pFuncB8),
            Cl.uint(r.pFuncB9),
            Cl.uint(r.pFuncB10),
            Cl.uint(r.pFuncB11),
            Cl.uint(r.pFuncB12),
            Cl.uint(r.pFuncB13),
            Cl.uint(r.pFuncB14),
            Cl.uint(r.pFuncB15),
            Cl.uint(r.pFuncB16),
            Cl.uint(r.pFuncNonAlphaDiscount),
            Cl.uint(r.pFuncNoVowelDiscount),
            Cl.uint(r.lifetime),
            Cl.principal(namespaceImportAddress),
            namespaceManagerCv,
            Cl.bool(r.canUpdatePrice),
            Cl.bool(r.managerTransfers),
            Cl.bool(r.managerFrozen),
          ],
          senderAddress,
        );

        // Assert
        expect(namespaceRevealResponse).toBeOk(Cl.bool(true));

        const burnBlockHeightCV = real.runSnippet(`burn-block-height`);
        const burnBlockHeightAfterCall = Number(
          cvToValue(burnBlockHeightCV as ClarityValue),
        );
        const priceFunction: PriceFunction = {
          buckets: [
            r.pFuncB1,
            r.pFuncB2,
            r.pFuncB3,
            r.pFuncB4,
            r.pFuncB5,
            r.pFuncB6,
            r.pFuncB7,
            r.pFuncB8,
            r.pFuncB9,
            r.pFuncB10,
            r.pFuncB11,
            r.pFuncB12,
            r.pFuncB13,
            r.pFuncB14,
            r.pFuncB15,
            r.pFuncB16,
          ],
          base: r.pFuncBase,
          coeff: r.pFuncCoeff,
          nonalphaDiscount: r.pFuncNonAlphaDiscount,
          noVowelDiscount: r.pFuncNoVowelDiscount,
        };

        model.burnBlockHeight = burnBlockHeightAfterCall;

        const lifetime = r.namespaceManager === undefined ? r.lifetime : 0;

        model.namespaces.set(namespaceSaltBuyerTuple.namespace, {
          namespaceManager: namespaceManager,
          managerTransferable: r.managerTransfers,
          managerFrozen: r.managerFrozen,
          namespaceImport: namespaceImportAddress,
          revealedAt: burnBlockHeightAfterCall,
          launchedAt: undefined,
          lifetime: lifetime,
          canUpdatePriceFunction: r.canUpdatePrice,
          priceFunction: priceFunction,
        });

        prettyConsoleLog(
          "Ӿ tx-sender",
          senderWallet,
          "✓",
          "namespace-reveal",
          `namespace: "${namespaceSaltBuyerTuple.namespace}"`,
          `salt: "${namespaceSaltBuyerTuple.salt}"`,
          `buyer: "${namespaceSaltBuyerTuple.buyer}"`,
          `result: (ok true)`,
        );
      },
      toString: () => {
        const namespaceSaltBuyerTuple = JSON.parse(
          r.namespaceSaltBuyerTupleStringified,
        ) as SaltNamespaceBuyerKey;
        const senderAddress = namespaceSaltBuyerTuple.buyer as string;
        const senderWallet = findKeyByValue(accounts, senderAddress);

        return `namespace-reveal namespace "${namespaceSaltBuyerTuple.namespace}" salt "${namespaceSaltBuyerTuple.salt}" buyer ${senderWallet}`;
      },
    }));
