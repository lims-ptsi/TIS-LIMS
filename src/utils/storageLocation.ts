import { Sample } from '../types/lims';

export interface BoxDefinition {
  id: string;
  name: string;
  temp: string;
  unit: string;
  rack: string;
  shelf: string;
  facility: string;
  room: string;
  format: '96_WELL' | '81_CRYO';
  capacity: number;
}

export const STANDARD_BOXES: BoxDefinition[] = [
  {
    id: 'BX000026',
    name: 'Lockbox Primary Reception',
    temp: '+4°C',
    unit: 'Main Refrigerator #1',
    rack: 'RK000005',
    shelf: 'Shelf 1',
    facility: 'Central Laboratory',
    room: 'Rm 102 - Cold Vault',
    format: '96_WELL',
    capacity: 96,
  },
  {
    id: 'BX000025',
    name: 'Clinical Serum Archive B',
    temp: '-20°C',
    unit: 'Freezer -20°C Archive',
    rack: 'RK000002',
    shelf: 'Shelf 2',
    facility: 'Central Laboratory',
    room: 'Rm 102 - Cold Vault',
    format: '96_WELL',
    capacity: 96,
  },
  {
    id: 'BX000010',
    name: 'DNA Extraction Vault 01',
    temp: '-80°C',
    unit: 'Cryo-Vault Ultra-Low -80°C #1',
    rack: 'RK000001',
    shelf: 'Shelf 1',
    facility: 'Central Laboratory',
    room: 'Rm 104 - Molecular Cryo',
    format: '96_WELL',
    capacity: 96,
  },
  {
    id: 'BX000027',
    name: 'Batch Testing Site Freezer',
    temp: '-80°C',
    unit: 'Cryo-Vault Ultra-Low -80°C #2',
    rack: 'RK000005',
    shelf: 'Shelf 2',
    facility: 'Central Laboratory',
    room: 'Rm 104 - Molecular Cryo',
    format: '96_WELL',
    capacity: 96,
  },
];

export function getBoxDefinition(boxId: string): BoxDefinition {
  const clean = (boxId || '').trim().toUpperCase();
  const found = STANDARD_BOXES.find((b) => b.id.toUpperCase() === clean);
  return (
    found || {
      id: clean || 'BX000026',
      name: `${clean || 'BX000026'} Specimen Vault`,
      temp: '+4°C',
      unit: 'Main Cold Vault',
      rack: 'RK000001',
      shelf: 'Shelf 1',
      facility: 'Central Laboratory',
      room: 'Rm 102 - Cold Vault',
      format: '96_WELL',
      capacity: 96,
    }
  );
}

/**
 * Standardizes well notation (e.g. "a1" -> "A01", "B4" -> "B04", "H12" -> "H12")
 */
export function normalizeWell(well?: string | null): string {
  if (!well) return '';
  const trimmed = well.trim().toUpperCase();
  const match = trimmed.match(/^([A-I])0*(\d{1,2})$/);
  if (!match) return trimmed;
  const row = match[1];
  const col = parseInt(match[2], 10);
  return `${row}${col < 10 ? '0' + col : col}`;
}

/**
 * Compare two wells flexibly (e.g. "A01" matches "A1")
 */
export function isSameWell(w1?: string | null, w2?: string | null): boolean {
  return normalizeWell(w1) === normalizeWell(w2);
}

/**
 * Checks whether a well coordinate is already taken by an active sample in that specific box.
 */
export function isWellOccupiedInBox(
  boxId: string,
  well: string,
  samples: Sample[],
  excludeSampleId?: string
): { isOccupied: boolean; occupyingSample?: Sample } {
  const normBox = (boxId || '').trim().toUpperCase();
  const normWell = normalizeWell(well);
  if (!normWell) return { isOccupied: false };

  const occupyingSample = samples.find((s) => {
    if (excludeSampleId && s.id === excludeSampleId) return false;
    const sBox = (s.storageLocation?.box || '').trim().toUpperCase();
    const sWell = normalizeWell(s.storageLocation?.well);
    return sBox === normBox && sWell === normWell;
  });

  return {
    isOccupied: !!occupyingSample,
    occupyingSample,
  };
}

/**
 * Finds the first unoccupied coordinate in a box
 */
export function findNextAvailableWell(
  boxId: string,
  samples: Sample[],
  format: '96_WELL' | '81_CRYO' = '96_WELL',
  excludeSampleId?: string
): string {
  const normBox = (boxId || '').trim().toUpperCase();
  const occupiedSet = new Set<string>();

  samples.forEach((s) => {
    if (excludeSampleId && s.id === excludeSampleId) return;
    const sBox = (s.storageLocation?.box || '').trim().toUpperCase();
    if (sBox === normBox) {
      occupiedSet.add(normalizeWell(s.storageLocation?.well));
    }
  });

  if (format === '81_CRYO') {
    // 9 rows (A-I), 9 cols (01-09)
    for (let r = 0; r < 9; r++) {
      const row = String.fromCharCode(65 + r);
      for (let c = 1; c <= 9; c++) {
        const wellPos = `${row}0${c}`;
        if (!occupiedSet.has(wellPos)) {
          return wellPos;
        }
      }
    }
  } else {
    // Standard SBS 96-well: 8 rows (A-H), 12 cols (01-12)
    for (let r = 0; r < 8; r++) {
      const row = String.fromCharCode(65 + r);
      for (let c = 1; c <= 12; c++) {
        const wellPos = `${row}${c < 10 ? '0' + c : c}`;
        if (!occupiedSet.has(wellPos)) {
          return wellPos;
        }
      }
    }
  }

  return 'A01';
}
