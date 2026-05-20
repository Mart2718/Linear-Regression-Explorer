import { Point, RegressionStats, Dataset } from '../types';

/**
 * Calculates the exact Student's T Cumulative Distribution Function (CDF)
 * using the analytical trigonometric series (from Abramowitz & Stegun 26.7.3/4).
 * Returns the probability P(T <= t) for df degrees of freedom.
 */
export function studentsTCDF(t: number, df: number): number {
  if (df < 1) return 0.5;
  
  const theta = Math.atan(t / Math.sqrt(df));
  const cosSq = Math.cos(theta) * Math.cos(theta);
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);

  if (df === 1) {
    return 0.5 + theta / Math.PI;
  }

  let sum = 1;
  let term = 1;

  if (df % 2 === 0) {
    // df is even
    for (let i = 2; i <= df - 2; i += 2) {
      term *= ((i - 1) / i) * cosSq;
      sum += term;
    }
    return 0.5 + 0.5 * sin * sum;
  } else {
    // df is odd
    for (let i = 3; i <= df - 2; i += 2) {
      term *= ((i - 2) / (i - 1)) * cosSq;
      sum += term;
    }
    return 0.5 + (theta + sin * cos * sum) / Math.PI;
  }
}

/**
 * Calculates the t-test P-value based on the test type (tail)
 */
export function getPValue(t: number, df: number, tail: 'two' | 'left' | 'right'): number {
  const cdf = studentsTCDF(t, df);
  
  if (tail === 'left') {
    return cdf;
  } else if (tail === 'right') {
    return 1 - cdf;
  } else {
    // two-tailed
    return 2 * (1 - studentsTCDF(Math.abs(t), df));
  }
}

/**
 * Calculates full regression statistics for a set of data points
 */
export function calculateRegressionStats(points: Point[]): RegressionStats | null {
  const n = points.length;
  if (n < 3) return null; // Needs at least 3 points for t-test degrees of freedom (df = n-2 > 0)

  let sumX = 0;
  let sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let ssXX = 0;
  let ssYY = 0;
  let ssXY = 0;

  for (const p of points) {
    const diffX = p.x - meanX;
    const diffY = p.y - meanY;
    ssXX += diffX * diffX;
    ssYY += diffY * diffY;
    ssXY += diffX * diffY;
  }

  if (ssXX === 0) return null; // Vertical line exception

  const slope = ssXY / ssXX;
  const intercept = meanY - slope * meanX;

  // Correlation Coefficient r
  const r = ssYY === 0 ? 0 : ssXY / Math.sqrt(ssXX * ssYY);
  const r2 = r * r;

  // Sum of Squared Residuals (SSE)
  let sse = 0;
  for (const p of points) {
    const predictedY = intercept + slope * p.x;
    const residual = p.y - predictedY;
    sse += residual * residual;
  }

  const df = n - 2;
  // Residual Standard Error s_e
  const s_e = Math.sqrt(sse / df);

  // Standard Error of Slope
  const seSlope = ssXX === 0 ? 0 : s_e / Math.sqrt(ssXX);

  // T-Statistic for slope beta = 0
  const tStat = seSlope === 0 ? 0 : slope / seSlope;

  // Two-tailed P-value as default
  const pValue = getPValue(tStat, df, 'two');

  return {
    n,
    meanX,
    meanY,
    r,
    r2,
    slope,
    intercept,
    seSlope,
    tStat,
    pValue,
    df,
  };
}

/**
 * Pre-loaded quantitative datasets mirroring the lecture notes.
 */
