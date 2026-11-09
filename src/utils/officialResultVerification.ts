import { LabTestRequisition } from '../components/modals/NewRequisitionModal';
import { ExamResultGroup } from '../components/modals/ResultEntryModal';
import { getResultFormForExam } from '../data/resultFormsCatalog';
import { generateSha256Hash } from './qcCalculations';
import { buildVerifyExamCandidates } from './verifyResultCandidates';

const VERIFY_PEPPER =
  (import.meta.env.VITE_RESULT_VERIFY_PEPPER as string | undefined) ||
  'ptsi-lab-tis-official-result-v1';

const VERIFY_FINGERPRINT_SKIP = new Set([
  'res_diagnostic_test',
  'res_ck_xpert',
  'res_ck_xpert_ultra',
  'res_ck_truenat_plus',
  'res_ck_truenat_rif',
  'res_ck_tblamp',
  'res_ck_smear',
]);

function legacyResultGroupFingerprint(group?: ExamResultGroup): string {
  if (!group) return '';
  return Object.entries(group.parameters || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}=${String(val?.value ?? '').trim()}`)
    .join(';');
}

/** Non-empty clinically relevant fields (stable after DB normalization). */
function meaningfulResultGroupFingerprint(group?: ExamResultGroup): string {
  if (!group) return '';
  return Object.entries(group.parameters || {})
    .filter(([key, val]) => {
      const value = String(val?.value ?? '').trim();
      if (!value) return false;
      if (VERIFY_FINGERPRINT_SKIP.has(key)) return false;
      if (key.endsWith('_license') || key.endsWith('_date')) return false;
      return true;
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}=${String(val?.value ?? '').trim()}`)
    .join(';');
}

function fingerprintVariants(group?: ExamResultGroup): string[] {
  const meaningful = meaningfulResultGroupFingerprint(group);
  const legacy = legacyResultGroupFingerprint(group);
  return meaningful === legacy ? [meaningful] : [meaningful, legacy];
}

/** Fingerprint used when generating new QR codes (meaningful fields only). */
export function resultGroupFingerprint(group?: ExamResultGroup): string {
  return meaningfulResultGroupFingerprint(group);
}

export async function buildOfficialResultVerifyToken(input: {
  requisitionNumber: string;
  caseNo: string;
  examKey: string;
  formId?: string;
  resultFingerprint: string;
}): Promise<string> {
  const canonical = [
    VERIFY_PEPPER,
    input.requisitionNumber.trim(),
    input.caseNo.trim(),
    input.examKey.trim(),
    (input.formId || '').trim(),
    input.resultFingerprint,
  ].join('|');
  const digest = await generateSha256Hash(canonical);
  return digest.slice(0, 20).toUpperCase();
}

export async function buildOfficialResultVerifyUrl(input: {
  origin: string;
  requisition: LabTestRequisition;
  examKey: string;
  formId?: string;
  formLabel?: string;
  resultGroup?: ExamResultGroup;
}): Promise<string> {
  const rn = input.requisition.requisitionNumber || '';
  const cn = input.requisition.caseNo || input.requisition.externalRef || '';
  const fp = resultGroupFingerprint(input.resultGroup);
  const tok = await buildOfficialResultVerifyToken({
    requisitionNumber: rn,
    caseNo: cn,
    examKey: input.examKey,
    formId: input.formId,
    resultFingerprint: fp,
  });

  const base =
    (import.meta.env.VITE_PUBLIC_VERIFY_ORIGIN as string | undefined)?.trim() || input.origin;
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.pathname = url.pathname || '/';
  /** Minimal query keeps QR low-density and scannable on paper. */
  url.searchParams.set('verify', '1');
  url.searchParams.set('rn', rn);
  url.searchParams.set('tok', tok);
  return url.href;
}

export type ResolvedVerifyMatch = {
  examKey: string;
  group: ExamResultGroup;
  formId?: string;
  formLabel?: string;
};

