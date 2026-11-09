import { LabTestRequisition } from '../components/modals/NewRequisitionModal';
import { ExamResultGroup } from '../components/modals/ResultEntryModal';
import { getResultFormForExam } from '../data/resultFormsCatalog';
import { generateSha256Hash } from './qcCalculations';

const VERIFY_PEPPER =
  (import.meta.env.VITE_RESULT_VERIFY_PEPPER as string | undefined) ||
  'ptsi-lab-tis-official-result-v1';

export function resultGroupFingerprint(group?: ExamResultGroup): string {
  if (!group) return '';
  return Object.entries(group.parameters || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}=${String(val?.value ?? '').trim()}`)
    .join(';');
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

/** Match token to a stored exam — used when QR only carries rn + tok. */
export async function resolveVerifiedExamGroup(
  requisition: LabTestRequisition,
  resultMap: Record<string, ExamResultGroup> | undefined,
  token: string,
  hint?: { examKey?: string; formId?: string }
): Promise<ResolvedVerifyMatch | null> {
  if (!resultMap) return null;
  const cn = requisition.caseNo || requisition.externalRef || '';
  const rn = requisition.requisitionNumber || '';
  const tok = token.trim().toUpperCase();

  const tryKey = async (examKey: string, group: ExamResultGroup) => {
    const form = getResultFormForExam(group.examCode || examKey, requisition.patientGender);
    const formId = hint?.formId || form?.id;
    const ok = await verifyOfficialResultToken({
      requisitionNumber: rn,
      caseNo: cn,
      examKey,
      formId,
      token: tok,
      resultGroup: group,
    });
    if (!ok) return null;
    return {
      examKey,
      group,
      formId,
      formLabel: form?.shortName || group.examName,
    } satisfies ResolvedVerifyMatch;
  };

  if (hint?.examKey && resultMap[hint.examKey]) {
    const hit = await tryKey(hint.examKey, resultMap[hint.examKey]);
    if (hit) return hit;
  }

  for (const [examKey, group] of Object.entries(resultMap)) {
    const hit = await tryKey(examKey, group);
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
  const expected = await buildOfficialResultVerifyToken({
    requisitionNumber: input.requisitionNumber,
    caseNo: input.caseNo,
    examKey: input.examKey,
    formId: input.formId,
    resultFingerprint: resultGroupFingerprint(input.resultGroup),
  });
  return expected === input.token.trim().toUpperCase();
}
