import React, { useMemo, useState, useCallback } from 'react';
import {
  FileText,
  Printer,
  RotateCcw,
  ClipboardList,
  CheckCircle2,
  QrCode,
} from 'lucide-react';
import {
  RESULT_FORMS,
  ResultFormDefinition,
  ResultFormHeaderField,
  ResultFormSpecimenField,
  ResultFormAnalyteRow,
  getResultFormById,
  getAllAnalyteRows,
  examChoiceKey,
  resultOptionsForRow,
} from '../../data/resultFormsCatalog';
import { NtpLabRequestForm } from '../forms/NtpLabRequestForm';

interface ResultFormsViewProps {
  currentUserName?: string;
}

type FormValues = Record<string, string>;

const inputUnderline =
  'w-full border-0 bg-transparent px-0 py-0 text-[11px] print:text-[9px] font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0176d3]';

function blankValues(form: ResultFormDefinition): FormValues {
  const values: FormValues = {};
  const today = new Date().toISOString().split('T')[0];

  form.headerFields.forEach((f) => {
    values[f.id] = f.type === 'date' ? today : '';
    if (f.otherSpecifyOption) values[`${f.id}_other`] = '';
  });
  if (form.genderVariant === 'male') values.gender = 'Male';
  if (form.genderVariant === 'female') values.gender = 'Female';
  (form.specimenFields || []).forEach((f) => {
    values[f.id] = f.type === 'date' ? today : '';
    if (f.otherSpecifyOption) values[`${f.id}_other`] = '';
  });
  getAllAnalyteRows(form).forEach((a) => {
    values[`${a.id}_result`] = '';
    if (a.hasAtTime) values[`${a.id}_at`] = '';
  });
  if (form.showRemarks) values.remarks = '';
  form.signatures.forEach((s) => {
    values[`${s.id}_name`] = s.defaultName || '';
    if (s.showDate) values[`${s.id}_date`] = '';
    if (s.showLicense) values[`${s.id}_license`] = s.defaultLicense || '';
  });
  return values;
}

function FieldControl({
  field,
  value,
  otherValue,
  onChange,
}: {
  field: ResultFormHeaderField | ResultFormSpecimenField;
  value: string;
  otherValue?: string;
  onChange: (key: string, val: string) => void;
}) {
  const otherOpt =
    'otherSpecifyOption' in field ? field.otherSpecifyOption : undefined;
  const showOther = Boolean(otherOpt && value === otherOpt);

  return (
    <div className="flex flex-col gap-1.5">
      {field.type === 'select' ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={inputUnderline}
        >
          <option value="">—</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={field.placeholder}
          rows={2}
          className="w-full border border-slate-300 rounded-sm px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0176d3] resize-y print:border-slate-800"
        />
      ) : (
        <input
          type={field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={field.placeholder}
          className={inputUnderline}
        />
      )}
      {showOther && (
        <input
          type="text"
          value={otherValue || ''}
          onChange={(e) => onChange(`${field.id}_other`, e.target.value)}
          placeholder={field.placeholder || 'Please specify'}
          className={inputUnderline}
        />
      )}
    </div>
  );
}

function AnalyteResultInput({
  analyte,
  value,
  onChange,
}: {
  analyte: ResultFormAnalyteRow;
  value: string;
  onChange: (val: string) => void;
}) {
  if (analyte.resultType === 'select') {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0176d3] print:border-slate-800"
      >
        <option value="">{analyte.placeholder || '—'}</option>
        {(analyte.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  if (analyte.resultType === 'textarea') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={analyte.placeholder}
        rows={2}
        className="w-full border border-slate-300 rounded-sm px-2 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3] resize-y print:border-slate-800"
      />
    );
  }
  return (
    <input
      type={analyte.resultType === 'numeric' ? 'number' : 'text'}
      step={analyte.resultType === 'numeric' ? 'any' : undefined}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={analyte.placeholder}
      className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3] print:border-slate-800"
    />
  );
}