export const STATS_DATASETS: Dataset[] = [
  {
    id: 'mcdonalds_fat_calories',
    name: "McDonald's Sandwiches (Fat vs. Calories)",
    xLabel: "Grams of Fat (g)",
    yLabel: "Calories (kcal)",
    population: [
      { id: 'mc_1', name: 'Hamburger', x: 9, y: 260 },
      { id: 'mc_2', name: 'Cheeseburger', x: 13, y: 320 },
      { id: 'mc_3', name: 'Quarter Pounder', x: 21, y: 420 },
      { id: 'mc_4', name: 'Quarter Pounder with Cheese', x: 30, y: 530 },
      { id: 'mc_5', name: 'Big Mac', x: 31, y: 560 },
      { id: 'mc_6', name: 'Arch Special', x: 31, y: 550 },
      { id: 'mc_7', name: 'Arch Special with Bacon', x: 34, y: 590 },
      { id: 'mc_8', name: 'Crispy Chicken', x: 25, y: 500 },
      { id: 'mc_9', name: 'Fish Filet', x: 28, y: 560 },
      { id: 'mc_10', name: 'Grilled Chicken', x: 20, y: 440 },
      { id: 'mc_11', name: 'Grilled Chicken Light', x: 5, y: 300 }
    ]
  },
  {
    id: 'device_battery',
    name: 'Hardware Workloads (Task Load vs. Battery %)',
    xLabel: 'Running Background Tasks',
    yLabel: 'Remaining Battery Life (%)',
    population: [
      { id: 'bt_1', name: 'Device 1', x: 2, y: 88 },
      { id: 'bt_2', name: 'Device 2', x: 4, y: 76 },
      { id: 'bt_3', name: 'Device 3', x: 6, y: 65 },
      { id: 'bt_4', name: 'Device 4', x: 8, y: 54 },
      { id: 'bt_5', name: 'Device 5', x: 10, y: 44 },
      { id: 'bt_6', name: 'Device 6', x: 12, y: 32 },
      { id: 'bt_7', name: 'Device 7', x: 1, y: 94 },
      { id: 'bt_8', name: 'Device 8', x: 3, y: 82 },
      { id: 'bt_9', name: 'Device 9', x: 5, y: 70 },
      { id: 'bt_10', name: 'Device 10', x: 7, y: 59 },
      { id: 'bt_11', name: 'Device 11', x: 9, y: 49 },
      { id: 'bt_12', name: 'Device 12', x: 11, y: 38 },
      { id: 'bt_13', name: 'Device 13', x: 13, y: 26 },
      { id: 'bt_14', name: 'Device 14', x: 15, y: 15 },
      { id: 'bt_15', name: 'Device 15', x: 2, y: 84 },
      { id: 'bt_16', name: 'Device 16', x: 4, y: 72 },
      { id: 'bt_17', name: 'Device 17', x: 6, y: 60 },
      { id: 'bt_18', name: 'Device 18', x: 8, y: 50 },
      { id: 'bt_19', name: 'Device 19', x: 10, y: 40 },
      { id: 'bt_20', name: 'Device 20', x: 12, y: 28 },
      { id: 'bt_21', name: 'Device 21', x: 14, y: 18 },
      { id: 'bt_22', name: 'Device 22', x: 1, y: 92 },
      { id: 'bt_23', name: 'Device 23', x: 3, y: 80 },
      { id: 'bt_24', name: 'Device 24', x: 5, y: 68 },
      { id: 'bt_25', name: 'Device 25', x: 7, y: 56 },
      { id: 'bt_26', name: 'Device 26', x: 9, y: 46 },
      { id: 'bt_27', name: 'Device 27', x: 11, y: 35 },
      { id: 'bt_28', name: 'Device 28', x: 13, y: 23 },
      { id: 'bt_29', name: 'Device 29', x: 15, y: 11 },
      { id: 'bt_30', name: 'Device 30', x: 3, y: 85 },
      { id: 'bt_31', name: 'Device 31', x: 5, y: 74 },
      { id: 'bt_32', name: 'Device 32', x: 7, y: 62 },
      { id: 'bt_33', name: 'Device 33', x: 9, y: 52 },
      { id: 'bt_34', name: 'Device 34', x: 11, y: 41 },
      { id: 'bt_35', name: 'Device 35', x: 13, y: 30 },
      { id: 'bt_36', name: 'Device 36', x: 1, y: 96 },
      { id: 'bt_37', name: 'Device 37', x: 6, y: 63 },
      { id: 'bt_38', name: 'Device 38', x: 8, y: 53 },
      { id: 'bt_39', name: 'Device 39', x: 10, y: 42 },
      { id: 'bt_40', name: 'Device 40', x: 12, y: 31 }
    ]
  },
  {
    id: 'shoe_reading',
    name: 'Confounding Example (Shoe Size vs. Reading Level)',
    xLabel: 'Shoe Size',
    yLabel: 'Reading Ability Score (0-100)',
    population: [
      // Age is the actual driver. Kids of age 5-11.
      { id: 'sr_1', name: 'Sam (Age 5)', x: 1.5, y: 12 },
      { id: 'sr_2', name: 'Amy (Age 5)', x: 1.0, y: 15 },
      { id: 'sr_3', name: 'Kai (Age 6)', x: 2.0, y: 22 },
      { id: 'sr_4', name: 'Leo (Age 6)', x: 2.5, y: 26 },
      { id: 'sr_5', name: 'Zoe (Age 7)', x: 3.0, y: 35 },
      { id: 'sr_6', name: 'Eli (Age 7)', x: 3.5, y: 39 },
      { id: 'sr_7', name: 'Mia (Age 8)', x: 4.0, y: 51 },
      { id: 'sr_8', name: 'Max (Age 8)', x: 4.5, y: 55 },
      { id: 'sr_9', name: 'Ian (Age 9)', x: 5.0, y: 64 },
      { id: 'sr_10', name: 'Ema (Age 9)', x: 5.5, y: 68 },
      { id: 'sr_11', name: 'Jon (Age 10)', x: 6.0, y: 76 },
      { id: 'sr_12', name: 'Eva (Age 10)', x: 6.5, y: 81 },
      { id: 'sr_13', name: 'Roy (Age 11)', x: 7.0, y: 88 },
      { id: 'sr_14', name: 'Liz (Age 11)', x: 7.5, y: 92 },
      { id: 'sr_15', name: 'Ben (Age 12)', x: 8.0, y: 95 },
      { id: 'sr_16', name: 'Kim (Age 12)', x: 8.5, y: 98 }
    ]
  },
  {
    id: 'no_correlation',
    name: 'No Correlation Example (Weekly Screen Time vs. Lucky Number Index)',
    xLabel: 'Screen Time (hours/week)',
    yLabel: 'Lucky Number Index (1-100)',
    population: [
      { id: 'nc_1', name: 'Student A', x: 15, y: 82 },
      { id: 'nc_2', name: 'Student B', x: 38, y: 14 },
      { id: 'nc_3', name: 'Student C', x: 42, y: 95 },
      { id: 'nc_4', name: 'Student D', x: 10, y: 44 },
      { id: 'nc_5', name: 'Student E', x: 55, y: 12 },
      { id: 'nc_6', name: 'Student F', x: 62, y: 88 },
      { id: 'nc_7', name: 'Student G', x: 28, y: 53 },
      { id: 'nc_8', name: 'Student H', x: 70, y: 31 },
      { id: 'nc_9', name: 'Student I', x: 84, y: 69 },
      { id: 'nc_10', name: 'Student J', x: 49, y: 50 },
      { id: 'nc_11', name: 'Student K', x: 19, y: 22 },
      { id: 'nc_12', name: 'Student L', x: 91, y: 47 },
      { id: 'nc_13', name: 'Student M', x: 33, y: 76 },
      { id: 'nc_14', name: 'Student N', x: 76, y: 15 },
      { id: 'nc_15', name: 'Student O', x: 52, y: 83 },
      { id: 'nc_16', name: 'Student P', x: 60, y: 39 },
      { id: 'nc_17', name: 'Student Q', x: 22, y: 91 },
      { id: 'nc_18', name: 'Student R', x: 80, y: 10 },
      { id: 'nc_19', name: 'Student S', x: 45, y: 58 },
      { id: 'nc_20', name: 'Student T', x: 67, y: 64 },
      { id: 'nc_21', name: 'Student U', x: 12, y: 18 },
      { id: 'nc_22', name: 'Student V', x: 30, y: 89 },
      { id: 'nc_23', name: 'Student W', x: 58, y: 41 },
      { id: 'nc_24', name: 'Student X', x: 73, y: 94 },
      { id: 'nc_25', name: 'Student Y', x: 88, y: 25 },
      { id: 'nc_26', name: 'Student Z', x: 25, y: 61 },
      { id: 'nc_27', name: 'Student AA', x: 40, y: 36 },
      { id: 'nc_28', name: 'Student BB', x: 50, y: 72 },
      { id: 'nc_29', name: 'Student CC', x: 65, y: 28 },
      { id: 'nc_30', name: 'Student DD', x: 82, y: 80 },
      { id: 'nc_31', name: 'Student EE', x: 35, y: 45 },
      { id: 'nc_32', name: 'Student FF', x: 47, y: 20 },
      { id: 'nc_33', name: 'Student GG', x: 71, y: 55 },
      { id: 'nc_34', name: 'Student HH', x: 95, y: 71 },
      { id: 'nc_35', name: 'Student II', x: 17, y: 33 },
      { id: 'nc_36', name: 'Student JJ', x: 29, y: 67 },
      { id: 'nc_37', name: 'Student KK', x: 54, y: 59 },
      { id: 'nc_38', name: 'Student LL', x: 63, y: 16 },
      { id: 'nc_39', name: 'Student MM', x: 78, y: 84 },
      { id: 'nc_40', name: 'Student NN', x: 85, y: 42 }
    ]
  }
];
