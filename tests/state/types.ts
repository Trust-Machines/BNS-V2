export type Model = {
  burnBlockHeight: number;
  lastTokenId: number;
  owners: Map<number, string>;
  indexToName: Map<number, Name>;
  nameToIndex: Map<string, number>;
  nameProperties: Map<string, NameProperties>;
  namespaces: Map<string, NamespaceProperties>;
  namespaceSinglePreorder: Map<string, boolean | undefined>;
  namespacePreorders: Map<string, Preorder>;
};

export type Name = {
  name: string;
  namespace: string;
};

export type SaltNamespaceBuyerKey = {
  salt: string;
  namespace: string;
  buyer: string;
};

type Preorder = {
  createdAt: number;
  ustxBurned: number;
};

type NamespaceProperties = {
  namespaceManager: string | undefined;
  managerTransferable: boolean;
  managerFrozen: boolean;
  namespaceImport: string;
  revealedAt: number;
  launchedAt: number | undefined;
  lifetime: number;
  canUpdatePriceFunction: boolean;
  priceFunction: PriceFunction;
};

export type PriceFunction = {
  buckets: number[];
  base: number;
  coeff: number;
  nonalphaDiscount: number;
  noVowelDiscount: number;
};

type NameProperties = {
  registeredAt: number | undefined;
  importedAt: number | undefined;
  revokedAt: boolean;
  zonefileHash: Buffer | undefined;
  hashedSaltedFqnPreorder: Buffer | undefined;
  preorderedBy: string | undefined;
  renewalHeight: number;
  ustxBurn: number;
  owner: string;
};
