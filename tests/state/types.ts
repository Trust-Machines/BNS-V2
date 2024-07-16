export type Model = {
  lastTokenId: number;
  owners: Map<number, string>;
  indexToName: Map<number, Name>;
};

export type Name = {
  name: string;
  namespace: string;
};
