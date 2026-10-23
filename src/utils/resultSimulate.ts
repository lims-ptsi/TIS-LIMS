import { ParameterDef } from '../data/testParametersCatalog';

const FECALYSIS_DEMO: Record<string, string> = {
  fec_color: 'Brown',
  fec_consistency: 'Soft formed',
  fec_mucus: 'None',
  fec_blood: 'Negative',
  fec_wbc: '0-2 /hpf',
  fec_ova: 'No ova or parasites seen',
  fec_rbc: '0-2 /hpf',
  fec_pus: '0-2 /hpf',
  fec_bacteria: 'Normal flora',
  fec_yeast: 'None seen',
  fec_fat: 'None seen',
  fec_amoeba: 'None seen',
  fec_others: 'None',
  fec_fobt: 'Negative',
};

const URINALYSIS_DEMO: Record<string, string> = {
  ua_color: 'Yellow',
  ua_clarity: 'Clear',
  ua_sp_gr: '1.015',
  ua_ph: '6.0',
  ua_protein: 'Negative',
  ua_glucose: 'Negative',
  ua_ketones: 'Negative',
  ua_blood: 'Negative',
  ua_bilirubin: 'Negative',
  ua_urobilinogen: 'Normal',
  ua_nitrite: 'Negative',
  ua_leukocyte: 'Negative',
  ua_wbc: '0-2 /hpf',
  ua_rbc: '0-2 /hpf',
  ua_epithelial: 'Few',
  ua_bacteria: 'None seen',
  ua_crystals: 'None seen',
  ua_casts: 'None seen',
  ua_others: 'None',
};

function demoTextValue(p: ParameterDef): string {
  if (p.defaultValue?.trim()) return p.defaultValue.trim();
  if (FECALYSIS_DEMO[p.id]) return FECALYSIS_DEMO[p.id];
  if (URINALYSIS_DEMO[p.id]) return URINALYSIS_DEMO[p.id];
  if (p.normalText?.trim()) return p.normalText.trim();
  const name = (p.name || '').toLowerCase();
  if (name.includes('color')) return 'Brown';
  if (name.includes('consistency')) return 'Soft formed';
  if (name.includes('parasite') || name.includes('ova')) return 'No ova or parasites seen';
  if (name.includes('blood') || name.includes('occult')) return 'Negative';
  if (name.includes('bacteria')) return 'Normal flora';
  if (name.includes('mucus') || name.includes('others') || name.includes('yeast') || name.includes('amoeba')) {
    return 'None seen';
  }
  if (name.includes('cell') || name.includes('wbc') || name.includes('rbc') || name.includes('pus')) {
    return '0-2 /hpf';
  }
  return 'Normal';
}

/** Value for “Simulate ingestion” (numeric jitter where applicable). */
export function simulateParameterValue(p: ParameterDef): string {
  if (p.dataType === 'CALCULATED') {
    return p.defaultValue?.trim() || '';
  }
  if (p.dataType === 'NUMERIC' && p.specMin !== undefined && p.specMax !== undefined) {
    const mid = (p.specMin + p.specMax) / 2;
    const range = (p.specMax - p.specMin) * 0.4;
    return (mid + (Math.random() - 0.5) * range).toFixed(2);
  }
  if (p.dataType === 'SELECT' && p.options && p.options.length > 0) {
    return p.defaultValue?.trim() || p.options[0];
  }
  if (p.dataType === 'TEXT') {
    return demoTextValue(p);
  }
  return p.defaultValue?.trim() || 'Normal';
}

/** Value for “Fill normal baseline” (stable, non-random). */
export function baselineParameterValue(p: ParameterDef): string {
  if (p.dataType === 'CALCULATED') {
    return p.defaultValue?.trim() || '';
  }
  if (p.defaultValue?.trim()) return p.defaultValue.trim();
  if (p.dataType === 'NUMERIC' && p.specMin !== undefined && p.specMax !== undefined) {
    return ((p.specMin + p.specMax) / 2).toFixed(2);
  }
  if (p.dataType === 'SELECT' && p.options?.length) {
    return p.options[0];
  }
  if (p.dataType === 'TEXT') {
    return demoTextValue(p);
  }
  return p.normalText?.trim() || 'Normal';
}