/** Case identifiers used when sealing a QR (print may use case no. or external ref). */
export function requisitionCaseNoCandidates(requisition: LabTestRequisition): string[] {
  const out: string[] = [];
  const add = (raw: string) => {
    const t = raw.trim();
    if (t && !out.includes(t)) out.push(t);
  };
  add(requisition.caseNo || '');
  add(requisition.externalRef || '');
  return out.length ? out : [''];
}

/** Match token to a stored exam — used when QR only carries rn + tok. */
export async function resolveVerifiedExamGroup(
  requisition: LabTestRequisition,
  resultMap: Record<string, ExamResultGroup> | undefined,
  token: string,
  hint?: { examKey?: string; formId?: string }
): Promise<ResolvedVerifyMatch | null> {
  if (!resultMap) return null;
  const rn = requisition.requisitionNumber || '';
  const tok = token.trim().toUpperCase();
  const caseIds = requisitionCaseNoCandidates(requisition);

  const tryCandidate = async (examKey: string, group: ExamResultGroup, preferredFormId?: string) => {
    const form = getResultFormForExam(group.examCode || examKey, requisition.patientGender);
    const formIds = new Set<string>();
    if (hint?.formId) formIds.add(hint.formId);
    if (preferredFormId) formIds.add(preferredFormId);
    if (form?.id) formIds.add(form.id);
    formIds.add('');

    const examKeys = new Set<string>();
    examKeys.add(examKey);
    if (group.examCode) examKeys.add(group.examCode);

    for (const key of examKeys) {
      for (const formId of formIds) {
        for (const caseNo of caseIds) {
          const ok = await verifyOfficialResultToken({
            requisitionNumber: rn,
            caseNo,
            examKey: key,
            formId: formId || undefined,
            token: tok,
            resultGroup: group,
          });
          if (!ok) continue;
          return {
            examKey: key,
            group,
            formId: formId || form?.id || preferredFormId,
            formLabel: form?.shortName || group.examName,
          } satisfies ResolvedVerifyMatch;
        }
      }
    }
    return null;
  };

  const candidates = buildVerifyExamCandidates(requisition, resultMap);

  if (hint?.examKey) {
    const hinted = candidates.filter((c) => c.examKey === hint.examKey);
    for (const c of hinted.length ? hinted : candidates) {
      if (hint.examKey && c.examKey !== hint.examKey && !hinted.length) continue;
      const hit = await tryCandidate(c.examKey, c.group, c.formId);
      if (hit) return hit;
    }
  }

  for (const c of candidates) {
    const hit = await tryCandidate(c.examKey, c.group, c.formId);
    if (hit) return hit;
  }
  return null;
}

const VERIFY_SUMMARY_SKIP = new Set([
  'res_diagnostic_test',
  'res_ck_xpert',
  'res_ck_xpert_ultra',
  'res_ck_truenat_plus',
  'res_ck_truenat_rif',
  'res_ck_tblamp',
  'res_ck_smear',
]);

/** Key result fields shown on the public verify page (non-empty parameters). */
export function summarizeVerifiedResultParameters(
  group?: ExamResultGroup,
  limit = 14
): { key: string; value: string }[] {
  if (!group?.parameters) return [];
  return Object.entries(group.parameters)
    .map(([key, item]) => ({ key, value: String(item?.value ?? '').trim() }))
    .filter(
      (row) =>
        row.value.length > 0 &&
        !VERIFY_SUMMARY_SKIP.has(row.key) &&
        !row.key.endsWith('_license') &&
        !row.key.endsWith('_date')
    )
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(0, limit);
}

export async function verifyOfficialResultToken(input: {
  requisitionNumber: string;
  caseNo: string;
  examKey: string;
  formId?: string;
  token: string;
  resultGroup?: ExamResultGroup;
}): Promise<boolean> {
  const tok = input.token.trim().toUpperCase();
  for (const fp of fingerprintVariants(input.resultGroup)) {
    const expected = await buildOfficialResultVerifyToken({
      requisitionNumber: input.requisitionNumber,
      caseNo: input.caseNo,
      examKey: input.examKey,
      formId: input.formId,
      resultFingerprint: fp,
    });
    if (expected === tok) return true;
  }
  return false;
}
