import React, { useMemo, useState, useEffect } from 'react';
import { X, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { LabTestRequisition } from './NewRequisitionModal';
import { ExamResultGroup, ExamExaminers, DEFAULT_EXAMINERS } from './ResultEntryModal';
import { getTemplateForExamination, ExaminationTemplate } from '../../data/testParametersCatalog';
import { getResultFormForExam, getResultFormById, resolveEntryForm } from '../../data/resultFormsCatalog';
import { isSendOutExamination } from '../../data/examinationCatalog';
import { NtpLabRequestForm, NTP_FIELD_KEYS } from '../forms/NtpLabRequestForm';
import { mergeNtpFormDefaults } from '../../utils/ntpFormPrefill';
import {
  hasEnteredResult,
  isResultFormRowExamined,
  isResultFormSectionApplicable,
} from '../../utils/resultDisplay';
import {
  OfficialResultPatientGrid,
  buildOfficialResultPatientRows,
} from '../common/OfficialResultPatientGrid';
import { OfficialResultSignatureFooter } from '../common/OfficialResultSignatureFooter';
import { formatSpecimenSampleDisplay } from '../common/OfficialResultSpecimenFields';
import { OfficialResultVerificationQr } from '../common/OfficialResultVerificationQr';
import { OfficialResultLetterhead } from '../common/OfficialResultLetterhead';
import { resultFormShowsVerifyQr } from '../../utils/resultFormVerifyContext';

interface CoAReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: LabTestRequisition | null;
  embedded?: boolean;
  examResults?: Record<string, ExamResultGroup>;
  medTechInfo?: {
    labTechName?: string;
    rmtName: string;
    rmtLicense: string;
    pathologistName: string;
    pathologistLicense?: string;
    remarks: string;
  };
}

interface ExamSheet {
  index: number;
  examName: string;
  template: ExaminationTemplate;
  examKey: string;
  resultGroup?: ExamResultGroup;
  formLabel: string;
  resolvedFormId?: string;
  memberNames: string[];
}

function resolveExaminers(
  group: ExamResultGroup | undefined,
  fallback?: CoAReportModalProps['medTechInfo']
): ExamExaminers {
  if (group?.examiners) return group.examiners;
  if (fallback) {
    return {
      labTechName: fallback.labTechName,
      rmtName: fallback.rmtName,
      rmtLicense: fallback.rmtLicense,
      pathologistName: fallback.pathologistName,
      pathologistLicense: fallback.pathologistLicense,
    };
  }
  return DEFAULT_EXAMINERS();
}

