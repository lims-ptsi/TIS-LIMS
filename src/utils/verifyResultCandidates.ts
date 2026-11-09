import { LabTestRequisition } from '../components/modals/NewRequisitionModal';
import { ExamResultGroup } from '../components/modals/ResultEntryModal';
import { isSendOutExamination } from '../data/examinationCatalog';
import { getTemplateForExamination } from '../data/testParametersCatalog';
import { resolveEntryForm } from '../data/resultFormsCatalog';

export type VerifyExamCandidate = {
  examKey: string;
  group: ExamResultGroup;
  formId?: string;
};

/** Same merge rules as printable CoA sheets — QR tokens are sealed from this shape. */
export function buildVerifyExamCandidates(
  requisition: LabTestRequisition,
  resultMap: Record<string, ExamResultGroup>
): VerifyExamCandidate[] {
  const candidates: VerifyExamCandidate[] = [];
  const seen = new Set<string>();

  const push = (examKey: string, group: ExamResultGroup, formId?: string) => {
    if (!examKey.trim() || !group) return;
    const sig = `${examKey}|${formId || ''}|${group.examCode || ''}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    candidates.push({ examKey, group, formId });
  };

  for (const [mapKey, group] of Object.entries(resultMap)) {
    if (!group) continue;
    push(mapKey, group);
    if (group.examCode && group.examCode !== mapKey) {
      push(group.examCode, group);
    }
  }

  const examList =
    requisition.kindOfExamination && requisition.kindOfExamination.length > 0
      ? requisition.kindOfExamination
      : requisition.selectedTestNames || [];

  const seenFormIds = new Set<string>();
  examList.forEach((examName, idx) => {
    const template = getTemplateForExamination(examName);
    const examKey = template.examCode || `EXAM-${idx}`;
    if (isSendOutExamination(examName, template.examCode || examKey)) return;

    const rf = resolveEntryForm(examName, template.examCode, requisition.patientGender);
    if (rf) {
      if (seenFormIds.has(rf.id)) return;
      seenFormIds.add(rf.id);
    }

    const siblingKeys = rf
      ? examList
          .map((name, i) => {
            const t = getTemplateForExamination(name);
            const code = t.examCode || `EXAM-${i}`;
            const form = resolveEntryForm(name, code, requisition.patientGender);
            return form?.id === rf.id ? code : '';
          })
          .filter(Boolean)
      : [examKey];

    const mergedParams: ExamResultGroup['parameters'] = {};
    let mergedGroup: ExamResultGroup | undefined;
    siblingKeys.forEach((key) => {
      const g = resultMap[key];
      if (!g) return;
      mergedGroup = mergedGroup || g;
      Object.entries(g.parameters || {}).forEach(([id, val]) => {
        const prev = mergedParams[id];
        if (!prev || !String(prev.value || '').trim()) mergedParams[id] = val;
        else if (String(val.value || '').trim()) mergedParams[id] = val;
      });
    });

    const group =
      mergedGroup && Object.keys(mergedParams).length > 0
        ? { ...mergedGroup, parameters: mergedParams }
        : resultMap[examKey];
    if (!group) return;

    push(examKey, group, rf?.id);
  });

  return candidates;
}
