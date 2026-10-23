import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  Printer,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LabTestRequisition } from './NewRequisitionModal';
import { ExamResultGroup, ExamExaminers, DEFAULT_EXAMINERS } from './ResultEntryModal';
import { getTemplateForExamination, ExaminationTemplate } from '../../data/testParametersCatalog';
import { getResultFormForExam, getResultFormById, resolveEntryForm } from '../../data/resultFormsCatalog';
import { isSendOutExamination } from '../../data/examinationCatalog';
import { NtpLabRequestForm, NTP_FIELD_KEYS } from '../forms/NtpLabRequestForm';

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
}> = ({ requisition, sheet, examiners, formIndex, formTotal, pageBreakAfter }) => {
  const tmpl = sheet.template;
  const resultGroup = sheet.resultGroup;
  const rf =
    (sheet.resolvedFormId && getResultFormById(sheet.resolvedFormId)) ||
    getResultFormForExam(tmpl.examCode, requisition.patientGender);
  const hideEmpty = Boolean(rf?.hideEmptyResultsOnPrint);

  if (rf?.layoutStyle === 'ntp-request') {
    const ntpValues = Object.fromEntries(
      NTP_FIELD_KEYS.map((key) => [key, resultGroup?.parameters?.[key]?.value || ''])
    );
    return (
      <div
        className={`p-8 sm:p-10 text-slate-900 bg-white print:p-0 ${
          pageBreakAfter ? 'print-form-page' : 'print-form-page-last'
        }`}
      >
        <NtpLabRequestForm values={ntpValues} onChange={() => undefined} readOnly />
      </div>
    );
  }

  return (
    <div
      className={`p-8 sm:p-10 space-y-5 text-slate-900 bg-white print:p-0 print:space-y-3 ${
        pageBreakAfter ? 'print-form-page' : 'print-form-page-last'
      }`}
    >
      {/* Form index badge (screen only) */}
      <div className="print:hidden text-[10px] font-mono text-slate-500 flex justify-between">
        <span>
          Separate result form {formIndex + 1} of {formTotal}
        </span>
        <span>{sheet.formLabel}</span>
      </div>

      {/* Letterhead */}
      <div className="border-b-2 border-slate-900 pb-4 print:pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/ptsilogo.png"
              alt="PTSI Official Seal"
              className="h-20 w-auto print:h-14 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-base sm:text-lg print:text-sm font-black tracking-tight text-slate-900 uppercase font-serif">
                Philippine Tuberculosis Society, Inc.
              </h1>
              <h2 className="text-xs sm:text-sm print:text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Clinical Diagnostic Laboratory &amp; Chest Center
              </h2>
              <p className="text-[11px] print:text-[9px] text-slate-600">
                Quezon Institute Compound, E. Rodriguez Sr. Avenue, Quezon City · Tel: (02) 0000 - 0000
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs print:text-[9.5px] rounded uppercase tracking-wider">
              OFFICIAL RESULT
            </div>
            <div className="text-xs print:text-[10px] font-mono font-bold text-slate-800 mt-1">
              CASE: {requisition.caseNo || requisition.externalRef || 'CASE-2026-AUTO'}
            </div>
            <div className="text-[10px] print:text-[8.5px] text-slate-500 font-mono">
              REF: {requisition.requisitionNumber}
            </div>
            <div className="text-[10px] print:text-[8px] text-slate-500 font-mono mt-0.5">
              Form {formIndex + 1}/{formTotal}
            </div>
          </div>
        </div>
      </div>

      {/* Patient demographics — Form 5 compact; otherwise PTSI 3-column grid */}
      <div className="text-[10px] print:text-[8px] leading-tight">
        <div className="grid grid-cols-12 gap-x-2 gap-y-0.5">
          {(rf?.formNumber === 9
            ? ([
                ['Lab. No.', requisition.caseNo || requisition.requisitionNumber || '—', 6],
                [
                  'Age/Sex',
                  [
                    requisition.patientAge != null ? String(requisition.patientAge) : '',
                    requisition.patientGender || '',
                  ]
                    .filter(Boolean)
                    .join(' / ') || '—',
                  6,
                ],
                ['Name', (requisition.patientOrSubjectName || '—').toUpperCase(), 6],
                ['Date Submitted', requisition.requestDate || '—', 6],
                ['Requesting Physician', requisition.orderingPhysicianOrPI || '—', 6],
                [
                  'Date Released',
                  new Date().toISOString().replace('T', ' ').substring(0, 16),
                  6,
                ],
                ['Specimen', tmpl.specimenType || '—', 6],
                [
                  'Source',
                  requisition.organizationOrClient && requisition.organizationOrClient !== 'N/A'
                    ? requisition.organizationOrClient
                    : '—',
                  6,
                ],
              ] as [string, string, number][])
            : rf?.layoutStyle === 'blood-typing' || rf?.layoutStyle === 'pregnancy'
            ? ([
                ['Name', (requisition.patientOrSubjectName || '—').toUpperCase(), 6],
                [
                  'Age',
                  requisition.patientAge != null ? String(requisition.patientAge) : '—',
                  3,
                ],
                ['Date', requisition.requestDate || '—', 3],
                ['Requesting Physician', requisition.orderingPhysicianOrPI || '—', 6],
                ['Sex', requisition.patientGender || '—', 3],
                [
                  'Ward',
                  requisition.organizationOrClient && requisition.organizationOrClient !== 'N/A'
                    ? requisition.organizationOrClient
                    : requisition.patientCategory || '—',
                  3,
                ],
              ] as [string, string, number][])
            : ([
                ['Patient Name', (requisition.patientOrSubjectName || '—').toUpperCase(), 4],
                ['Phone#', '—', 4],
                [
                  'OR#',
                  requisition.orNumber && requisition.orNumber !== 'N/A' ? requisition.orNumber : '—',
                  4,
                ],
                ['Patient ID No', requisition.caseNo || requisition.externalRef || '—', 4],
                [
                  'Age',
                  requisition.patientAge != null ? String(requisition.patientAge) : '—',
                  4,
                ],
                ['Collected', requisition.requestDate || '—', 4],
                [
                  'Hospital/Clinic',
                  requisition.organizationOrClient && requisition.organizationOrClient !== 'N/A'
                    ? requisition.organizationOrClient
                    : requisition.patientCategory || '—',
                  4,
                ],
                ['Birthdate', requisition.patientDob || '—', 4],
                [
                  'Release date',
                  new Date().toISOString().replace('T', ' ').substring(0, 16),
                  4,
                ],
                ['Referring MD', requisition.orderingPhysicianOrPI || '—', 4],
                ['Gender', requisition.patientGender || '—', 4],
                ['Barcode', requisition.requisitionNumber || '—', 4],
              ] as [string, string, number][])
          ).map(([label, value, span]) => (
            <div
              key={label}
              className="flex items-baseline gap-1 min-w-0 py-0.5"
              style={{ gridColumn: `span ${span} / span ${span}` }}
            >
              <span className="text-slate-500 font-semibold shrink-0 whitespace-nowrap">
                {label}:
              </span>
              <span className="font-bold text-slate-900 truncate uppercase">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Single examination — PTSI forms: TEST | RESULT only (or blood typing centered) */}
      <div className="space-y-2 print:space-y-1">
        {rf?.layoutStyle !== 'blood-typing' && rf?.layoutStyle !== 'pregnancy' ? (
          <h3 className="text-center text-sm print:text-xs font-black uppercase text-slate-900 tracking-widest border-b-2 border-slate-800 pb-1">
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
              <div className="py-10 print:py-8 text-center space-y-4">
                <h3 className="text-xs font-semibold tracking-[0.35em] text-slate-400 uppercase">
                  {rf.panelTitle || 'HEMATOLOGY'}
                </h3>
                <div className="text-2xl print:text-xl font-bold text-slate-900 tracking-wide">
                  &ldquo; {abo || '—'} &rdquo; RH: {rhDisplay}
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
                  const sectionHasValue = section.rows.some(
                    (r) => String(resultGroup?.parameters?.[r.id]?.value || '').trim() !== ''
                  );
                  return (
                    <div
                      key={section.id}
                      className={hideEmpty && !sectionHasValue ? 'print:hidden' : undefined}
                    >
                      {section.title ? (
                        <div className="lims-rf-section-label px-3 py-1 bg-slate-50 text-[11px] print:text-[9px] font-bold uppercase text-slate-800">
                          {section.title}
                        </div>
                      ) : null}
                      {section.rows.map((row) => {
                        const val = resultGroup?.parameters?.[row.id]?.value || '';
                        const methodId = row.examChoiceId || `${row.id}_exam`;
                        const examLabel = row.examOptions
                          ? resultGroup?.parameters?.[methodId]?.value || '—'
                          : row.label;
                        const emptyPrintHide = hideEmpty && !String(val).trim();
                        if (fourCol) {
                          return (
                            <div
                              key={row.id}
                              className={`lims-rf-grid-row grid grid-cols-12 ${
                                emptyPrintHide ? 'print:hidden' : ''
                              }`}
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
                          <div
                            key={row.id}
                            className={`lims-rf-grid-row grid grid-cols-2 ${
                              emptyPrintHide ? 'print:hidden' : ''
                            }`}
                          >
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
                    (param) => param && !covered.has(param.id)
                  );
                  if (extra.length === 0) return null;
                  return (
                    <div key={memberTemplate.examCode || memberName}>
                      <div className="lims-rf-section-label px-3 py-1 bg-slate-50 text-[11px] print:text-[9px] font-bold uppercase text-slate-800">
                        {memberTemplate.examName || memberName}
                      </div>
                      {extra.map((param) => {
                        const val = resultGroup?.parameters?.[param.id]?.value || '';
                        const emptyPrintHide = hideEmpty && !String(val).trim();
                        const refText =
                          param.normalText ||
                          (param.specMin !== undefined && param.specMax !== undefined
                            ? `${param.specMin} - ${param.specMax}`
                            : '—');
                        if (fourCol) {
                          return (
                            <div
                              key={param.id}
                              className={`lims-rf-grid-row grid grid-cols-12 ${
                                emptyPrintHide ? 'print:hidden' : ''
                              }`}
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
                          <div
                            key={param.id}
                            className={`lims-rf-grid-row grid grid-cols-2 ${
                              emptyPrintHide ? 'print:hidden' : ''
                            }`}
                          >
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
                  const resItem = resultGroup?.parameters?.[param.id];
                  const val = resItem?.value || '';
                  const emptyPrintHide = hideEmpty && !String(val).trim();
                  return (
                    <tr
                      key={param.id}
                      className={emptyPrintHide ? 'print:hidden' : undefined}
                    >
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

      <div className="p-3 print:p-2 bg-slate-50 print:bg-white rounded border border-slate-200 text-[10px] print:text-[8px] text-slate-600 font-mono leading-relaxed">
        <strong>LABORATORY ADVISORY:</strong> This official diagnostic report has been verified under
        ISO 15189 / DOH clinical quality assurance standards. Results correspond directly to the
        submitted specimen. This form covers <strong>{tmpl.examName}</strong> only.
      </div>

      {/* Signatures for THIS examination only */}
      {rf?.layoutStyle === 'blood-typing' || rf?.layoutStyle === 'pregnancy' ? (
        <div className="grid grid-cols-3 gap-6 print:gap-4 pt-10 print:pt-8 items-end">
          {[
            { name: examiners.rmtName || examiners.labTechName, license: examiners.rmtLicense, role: 'NAME, RMT' },
            { name: examiners.rmtName, license: examiners.rmtLicense, role: 'NAME, RMT' },
            { name: examiners.pathologistName, license: examiners.pathologistLicense, role: 'NAME, MD' },
          ].map((sig, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="border-b border-slate-700 min-h-[2rem] flex items-end justify-center pb-1">
                <span className="font-serif italic text-sm print:text-xs text-slate-900">
                  {sig.name || ''}
                </span>
              </div>
              <div className="text-[11px] print:text-[9px] font-bold text-slate-800 uppercase tracking-wide">
                {sig.role}
              </div>
              <div className="text-[10px] print:text-[8px] text-slate-600">
                Lic. No. {sig.license || '____________'}
              </div>
            </div>
          ))}
        </div>
      ) : rf?.formNumber === 9 ? (
        <div className="grid grid-cols-3 gap-6 print:gap-4 pt-10 print:pt-8 items-end">
          {(rf.signatures || []).map((sig) => (
            <div key={sig.id} className="text-center space-y-1">
              <div className="border-b border-slate-700 min-h-[2rem] flex items-end justify-center pb-1">
                <span className="font-serif italic text-sm print:text-xs text-slate-900">
                  {sig.defaultName || ''}
                </span>
              </div>
              <div className="text-[11px] print:text-[9px] font-bold text-slate-800">
                {sig.label}
              </div>
              <div className="text-[10px] print:text-[8px] text-slate-600">
                License No. {sig.defaultLicense || '____________'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 print:gap-3 pt-6 print:pt-3 border-t-2 border-slate-900 items-end">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] print:text-[8px] text-slate-500 font-mono uppercase block">
              Laboratory Technician
            </span>
            <div className="font-serif italic font-bold text-sm print:text-xs text-slate-900 border-b border-slate-400 pb-1 min-h-[1.5rem]">
              {examiners.labTechName || '—'}
            </div>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] print:text-[8px] text-slate-500 font-mono uppercase block">
              Medical Technologist
            </span>
            <div className="font-serif italic font-bold text-sm print:text-xs text-slate-900 border-b border-slate-400 pb-1">
              {examiners.rmtName}
            </div>
            <p className="text-[10px] print:text-[8px] text-slate-500 font-mono">
              {examiners.rmtLicense}
            </p>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] print:text-[8px] text-slate-500 font-mono uppercase block">
              Pathologist
            </span>
            <div className="font-serif italic font-bold text-sm print:text-xs text-slate-900 border-b border-slate-400 pb-1">
              {examiners.pathologistName}
            </div>
            <p className="text-[10px] print:text-[8px] text-slate-500 font-mono">
              {examiners.pathologistLicense || '—'}
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2 col-span-2 sm:col-span-1">
            <div className="w-12 h-12 print:w-10 print:h-10 bg-white p-1 rounded border border-slate-300 flex items-center justify-center shrink-0">
              <QrCode className="w-10 h-10 print:w-8 print:h-8 text-slate-900" />
            </div>
            <div className="text-[9px] print:text-[7.5px] text-slate-500 font-mono text-left">
              <div className="font-bold text-slate-800">PTSI VERIFIED</div>
              <div>Digital Cryptographic Seal</div>
            </div>
          </div>
        </div>
      )}

      <p className="text-[9px] text-slate-400 text-center font-mono pt-2">
        - End of Report — {tmpl.examName} -
      </p>
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
            : 'rounded-xl shadow-2xl border border-slate-300 max-w-4xl max-h-[95vh]'
        }`}
      >
        {/* Toolbar — screen only */}
        {!embedded ? (
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-800">
                Official Result Forms
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono">
                {formTotal} separate form{formTotal === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Each examination prints as its own form (not combined). Preview one at a time; print
              outputs all forms on separate pages.
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
        <div className="overflow-y-auto flex-1 print:hidden">
          {formTotal === 0 && (
            <p className="p-8 text-sm text-slate-600">
              Every examination on this request is send-out. There is no in-house result form to print.
            </p>
          )}
          {activeSheet && (
            <SingleExamFormSheet
              requisition={requisition}
              sheet={activeSheet}
              examiners={resolveExaminers(activeSheet.resultGroup, medTechInfo)}
              formIndex={activeIndex}
              formTotal={formTotal}
            />
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
