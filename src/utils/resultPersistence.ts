import { ExamResultGroup, ResultParamValue } from '../components/modals/ResultEntryModal';
import { LabTestRequisition } from '../components/modals/NewRequisitionModal';
import { getTemplateForExamination, ParameterDef } from '../data/testParametersCatalog';
import { getAllAnalyteRows, resolveEntryForm } from '../data/resultFormsCatalog';

function emptyParamValue(p: ParameterDef, value = ''): ResultParamValue {
  return {
    paramId: p.id,
    paramCode: p.code || p.id.toUpperCase(),
    paramName: p.name || p.id,
    unit: p.unit || '',
    value,
    flag: 'PENDING',
    isCalculated: p.dataType === 'CALCULATED',
  };
}

function ensureParam(
  params: Record<string, ResultParamValue>,
  id: string,
  meta: { name: string; code?: string; defaultValue?: string }
) {
  if (params[id]?.value != null && String(params[id].value).length > 0) return;
  if (!params[id]) {
    params[id] = {
      paramId: id,
      paramCode: meta.code || id.toUpperCase(),
      paramName: meta.name,
      unit: '',
      value: meta.defaultValue ?? '',
      flag: 'PENDING',
      isCalculated: false,
    };
  }
}

/**
 * Ensures every template parameter and official-form field (specimen + analytes) exists
 * before localStorage / Supabase persistence so JSON rows stay complete.
 */
export function normalizeExamResultsForPersistence(
  results: Record<string, ExamResultGroup>,
  requisition?: LabTestRequisition | null
): Record<string, ExamResultGroup> {
  const normalized: Record<string, ExamResultGroup> = {};

  Object.entries(results).forEach(([key, group]) => {
    if (!group) return;
    const template = getTemplateForExamination(group.examName || key);
    const form = resolveEntryForm(
      group.examName || key,
      group.examCode || key,
      requisition?.patientGender
    );
    const params = { ...(group.parameters || {}) };

    (template?.parameters || []).forEach((p) => {
      if (!p) return;
      if (!params[p.id]) {
        params[p.id] = emptyParamValue(p, p.defaultValue ?? '');
      }
    });

    (form?.specimenFields || []).forEach((field) => {
      ensureParam(params, field.id, {
        name: field.label,
        code: field.id.toUpperCase(),
        defaultValue: field.type === 'select' ? '' : '',
      });
      if (field.otherSpecifyOption) {
        ensureParam(params, `${field.id}_other`, {
          name: `${field.label} (specify)`,
          code: `${field.id.toUpperCase()}_OTHER`,
        });
      }
    });

    if (!form) {
      normalized[key] = { ...group, parameters: params };
      return;
    }

    getAllAnalyteRows(form).forEach((row) => {
      const fromTemplate = template?.parameters?.find((p) => p.id === row.id);
      if (fromTemplate && !params[row.id]) {
        params[row.id] = emptyParamValue(fromTemplate, fromTemplate.defaultValue ?? '');
      } else if (!params[row.id]) {
        ensureParam(params, row.id, { name: row.label, code: row.id.toUpperCase() });
      }
      const methodKey = row.examChoiceId || `${row.id}_exam`;
      if (row.examOptions && !params[methodKey]) {
        ensureParam(params, methodKey, { name: `${row.label} method`, code: methodKey.toUpperCase() });
      }
    });

    normalized[key] = { ...group, parameters: params };
  });

  return normalized;
}