/** One complete printable result form (header + single exam + signatures) */
const SingleExamFormSheet: React.FC<{
  requisition: LabTestRequisition;
  sheet: ExamSheet;
  examiners: ExamExaminers;
  formIndex: number;
  formTotal: number;
  /** When printing all, add page break after each sheet except last */
  pageBreakAfter?: boolean;
  /** Screen preview: omit redundant index line when tabs are shown */
  hideFormIndexHint?: boolean;
}> = ({
  requisition,
  sheet,
  examiners,
  formIndex,
  formTotal,
  pageBreakAfter,
  hideFormIndexHint,
}) => {
  const tmpl = sheet.template;
  const resultGroup = sheet.resultGroup;
  const rf =
    (sheet.resolvedFormId && getResultFormById(sheet.resolvedFormId)) ||
    getResultFormForExam(tmpl.examCode, requisition.patientGender);
  const readParam = (paramId: string) =>
    String(resultGroup?.parameters?.[paramId]?.value ?? '');

  if (rf?.layoutStyle === 'ntp-request') {
    const ntpValues = mergeNtpFormDefaults(
      Object.fromEntries(
        NTP_FIELD_KEYS.map((key) => [key, resultGroup?.parameters?.[key]?.value || ''])
      ),
      requisition,
      null
    );
    const ntpQr =
      resultFormShowsVerifyQr(rf) ? (
        <OfficialResultVerificationQr
          requisition={requisition}
          examKey={sheet.examKey}
          formId={rf?.id || 'RF-10'}
          formLabel={sheet.formLabel}
          resultGroup={resultGroup}
          compact
          minimal
        />
      ) : null;

    return (
      <div
        className={`p-8 sm:p-10 text-slate-900 bg-white print:p-0 ${
          pageBreakAfter ? 'print-form-page' : 'print-form-page-last'
        }`}
      >
        <NtpLabRequestForm
          values={ntpValues}
          onChange={() => undefined}
          readOnly
          verificationQr={ntpQr}
        />
      </div>
    );
  }

  return (
    <div
      className={`coa-result-sheet p-4 sm:p-6 text-slate-900 bg-white print:p-0 flex flex-col print:min-h-[100vh] ${
        pageBreakAfter ? 'print-form-page' : 'print-form-page-last'
      }`}
    >
      <div className="coa-result-sheet-body space-y-2 print:space-y-1.5 flex-1 min-h-0">
      {!hideFormIndexHint ? (
        <div className="print:hidden text-[10px] font-mono text-slate-500 flex justify-between gap-2">
          <span>
            Form {formIndex + 1} of {formTotal}
          </span>
          <span className="truncate text-right">{sheet.formLabel}</span>
        </div>
      ) : null}

      <OfficialResultLetterhead
        formIndex={formIndex}
        formTotal={formTotal}
        verificationQr={
          resultFormShowsVerifyQr(rf) ? (
            <OfficialResultVerificationQr
              requisition={requisition}
              examKey={sheet.examKey}
              formId={rf?.id}
              formLabel={sheet.formLabel}
              resultGroup={resultGroup}
              compact
              minimal
            />
          ) : null
        }
      />

      <OfficialResultPatientGrid
        rows={buildOfficialResultPatientRows(requisition, {
          formNumber: rf?.formNumber,
          specimenType: tmpl.specimenType,
        })}
      />

      {(() => {
        const sampleType = readParam('sampleType');
        if (!sampleType?.trim()) return null;
        const sampleLabel = formatSpecimenSampleDisplay(
          sampleType,
          readParam('sampleType_other')
        );
        return (
          <p className="text-xs print:text-[10px] text-slate-800 px-0.5 pb-1">
            <span className="font-semibold uppercase tracking-wide text-slate-600">Sample: </span>
            <span className="font-medium">{sampleLabel}</span>
          </p>
        );
      })()}

      {/* Single examination — PTSI forms: TEST | RESULT only (or blood typing centered) */}
      <div className="space-y-2 print:space-y-1">
        {rf?.layoutStyle !== 'blood-typing' && rf?.layoutStyle !== 'pregnancy' ? (
          <h3 className="text-center text-sm print:text-xs font-bold uppercase text-slate-900 tracking-wide border-b border-slate-300 pb-1 mt-1">
            {sheet.formLabel.startsWith('RF-')
              ? (rf?.panelTitle || tmpl.examName)
              : tmpl.examName}
          </h3>
        ) : null}

        {(() => {
          const sections = rf?.resultSections;

          if (rf?.layoutStyle === 'blood-typing') {
            const abo =
              resultGroup?.parameters?.['bt_abo']?.value ||
              resultGroup?.parameters?.['p_abo']?.value ||
              '';
            const rh =
              resultGroup?.parameters?.['bt_rh']?.value ||
              resultGroup?.parameters?.['p_rh']?.value ||
              '';
            const rhDisplay = rh
              ? String(rh).toUpperCase().includes('NEG')
                ? 'RH NEGATIVE'
                : String(rh).toUpperCase().includes('POS')
                  ? 'RH POSITIVE'
                  : String(rh)
              : '—';
            return (
              <div className="py-5 sm:py-7 print:py-8 text-center space-y-2 sm:space-y-3">
                <h3 className="text-[10px] sm:text-xs font-semibold tracking-[0.35em] text-slate-400 uppercase">
                  {rf.panelTitle || 'HEMATOLOGY'}
                </h3>
                <div className="text-xl sm:text-2xl print:text-xl font-bold text-slate-900 tracking-wide leading-tight">
                  &ldquo; {abo || '—'} &rdquo;
                  {rhDisplay !== '—' ? ` ${rhDisplay}` : ''}
                </div>
              </div>
            );
          }

          if (rf?.layoutStyle === 'pregnancy') {
            const result =
              resultGroup?.parameters?.['preg_urine']?.value ||
              resultGroup?.parameters?.['p_preg_res']?.value ||
              '';
            return (
              <div className="py-12 print:py-10 text-center">
                <div className="text-2xl print:text-xl font-bold tracking-wide text-slate-900">
                  RESULT:
                </div>
                <div className="text-lg print:text-base font-semibold text-slate-800 mt-1">
                  (URINE)
                </div>
                <div className="mt-8 text-2xl print:text-xl font-bold tracking-widest text-slate-900">
                  {result || '—'}
                </div>
              </div>
            );
          }

          if (sections && sections.length > 0) {
            const fourCol = rf?.tableColumns === 'test-result-unit-ref';
            return (
              <div className="lims-result-form-table overflow-hidden">
                {fourCol ? (
                  <div className="lims-rf-grid-head grid grid-cols-12 bg-slate-100 text-[11px] print:text-[9px] font-bold uppercase tracking-wide text-slate-700">
                    <div className="col-span-4 px-3 py-1.5">Test</div>
                    <div className="col-span-3 px-3 py-1.5">Result</div>
                    <div className="col-span-2 px-3 py-1.5">Unit</div>
                    <div className="col-span-3 px-3 py-1.5">Ref. Range</div>
                  </div>
                ) : (
                  <div className="lims-rf-grid-head grid grid-cols-2 bg-slate-100 text-[11px] print:text-[9px] font-bold uppercase tracking-wide text-slate-700">
                    <div className="px-3 py-1.5">
                      {rf?.testColumnLabel || 'Test'}
                    </div>
                    <div className="px-3 py-1.5">{rf?.resultColumnLabel || 'Result'}</div>
                  </div>
                )}
                {sections.map((section) => {
                  if (!isResultFormSectionApplicable(section, readParam)) return null;
                  const visibleRows = section.rows.filter((r) =>
                    isResultFormRowExamined(r, readParam)
                  );
                  if (visibleRows.length === 0) return null;
                  return (
                    <div key={section.id}>
                      {section.title ? (
                        <div className="lims-rf-section-label px-3 py-1 bg-slate-50 text-[11px] print:text-[9px] font-bold uppercase text-slate-800">
                          {section.title}
                        </div>
                      ) : null}
                      {visibleRows.map((row) => {
                        const val = resultGroup?.parameters?.[row.id]?.value || '';
                        const methodId = row.examChoiceId || `${row.id}_exam`;
                        const examLabel = row.examOptions
                          ? resultGroup?.parameters?.[methodId]?.value || '—'
                          : row.label;
                        if (fourCol) {
                          return (
                            <div
                              key={row.id}
                              className="lims-rf-grid-row grid grid-cols-12"
                            >
                              <div className="col-span-4 px-3 py-1.5 print:py-1 text-xs print:text-[9px] text-slate-800">
                                {examLabel}
                              </div>
                              <div className="col-span-3 px-3 py-1.5 print:py-1 text-xs print:text-[9px] font-semibold text-slate-900 font-mono">
                                {val || '—'}
                              </div>
                              <div className="col-span-2 px-3 py-1.5 print:py-1 text-xs print:text-[9px] text-slate-700 font-mono">
                                {row.unit || '—'}
                              </div>
                              <div className="col-span-3 px-3 py-1.5 print:py-1 text-xs print:text-[9px] text-slate-700 font-mono">
                                {row.refRange || '—'}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={row.id} className="lims-rf-grid-row grid grid-cols-2">
                            <div className="px-3 py-1.5 print:py-1 text-xs print:text-[9px] text-slate-800">
                              {examLabel}
                            </div>
                            <div className="px-3 py-1.5 print:py-1 text-xs print:text-[9px] font-semibold text-slate-900">
                              {val || '—'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {(sheet.memberNames || []).map((memberName) => {
                  const memberTemplate = getTemplateForExamination(memberName);
                  const covered = new Set(
                    (sections || []).flatMap((section) => section.rows.map((row) => row.id))
                  );
                  const extra = (memberTemplate.parameters || []).filter(
                    (param) =>
                      param &&
                      !covered.has(param.id) &&
                      hasEnteredResult(resultGroup?.parameters?.[param.id]?.value)
                  );
                  if (extra.length === 0) return null;
                  return (
                    <div key={memberTemplate.examCode || memberName}>
                      <div className="lims-rf-section-label px-3 py-1 bg-slate-50 text-[11px] print:text-[9px] font-bold uppercase text-slate-800">
                        {memberTemplate.examName || memberName}
                      </div>
                      {extra.map((param) => {
                        const val = resultGroup?.parameters?.[param.id]?.value || '';
                        const refText =
                          param.normalText ||
                          (param.specMin !== undefined && param.specMax !== undefined
                            ? `${param.specMin} - ${param.specMax}`
                            : '—');
                        if (fourCol) {
                          return (
                            <div
                              key={param.id}
                              className="lims-rf-grid-row grid grid-cols-12"
                            >
                              <div className="col-span-4 px-3 py-1.5 print:py-1 text-xs print:text-[9px] text-slate-800">
                                {param.name}
                              </div>
                              <div className="col-span-3 px-3 py-1.5 print:py-1 text-xs print:text-[9px] font-semibold text-slate-900 font-mono">
                                {val || '—'}
                              </div>
                              <div className="col-span-2 px-3 py-1.5 print:py-1 text-xs print:text-[9px] text-slate-700 font-mono">
                                {param.unit || '—'}
                              </div>
                              <div className="col-span-3 px-3 py-1.5 print:py-1 text-xs print:text-[9px] text-slate-700 font-mono">
                                {refText}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={param.id} className="lims-rf-grid-row grid grid-cols-2">
                            <div className="px-3 py-1.5 print:py-1 text-xs print:text-[9px] text-slate-800">
                              {param.name}
                            </div>
                            <div className="px-3 py-1.5 print:py-1 text-xs print:text-[9px] font-semibold text-slate-900">
                              {val || '—'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          }

          const flatAnalytes =
            rf?.analytes && rf.analytes.length > 0 && !(sections && sections.length > 0);

          if (flatAnalytes && rf?.analytes) {
            return (
              <div className="lims-result-form-table overflow-hidden">
                <div className="lims-rf-grid-head grid grid-cols-2 bg-slate-100 text-[11px] print:text-[9px] font-bold uppercase tracking-wide text-slate-700">
                  <div className="px-3 py-1.5">{rf.testColumnLabel || 'Test'}</div>
                  <div className="px-3 py-1.5">{rf.resultColumnLabel || 'Result'}</div>
                </div>
                {rf.analytes.map((row) => {
                  const val =
                    resultGroup?.parameters?.[row.id]?.value ||
                    (row.id === 'p_koh_res' ? resultGroup?.parameters?.koh?.value : '') ||
                    '';
                  if (!hasEnteredResult(val)) return null;
                  return (
                    <div key={row.id} className="lims-rf-grid-row grid grid-cols-2">
                      <div className="px-3 py-1.5 print:py-1 text-xs print:text-[9px] text-slate-800">
                        {row.label}
                      </div>
                      <div className="px-3 py-1.5 print:py-1 text-xs print:text-[9px] font-semibold text-slate-900">
                        {val || '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          return (
            <table className="w-full text-left text-xs print:text-[9px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-mono text-[10px] print:text-[8px] uppercase border-y border-slate-300">
                  <th className="py-1.5 px-3 print:py-1 print:px-2 w-[50%]">Test</th>
                  <th className="py-1.5 px-3 print:py-1 print:px-2 w-[50%]">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tmpl.parameters.map((param) => {
                  if (param.id === 'sampleType' || param.id === 'sampleType_other') return null;
                  const resItem = resultGroup?.parameters?.[param.id];
                  const val = resItem?.value || '';
                  if (!hasEnteredResult(val)) return null;
                  return (
                    <tr key={param.id}>
                      <td className="py-1.5 px-3 print:py-1 print:px-2 text-slate-900 font-semibold">
                        {param.name}
                      </td>
                      <td className="py-1.5 px-3 print:py-1 print:px-2 font-mono font-bold text-slate-900">
                        {val || '—'}
                        {param.unit ? (
                          <span className="font-normal text-slate-500 ml-1">{param.unit}</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        })()}
      </div>

      <div className="p-2.5 sm:p-3 print:p-2 bg-slate-50 print:bg-white rounded border border-slate-200 text-[9px] sm:text-[10px] print:text-[8px] text-slate-600 font-mono leading-relaxed">
        <strong>LABORATORY ADVISORY:</strong> This official diagnostic report has been verified under
        ISO 15189 / DOH clinical quality assurance standards. Results correspond directly to the
        submitted specimen. This form covers <strong>{tmpl.examName}</strong> only.
      </div>
      </div>

      <footer className="coa-result-sheet-footer mt-6 sm:mt-8 print:mt-auto shrink-0 pt-4 print:pt-6 border-t border-slate-200 print:border-slate-300 space-y-2 print:space-y-1.5">
        <OfficialResultSignatureFooter examiners={examiners} />
        <p className="text-[9px] text-slate-400 text-center font-mono print:pb-1">
          - End of Report — {tmpl.examName} -
        </p>
      </footer>
    </div>
  );
};

export const CoAReportModal: React.FC<CoAReportModalProps> = ({
  isOpen,
  onClose,
  requisition,
  embedded = false,
  examResults,
  medTechInfo,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const sheets: ExamSheet[] = useMemo(() => {
    if (!requisition) return [];
    const examList =
      requisition.kindOfExamination && requisition.kindOfExamination.length > 0
        ? requisition.kindOfExamination
        : requisition.selectedTestNames || ['CBC WITH PLATELET COUNT'];

    const sheets: ExamSheet[] = [];
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
        const group = examResults?.[key];
        if (!group) return;
        mergedGroup = mergedGroup || group;
        Object.entries(group.parameters || {}).forEach(([id, val]) => {
          const prev = mergedParams[id];
          if (!prev || !String(prev.value || '').trim()) mergedParams[id] = val;
          else if (String(val.value || '').trim()) mergedParams[id] = val;
        });
      });
      const memberNames = rf
        ? examList.filter((name, i) => {
            const t = getTemplateForExamination(name);
            return resolveEntryForm(name, t.examCode || `EXAM-${i}`, requisition.patientGender)?.id === rf.id;
          })
        : [examName];
      sheets.push({
        index: sheets.length,
        examName: memberNames.join(' · '),
        memberNames,
        template,
        examKey,
        resultGroup: mergedGroup
          ? { ...mergedGroup, parameters: mergedParams }
          : examResults?.[examKey],
        formLabel: rf ? rf.shortName : `Result — ${template.examName}`,
        resolvedFormId: rf?.id,
      });
    });
    return sheets;
  }, [requisition, examResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [requisition?.id]);

  if (!requisition) return null;
  if (!isOpen && !embedded) return null;

  const activeSheet = sheets[activeIndex] || sheets[0];
  const formTotal = sheets.length;

  const handlePrint = () => {
    window.print();
  };

  const panel = (
      <div
        className={`bg-white w-full overflow-hidden flex flex-col text-slate-900 font-sans print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none print-modal-container ${
          embedded
            ? 'h-full min-h-0 border-0 shadow-none rounded-none'
            : 'rounded-xl shadow-2xl border border-slate-300 max-w-3xl max-h-[92vh]'
        }`}
      >
        {/* Toolbar — screen only */}
        {!embedded ? (
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Official Result Forms
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono shrink-0">
                {formTotal} form{formTotal === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500">
              Preview matches print layout. Use tabs to switch forms; print includes every page.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                Print {formTotal} Form{formTotal === 1 ? '' : 's'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        ) : null}

        {/* Exam form tabs — screen only */}
        {formTotal > 1 && (
          <div className="px-4 pt-3 pb-0 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto print:hidden shrink-0">
            <button
              type="button"
              disabled={activeIndex <= 0}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 flex-1 overflow-x-auto">
              {sheets.map((s, i) => (
                <button
                  key={s.examKey}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-t whitespace-nowrap border border-b-0 cursor-pointer transition-colors ${
                    i === activeIndex
                      ? 'bg-white text-[#0176d3] border-slate-300'
                      : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                  }`}
                >
                  {s.formLabel}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={activeIndex >= formTotal - 1}
              onClick={() => setActiveIndex((i) => Math.min(formTotal - 1, i + 1))}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Screen preview: one form at a time */}
        <div className="overflow-y-auto flex-1 min-h-0 print:hidden bg-slate-200/60 p-3 sm:p-4">
          {formTotal === 0 && (
            <p className="p-8 text-sm text-slate-600 bg-white rounded-lg border border-slate-200 max-w-lg mx-auto">
              Every examination on this request is send-out. There is no in-house result form to print.
            </p>
          )}
          {activeSheet && (
            <div className="max-w-[720px] mx-auto bg-white shadow-md ring-1 ring-slate-300/80 rounded-sm overflow-hidden">
              <SingleExamFormSheet
                requisition={requisition}
                sheet={activeSheet}
                examiners={resolveExaminers(activeSheet.resultGroup, medTechInfo)}
                formIndex={activeIndex}
                formTotal={formTotal}
                hideFormIndexHint={formTotal > 1}
              />
            </div>
          )}
        </div>

        {/* Print: every examination as its own full form / page */}
        <div className="hidden print:block print-coa-forms">
          {sheets.map((sheet, i) => (
            <SingleExamFormSheet
              key={sheet.examKey}
              requisition={requisition}
              sheet={sheet}
              examiners={resolveExaminers(sheet.resultGroup, medTechInfo)}
              formIndex={i}
              formTotal={formTotal}
              pageBreakAfter={i < formTotal - 1}
            />
          ))}
        </div>
      </div>
  );

  if (embedded) return panel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print-modal-backdrop">
      {panel}
    </div>
  );
};
