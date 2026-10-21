import { QCRunRecord } from '../types/lims';

/**
 * Calculates the Z-score for a Quality Control measurement
 */
export function computeZScore(measured: number, mean: number, sd: number): number {
  if (sd === 0) return 0;
  return Number(((measured - mean) / sd).toFixed(2));
}

export interface WestgardEvaluationResult {
  rule: 'NONE' | '1-2s' | '1-3s' | '2-2s' | 'R-4s' | '4-1s' | '10-x';
  status: 'ACCEPTED' | 'WARNING' | 'REJECTED';
  message: string;
}

/**
 * Comprehensive Westgard Multi-Rules Engine for Statistical Process Control
 */
export function evaluateWestgardRules(
  previousRuns: QCRunRecord[],
  currentMeasured: number,
  targetMean: number,
  targetSD: number
): WestgardEvaluationResult {
  const currentZ = computeZScore(currentMeasured, targetMean, targetSD);
  const zHistory = previousRuns.slice(-9).map((r) => r.zScore);
  const fullZ = [...zHistory, currentZ];

  // 1. Check 1-3s Rule (Rejection: > 3 SD)
  if (Math.abs(currentZ) > 3.0) {
    return {
      rule: '1-3s',
      status: 'REJECTED',
      message: `Critical 1-3s Rule Violation: Value is at ${currentZ} SD (Threshold ±3.0 SD). Probable Random Error.`,
    };
  }

  // 2. Check 2-2s Rule (Rejection: 2 consecutive runs exceeding +2SD or -2SD on the same side)
  if (fullZ.length >= 2) {
    const lastTwo = fullZ.slice(-2);
    if ((lastTwo[0] > 2.0 && lastTwo[1] > 2.0) || (lastTwo[0] < -2.0 && lastTwo[1] < -2.0)) {
      return {
        rule: '2-2s',
        status: 'REJECTED',
        message: `2-2s Rule Violation: 2 consecutive runs exceed 2 SD on the same side. Probable Systematic Error / Shift.`,
      };
    }
  }

  // 3. Check R-4s Rule (Rejection: within-run or 2 consecutive runs differing by > 4 SD)
  if (fullZ.length >= 2) {
    const lastTwo = fullZ.slice(-2);
    if (Math.abs(lastTwo[1] - lastTwo[0]) >= 4.0) {
      return {
        rule: 'R-4s',
        status: 'REJECTED',
        message: `R-4s Rule Violation: Difference between consecutive controls is ${Math.abs(lastTwo[1] - lastTwo[0]).toFixed(2)} SD (>4.0 SD). Severe Random Dispersal.`,
      };
    }
  }

  // 4. Check 4-1s Rule (Rejection: 4 consecutive runs exceeding +1SD or -1SD on the same side)
  if (fullZ.length >= 4) {
    const lastFour = fullZ.slice(-4);
    if (lastFour.every((z) => z > 1.0) || lastFour.every((z) => z < -1.0)) {
      return {
        rule: '4-1s',
        status: 'REJECTED',
        message: `4-1s Rule Violation: 4 consecutive runs exceed 1 SD on the same side. Maintenance / Reagent Calibration required.`,
      };
    }
  }

  // 5. Check 10-x Rule (Rejection: 10 consecutive runs falling on the same side of the mean)
  if (fullZ.length >= 10) {
    const lastTen = fullZ.slice(-10);
    if (lastTen.every((z) => z > 0) || lastTen.every((z) => z < 0)) {
      return {
        rule: '10-x',
        status: 'REJECTED',
        message: `10-x Rule Violation: 10 consecutive runs fall on the same side of the mean. Systematic baseline drift detected.`,
      };
    }
  }

  // 6. Check 1-2s Rule (Warning: 1 run exceeding ±2SD)
  if (Math.abs(currentZ) > 2.0) {
    return {
      rule: '1-2s',
      status: 'WARNING',
      message: `1-2s Warning: Value is at ${currentZ} SD. Potential early shift. Inspect subsequent runs closely.`,
    };
  }

  return {
    rule: 'NONE',
    status: 'ACCEPTED',
    message: `In Control: Z-score is ${currentZ} SD (Within normal statistical tolerances).`,
  };
}

/**
 * Evaluates dynamic formulas safely
 * e.g., "param['dry_wt'] - param['tare_wt']"
 */
export function evaluateFormula(formula: string, paramValues: Record<string, number>): number | null {
  try {
    let sanitizedFormula = formula;
    for (const [code, val] of Object.entries(paramValues)) {
      const regex = new RegExp(`param\\['${code}'\\]|param\\["${code}"\\]|${code}`, 'g');
      sanitizedFormula = sanitizedFormula.replace(regex, val.toString());
    }

    // Only allow safe arithmetic operations
    if (/[^0-9+\-*/().\s]/.test(sanitizedFormula)) {
      console.warn('Invalid characters in formula:', sanitizedFormula);
      return null;
    }

    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitizedFormula})`)();
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? Number(result.toFixed(4)) : null;
  } catch (err) {
    console.error('Formula evaluation error:', err);
    return null;
  }
}

/**
 * Simple Cryptographic SHA-256 string hasher for Audit Trail verification
 */
export async function generateSha256Hash(content: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Determines clinical/analytical flag for a result
 */
export function determineResultFlag(
  value: number,
  specMin?: number,
  specMax?: number,
  criticalMin?: number,
  criticalMax?: number
): 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL' | 'OOS' {
  if (criticalMin !== undefined && value < criticalMin) return 'CRITICAL';
  if (criticalMax !== undefined && value > criticalMax) return 'CRITICAL';
  if (specMin !== undefined && value < specMin) return 'LOW';
  if (specMax !== undefined && value > specMax) return 'HIGH';
  return 'NORMAL';
}