export const ResultFormsView: React.FC<ResultFormsViewProps> = ({
  currentUserName = '',
}) => {
  const [selectedId, setSelectedId] = useState(RESULT_FORMS[0]?.id || 'RF-01');
  const activeForm = useMemo(
    () => getResultFormById(selectedId) || RESULT_FORMS[0],
    [selectedId]
  );

  const [values, setValues] = useState<FormValues>(() =>
    blankValues(RESULT_FORMS[0])
  );

  const handleSelectForm = useCallback((id: string) => {
    const next = getResultFormById(id);
    if (!next) return;
    setSelectedId(id);
    setValues(blankValues(next));
  }, []);

  const setField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (!activeForm) return;
    setValues(blankValues(activeForm));
  };

  const handlePrint = () => {
    window.print();
  };

  if (!activeForm) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No result forms configured yet.
      </div>
    );
  }

  const specimenFields = activeForm.specimenFields || [];
  const flatAnalytes = activeForm.analytes || [];
  const sections = activeForm.resultSections || [];
  const isSectioned = sections.length > 0;
  const hideEmpty = Boolean(activeForm.hideEmptyResultsOnPrint);
  const sigCols =
    activeForm.signatures.length >= 3
      ? 'sm:grid-cols-3'
      : 'sm:grid-cols-2';

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16 text-slate-900">
      {/* Header */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Laboratory Reporting</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold border border-emerald-200">
                RESULT FORMS
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Result Forms
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Fillable printable laboratory result sheets (patient header, examination, signatures).
              {hideEmpty && (
                <span className="ml-1 text-amber-700">
                  Print hides empty test rows.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0176d3] hover:bg-[#014486] text-white text-xs font-bold rounded shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sidebar */}
        <aside className="lg:col-span-3 print:hidden">
          <div className="bg-white border border-[#d8dde6] rounded-md shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-[#e5e7eb] bg-slate-50">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Available Forms ({RESULT_FORMS.length})
              </span>
            </div>
            <ul className="divide-y divide-[#eef1f6]">
              {RESULT_FORMS.map((form) => {
                const selected = form.id === selectedId;
                return (
                  <li key={form.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectForm(form.id)}
                      className={`w-full text-left px-3 py-2.5 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#eef4ff] border-l-2 border-l-[#0176d3]'
                          : 'hover:bg-slate-50 border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText
                          className={`w-3.5 h-3.5 shrink-0 ${
                            selected ? 'text-[#0176d3]' : 'text-slate-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <div
                            className={`text-xs font-bold truncate ${
                              selected ? 'text-[#0176d3]' : 'text-slate-800'
                            }`}
                          >
                            {form.shortName}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {form.description}
                          </div>
                        </div>
                        {selected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0176d3] ml-auto shrink-0" />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Printable form sheet */}
        <div className="lg:col-span-9">
          <div className="bg-white border border-[#d8dde6] rounded-md shadow-sm p-5 sm:p-7 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none">
            {activeForm.layoutStyle === 'ntp-request' ? (
              <NtpLabRequestForm values={values} onChange={setField} />
            ) : (
            <>
            {/* Org / PTSI header */}
            {activeForm.orgHeader ? (
              <div
                className={`flex items-start justify-between gap-3 pb-3 mb-4 ${
                  activeForm.layoutStyle === 'blood-typing' ||
                  activeForm.layoutStyle === 'pregnancy'
                    ? 'border border-slate-800 p-2 sm:p-3'
                    : 'border-b border-slate-300'
                }`}
              >
                <div className="w-12 h-12 rounded-full border-2 border-slate-400 flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0 print:w-10 print:h-10 overflow-hidden">
                  <img
                    src="/ptsilogo.png"
                    alt="PTSI"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.textContent = 'PTSI';
                    }}
                  />
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm sm:text-base font-bold tracking-wide text-slate-900 uppercase">
                    {activeForm.orgHeader.name}
                  </div>
                  {activeForm.orgHeader.subtitle ? (
                    <div className="text-xs sm:text-sm italic font-serif text-slate-800 mt-0.5 uppercase tracking-wide">
                      {activeForm.orgHeader.subtitle}
                    </div>
                  ) : null}
                  {activeForm.layoutStyle === 'blood-typing' ||
                  activeForm.layoutStyle === 'pregnancy' ? (
                    <div className="text-sm text-slate-900 mt-1 font-medium">
                      {activeForm.title}
                    </div>
                  ) : activeForm.orgHeader.address ? (
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {activeForm.orgHeader.address}
                    </div>
                  ) : null}
                </div>
                {activeForm.orgHeader.showQr ? (
                  <div className="w-12 h-12 border border-slate-300 rounded flex items-center justify-center shrink-0 print:w-10 print:h-10">
                    <QrCode className="w-8 h-8 text-slate-700" />
                  </div>
                ) : (
                  <div className="w-12 shrink-0" />
                )}
              </div>
            ) : (
              <div className="text-center border-b-2 border-slate-800 pb-3 mb-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Laboratory Result Report
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {activeForm.title}
                </h2>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Form No. {String(activeForm.formNumber).padStart(2, '0')} · {activeForm.id}
                </div>
              </div>
            )}

            {activeForm.panelTitle && activeForm.panelTitlePlacement === 'below-org' ? (
              <h2 className="text-center text-sm sm:text-base font-bold tracking-wide text-slate-900 mb-3 uppercase">
                {activeForm.panelTitle}
              </h2>
            ) : null}

            {/* Patient header — compact PTSI 3-column layout (all forms) */}
            <section className="mb-3 text-[10px] print:text-[8px] leading-tight">
              <div className="grid grid-cols-12 gap-x-2 gap-y-0.5">
                {activeForm.headerFields.map((field) => {
                  const span = field.span ?? 4;
                  return (
                    <div
                      key={field.id}
                      className="flex items-baseline gap-1 min-w-0 py-0.5 border-b border-slate-200"
                      style={{ gridColumn: `span ${span} / span ${span}` }}
                    >
                      <label className="text-slate-500 font-semibold shrink-0 whitespace-nowrap">
                        {field.label}:
                        {field.required ? <span className="text-rose-600">*</span> : null}
                      </label>
                      <div className="flex-1 min-w-0">
                        <FieldControl
                          field={field}
                          value={values[field.id] || ''}
                          otherValue={values[`${field.id}_other`] || ''}
                          onChange={setField}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Specimen block (Forms 1–2 style) */}
            {specimenFields.length > 0 && (
              <section className="mb-5 border border-slate-300 rounded-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                    Specimen &amp; Accession
                  </span>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-12 gap-x-4 gap-y-3">
                    {specimenFields.map((field) => {
                      const span = field.span ?? 6;
                      return (
                        <div
                          key={field.id}
                          className="flex flex-col gap-0.5"
                          style={{ gridColumn: `span ${span} / span ${span}` }}
                        >
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                            {field.label}
                            {field.required ? <span className="text-rose-600"> *</span> : null}
                          </label>
                          <FieldControl
                            field={field}
                            value={values[field.id] || ''}
                            otherValue={values[`${field.id}_other`] || ''}
                            onChange={setField}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Sectioned panels (Forms 3–4: TEST|RESULT; Form 6: TEST|RESULT|UNIT|REF) */}
            {isSectioned && (
              <section className="mb-5">
                {activeForm.panelTitle && activeForm.panelTitlePlacement !== 'below-org' && (
                  <h3 className="text-center text-base font-bold tracking-widest text-slate-900 mb-2 uppercase">
                    {activeForm.panelTitle}
                  </h3>
                )}
                {activeForm.genderVariant ? (
                  <div className="text-center text-[10px] text-slate-500 mb-2 uppercase tracking-wide">
                    Reference: {activeForm.genderVariant === 'male' ? 'Male' : 'Female'}
                  </div>
                ) : null}
                <div className="border border-slate-400 overflow-hidden">
                  {activeForm.tableColumns === 'test-result-unit-ref' ? (
                    <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-400 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      <div className="col-span-4 px-3 py-1.5 border-r border-slate-400">Test</div>
                      <div className="col-span-3 px-3 py-1.5 border-r border-slate-400">Result</div>
                      <div className="col-span-2 px-3 py-1.5 border-r border-slate-400">Unit</div>
                      <div className="col-span-3 px-3 py-1.5">Ref. Range</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-400 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      <div className="px-3 py-1.5 border-r border-slate-400">
                        {activeForm.testColumnLabel || 'Test'}
                      </div>
                      <div className="px-3 py-1.5">{activeForm.resultColumnLabel || 'Result'}</div>
                    </div>
                  )}
                  {sections.map((section) => {
                    const sectionHasAnyValue = section.rows.some(
                      (r) => (values[`${r.id}_result`] || '').trim() !== ''
                    );
                    return (
                      <div
                        key={section.id}
                        className={
                          hideEmpty && !sectionHasAnyValue
                            ? 'print:hidden'
                            : undefined
                        }
                      >
                        {section.title ? (
                          <div className="px-3 py-1 bg-slate-50 border-b border-slate-300 text-[11px] font-bold uppercase text-slate-800 tracking-wide">
                            {section.title}
                          </div>
                        ) : null}
                        {section.rows.map((row) => {
                          const val = (values[`${row.id}_result`] || '').trim();
                          const emptyPrintHide = hideEmpty && !val;
                          if (activeForm.tableColumns === 'test-result-unit-ref') {
                            return (
                              <div
                                key={row.id}
                                className={`grid grid-cols-12 border-b border-slate-200 last:border-b-0 ${
                                  emptyPrintHide ? 'print:hidden' : ''
                                }`}
                              >
                                <div className="col-span-4 px-3 py-1.5 border-r border-slate-200 text-sm text-slate-800">
                                  {row.label}
                                </div>
                                <div className="col-span-3 px-2 py-1 border-r border-slate-200">
                                  <AnalyteResultInput
                                    analyte={row}
                                    value={values[`${row.id}_result`] || ''}
                                    onChange={(v) => setField(`${row.id}_result`, v)}
                                  />
                                </div>
                                <div className="col-span-2 px-3 py-1.5 border-r border-slate-200 text-xs text-slate-700 font-mono">
                                  {row.unit || '—'}
                                </div>
                                <div className="col-span-3 px-3 py-1.5 text-xs text-slate-700 font-mono">
                                  {row.refRange || '—'}
                                </div>
                              </div>
                            );
                          }
                          const examKey = examChoiceKey(row);
                          const examChoice = values[examKey] || '';
                          const resultChoices = resultOptionsForRow(row, examChoice);
                          return (
                            <div
                              key={row.id}
                              className={`grid grid-cols-2 border-b border-slate-200 last:border-b-0 ${
                                emptyPrintHide ? 'print:hidden' : ''
                              }`}
                            >
                              <div className="px-3 py-1.5 border-r border-slate-200 text-sm text-slate-800">
                                {row.examOptions ? (
                                  <select
                                    value={examChoice}
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      setField(examKey, next);
                                      const allowed = resultOptionsForRow(row, next);
                                      const current = values[`${row.id}_result`] || '';
                                      if (current && !allowed.includes(current)) {
                                        setField(`${row.id}_result`, '');
                                      }
                                    }}
                                    className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3]"
                                    aria-label="Culture method"
                                  >
                                    <option value="">—</option>
                                    {row.examOptions.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  row.label
                                )}
                              </div>
                              <div className="px-2 py-1">
                                <AnalyteResultInput
                                  analyte={{ ...row, options: resultChoices }}
                                  value={values[`${row.id}_result`] || ''}
                                  onChange={(v) => setField(`${row.id}_result`, v)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Blood Typing — centered ABO + Rh (Form 5) */}
            {activeForm.layoutStyle === 'blood-typing' && flatAnalytes.length > 0 && (
              <section className="mb-10 py-8 sm:py-12">
                {activeForm.panelTitle ? (
                  <h3 className="text-center text-xs font-semibold tracking-[0.35em] text-slate-400 mb-6 uppercase">
                    {activeForm.panelTitle}
                  </h3>
                ) : null}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-xl sm:text-2xl font-bold text-slate-900 tracking-wide">
                  <span className="text-slate-400 select-none" aria-hidden>
                    &ldquo;
                  </span>
                  {(() => {
                    const abo = flatAnalytes.find((a) => a.id === 'bt_abo') || flatAnalytes[0];
                    const rh = flatAnalytes.find((a) => a.id === 'bt_rh') || flatAnalytes[1];
                    return (
                      <>
                        <select
                          value={values[`${abo.id}_result`] || ''}
                          onChange={(e) => setField(`${abo.id}_result`, e.target.value)}
                          className="min-w-[4.5rem] border-0 border-b-2 border-slate-700 bg-transparent px-2 py-1 text-center text-xl sm:text-2xl font-bold text-slate-900 focus:outline-none focus:border-[#0176d3] print:border-slate-900 appearance-auto"
                          aria-label="Blood type ABO"
                        >
                          <option value="">—</option>
                          {(abo.options || ['A', 'B', 'AB', 'O']).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-400 select-none" aria-hidden>
                          &rdquo;
                        </span>
                        {rh ? (
                          <>
                            <span className="font-bold tracking-wider">RH:</span>
                            <select
                              value={values[`${rh.id}_result`] || ''}
                              onChange={(e) => setField(`${rh.id}_result`, e.target.value)}
                              className="min-w-[11rem] border-0 border-b-2 border-slate-700 bg-transparent px-2 py-1 text-center text-lg sm:text-xl font-bold text-slate-900 focus:outline-none focus:border-[#0176d3] print:border-slate-900"
                              aria-label="Rh factor"
                            >
                              <option value="">—</option>
                              {(rh.options || ['RH POSITIVE', 'RH NEGATIVE']).map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              </section>
            )}

            {/* Pregnancy Test — centered RESULT (URINE) (Form 7) */}
            {activeForm.layoutStyle === 'pregnancy' && flatAnalytes.length > 0 && (
              <section className="mb-16 py-10 sm:py-16 text-center">
                <div className="text-xl sm:text-2xl font-bold tracking-wide text-slate-900">
                  RESULT:
                </div>
                <div className="text-base sm:text-lg font-semibold text-slate-800 mt-1">
                  (URINE)
                </div>
                <div className="mt-8 flex justify-center">
                  {(() => {
                    const row = flatAnalytes[0];
                    return (
                      <select
                        value={values[`${row.id}_result`] || ''}
                        onChange={(e) => setField(`${row.id}_result`, e.target.value)}
                        className="min-w-[12rem] border-0 border-b-2 border-slate-700 bg-transparent px-3 py-1 text-center text-xl font-bold tracking-wide text-slate-900 focus:outline-none focus:border-[#0176d3] print:border-slate-900"
                        aria-label="Pregnancy test result"
                      >
                        <option value="">—</option>
                        {(row.options || ['POSITIVE', 'NEGATIVE']).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </section>
            )}

            {/* Flat analytes (Forms 1–2) */}
            {!isSectioned &&
              activeForm.layoutStyle !== 'blood-typing' &&
              activeForm.layoutStyle !== 'pregnancy' &&
              flatAnalytes.length > 0 && (
              <section className="mb-8 border border-slate-300 rounded-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                    Examination
                  </span>
                </div>
                <div className="divide-y divide-slate-200">
                  {flatAnalytes.map((analyte) => {
                    const showUnit = !analyte.hideUnit && Boolean(analyte.unit);
                    return (
                      <div key={analyte.id} className="p-3 sm:p-4 space-y-3">
                        <div className="flex flex-wrap items-end gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {analyte.label}
                          </span>
                          {analyte.hasAtTime && (
                            <>
                              <span className="text-sm font-bold text-slate-900">@</span>
                              <input
                                type="time"
                                value={values[`${analyte.id}_at`] || ''}
                                onChange={(e) =>
                                  setField(`${analyte.id}_at`, e.target.value)
                                }
                                className="border-0 border-b border-slate-400 bg-transparent px-1 py-0.5 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3] w-28 print:border-slate-800"
                              />
                            </>
                          )}
                        </div>
                        <div
                          className={`grid grid-cols-1 gap-3 items-end ${
                            showUnit ? 'sm:grid-cols-12' : ''
                          }`}
                        >
                          <div className={showUnit ? 'sm:col-span-8' : ''}>
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                              Result
                            </label>
                            <AnalyteResultInput
                              analyte={analyte}
                              value={values[`${analyte.id}_result`] || ''}
                              onChange={(v) => setField(`${analyte.id}_result`, v)}
                            />
                          </div>
                          {showUnit && (
                            <div className="sm:col-span-4 flex flex-col gap-0.5">
                              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                                Unit
                              </label>
                              <div className="border-0 border-b border-slate-400 px-0.5 py-1.5 text-sm font-mono text-slate-800 print:border-slate-800">
                                {analyte.unit}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Remarks */}
            {activeForm.showRemarks && (
              <section className="mb-4">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Remarks
                </label>
                <textarea
                  value={values.remarks || ''}
                  onChange={(e) => setField('remarks', e.target.value)}
                  rows={2}
                  className="mt-1 w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 focus:outline-none focus:border-[#0176d3] resize-y print:border-slate-800"
                />
              </section>
            )}

            {isSectioned && activeForm.showEndOfReport !== false && (
              <div className="text-center text-[11px] text-slate-500 my-4 font-medium">
                - End of Report -
              </div>
            )}

            {/* Signatures */}
            <section className={`grid grid-cols-1 ${sigCols} gap-6 mt-6 pt-2`}>
              {activeForm.signatures.map((sig) => (
                <div key={sig.id} className="space-y-2 text-center">
                  {sig.showSignatureLine && (
                    <div className="h-8 border-0 border-b border-slate-500 print:border-slate-800 mb-1" />
                  )}
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                    Signature
                  </div>
                  <div className="flex flex-col gap-0.5 text-left">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">
                      Name
                    </label>
                    <input
                      type="text"
                      value={values[`${sig.id}_name`] || ''}
                      onChange={(e) => setField(`${sig.id}_name`, e.target.value)}
                      placeholder={
                        sig.id.startsWith('medTech') && currentUserName
                          ? currentUserName
                          : 'Full name'
                      }
                      className={inputUnderline}
                    />
                  </div>
                  {sig.showLicense && (
                    <div className="flex flex-col gap-0.5 text-left">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">
                        License No.
                      </label>
                      <input
                        type="text"
                        value={values[`${sig.id}_license`] || ''}
                        onChange={(e) => setField(`${sig.id}_license`, e.target.value)}
                        placeholder="PRC / License number"
                        className={inputUnderline}
                      />
                    </div>
                  )}
                  {sig.showDate && (
                    <div className="flex flex-col gap-0.5 text-left max-w-[10rem]">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">
                        Date
                      </label>
                      <input
                        type="date"
                        value={values[`${sig.id}_date`] || ''}
                        onChange={(e) => setField(`${sig.id}_date`, e.target.value)}
                        className="w-full border-0 border-b border-slate-400 bg-transparent px-0.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-[#0176d3] print:border-slate-800"
                      />
                    </div>
                  )}
                  <div className="text-[11px] font-bold text-slate-800 pt-1">
                    {sig.label}
                  </div>
                </div>
              ))}
            </section>

            {activeForm.footerNote ? (
              <p className="mt-6 pt-3 border-t border-slate-200 text-[9px] text-slate-500 text-center leading-relaxed">
                {activeForm.footerNote}
              </p>
            ) : (
              <div className="mt-8 pt-3 border-t border-dashed border-slate-300 text-[9px] text-slate-400 text-center print:mt-6">
                This form is an official laboratory result document. Verify printed values against instrument records before release.
              </div>
            )}
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
