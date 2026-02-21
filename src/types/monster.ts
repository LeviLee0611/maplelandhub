export type Monster = {
  name: string;
  level: number;
  hp: number;
  exp: number;
  acc: number;
  eva: number;
  needAcc: number;
  def: number;
  mDef: number;
  ele: string[];
  mobCode: number;
  region?: string;
  map?: string;
  watk?: number;
  matk?: number;
  exist?: boolean;
};
