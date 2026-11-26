import React from 'react';
import { LabTestRequisition } from '../modals/NewRequisitionModal';

export type OfficialResultPatientRow = {
  label: string;
  value: string;
  span: number;
};

function releaseStamp(): string {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return `${date} ${time}`;
}

/** Standard PTSI patient block for printable official result forms (RF-01 layout). */
export function buildOfficialResultPatientRows(
  requisition: LabTestRequisition,
  options?: { formNumber?: number; specimenType?: string }
): OfficialResultPatientRow[] {
  const org =
    requisition.organizationOrClient && requisition.organizationOrClient !== 'N/A'
      ? requisition.organizationOrClient
      : requisition.patientCategory || '—';

  if (options?.formNumber === 9) {
    return [
      { label: 'Lab. No.', value: requisition.caseNo || requisition.requisitionNumber || '—', span: 6 },
      {
        label: 'Age/Sex',
        value:
          [requisition.patientAge != null ? String(requisition.patientAge) : '', requisition.patientGender || '']
            .filter(Boolean)
            .join(' / ') || '—',
        span: 6,
      },
      { label: 'Name', value: (requisition.patientOrSubjectName || '—').toUpperCase(), span: 6 },
      { label: 'Date Submitted', value: requisition.requestDate || '—', span: 6 },
      { label: 'Requesting Physician', value: requisition.orderingPhysicianOrPI || '—', span: 6 },
      { label: 'Date Released', value: releaseStamp(), span: 6 },
      { label: 'Specimen', value: options.specimenType || '—', span: 6 },
      { label: 'Source', value: org === '—' ? '—' : org, span: 6 },
    ];
  }

  return [
    { label: 'Patient Name', value: (requisition.patientOrSubjectName || '—').toUpperCase(), span: 4 },
    { label: 'Age', value: requisition.patientAge != null ? String(requisition.patientAge) : '—', span: 2 },
    { label: 'Birthdate', value: requisition.patientDob || '—', span: 3 },
    { label: 'Phone#', value: requisition.patientPhone?.trim() || '—', span: 3 },

    { label: 'Hospital / Clinic', value: org, span: 4 },
    { label: 'Gender', value: requisition.patientGender || '—', span: 2 },
    { label: 'Referring MD', value: requisition.orderingPhysicianOrPI || '—', span: 3 },
    { label: 'Patient ID No', value: requisition.caseNo || requisition.externalRef || '—', span: 3 },

    { label: 'Barcode', value: requisition.requisitionNumber || '—', span: 4 },
    {
      label: 'OR#',
      value: requisition.orNumber && requisition.orNumber !== 'N/A' ? requisition.orNumber : '—',
      span: 2,
    },
    { label: 'Collected', value: (requisition.requestDate || '—').slice(0, 10), span: 3 },
    { label: 'Release Date', value: releaseStamp(), span: 3 },
  ];
}

export function OfficialResultPatientGrid({ rows }: { rows: OfficialResultPatientRow[] }) {
  return (
    <section className="lims-result-form-patient mb-2 mt-2 print:mt-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 sm:px-3.5 sm:py-2.5 print:mb-1.5 print:rounded-none print:border-slate-300 print:bg-white print:px-2 print:py-1.5">
      <div className="grid grid-cols-12 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-2.5 print:gap-x-3 print:gap-y-1.5">
        {rows.map((row, index) => {
          if (!row.label && !row.value) return null;
          return (
            <div
              key={`${row.label}-${index}`}
              className="lims-rf-patient-cell min-w-0 flex flex-col"
              style={{ gridColumn: `span ${row.span} / span ${row.span}` }}
            >
              <div className="text-[9px] sm:text-[9.5px] print:text-[7px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
                {row.label}
              </div>
              <div
                className="mt-0.5 text-[10.5px] sm:text-[11px] print:text-[8.5px] font-bold text-slate-900 break-words leading-snug [overflow-wrap:anywhere] normal-case"
                title={row.value}
              >
                {row.value}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
