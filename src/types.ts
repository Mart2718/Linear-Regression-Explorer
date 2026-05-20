export interface Point {
  id: string;
  x: number;
  y: number;
}

export interface RegressionStats {
  n: number;
  meanX: number;
  meanY: number;
  r: number;
  r2: number;
  slope: number;
  intercept: number;
  seSlope: number;
  tStat: number;
  pValue: number;
  df: number;
}

export interface DatasetItem {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Dataset {
  id: string;
  name: string;
  xLabel: string;
  yLabel: string;
  population: DatasetItem[];
}
