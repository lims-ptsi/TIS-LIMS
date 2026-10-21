import React from 'react';

export const NTP_FIELD_KEYS = [
  'facilityName',
  'dateOfRequest',
  'facilityContact',
  'requestingPhysician',
  'patientName',
  'age',
  'sex',
  'provinceCity',
  'patientContact',
  'diagnosis',
  'treatmentPhase',
  'tbCaseNo',
  'monthOfTreatment',
  'req_xpert',
  'req_xpert_ultra',
  'req_truenat_plus',
  'req_truenat_rif',
  'req_tblamp',
  'req_smear',
  'req_xpert_xdr',
  'req_lpa',
  'req_culture',
  'req_pdst',
  'specimenType',
  'specimenOther',
  'repeatCollection',
  'repeatReason',
  'collectionDate',
  'spec1_collected',
  'spec1_dispatched',
  'spec2_collected',
  'spec2_dispatched',
  'remarks',
  'preparedBy',
  'preparedDesignation',
  'labName',
  'specimenReceivedAt',
  'specimenQuality',
  'labSerial',
  'dateExamined',
  'res_xpert',
  'res_xpert_ultra',
  'res_truenat_plus',
  'res_truenat_rif',
  'res_tblamp',
  'smear_reading1',
  'smear_reading2',
  'smear_diagnosis',
  'performedBy',
  'verifiedBy',
  'notedBy',
  'dateReleased',
] as const;

type Values = Record<string, string>;

const REQUESTED_TESTS: { id: string; label: string }[] = [
  { id: 'req_xpert', label: 'Xpert MTB/RIF' },
  { id: 'req_xpert_ultra', label: 'Xpert MTB/RIF Ultra' },
  { id: 'req_truenat_plus', label: 'Truenat MTB Plus' },
  { id: 'req_truenat_rif', label: 'Truenat MTB-RIF Dx' },
  { id: 'req_tblamp', label: 'TB LAMP' },
  { id: 'req_smear', label: 'Smear Microscopy' },
  { id: 'req_xpert_xdr', label: 'Xpert MTB/XDR' },
  { id: 'req_lpa', label: 'Line Probe Assay' },
  { id: 'req_culture', label: 'TB Culture' },
  { id: 'req_pdst', label: 'Phenotypic DST' },
];

const RESULT_TESTS: { id: string; label: string }[] = [
  { id: 'res_xpert', label: 'Xpert MTB/RIF' },
  { id: 'res_xpert_ultra', label: 'Xpert MTB/RIF Ultra' },
  { id: 'res_truenat_plus', label: 'Truenat MTB Plus' },
  { id: 'res_truenat_rif', label: 'Truenat MTB-RIF Dx' },
  { id: 'res_tblamp', label: 'TB LAMP' },
];

const line =
  'w-full border-0 border-b border-slate-800 bg-transparent px-1 py-0.5 text-[11px] text-slate-900 focus:outline-none focus:border-[#0176d3]';

function Line({
  value,
  onChange,
  readOnly,
  type = 'text',
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  type?: string;
  placeholder?: string;
}) {
  if (readOnly) {
    return <span className="inline-block min-w-[4rem] border-b border-slate-800 px-1 text-[11px] font-semibold">{value || '\u00a0'}</span>;
  }
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={line}
    />
  );
}

function Box({
  checked,
  label,
  onChange,
  readOnly,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-1 text-[11px] text-slate-900">
      <input
        type="checkbox"
        checked={checked}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3 w-3"
      />
      <span>{label}</span>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-1 min-w-0">
      <span className="shrink-0 text-[11px] text-slate-800">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export const NtpLabRequestForm: React.FC<{
  values: Values;
  onChange: (key: string, value: string) => void;
  readOnly?: boolean;
}> = ({ values, onChange, readOnly }) => {
  const v = (key: string) => values[key] || '';
  const set = (key: string) => (val: string) => onChange(key, val);
  const checked = (key: string) => v(key) === '1';
  const toggle = (key: string) => (on: boolean) => onChange(key, on ? '1' : '');
  const pick = (key: string, option: string) => onChange(key, v(key) === option ? '' : option);

  return (
    <div className="text-slate-900 text-[11px] leading-tight space-y-3">
      <div className="text-center">
        <div className="text-sm font-bold tracking-wide">PTSI CENTRAL LABORATORY</div>
        <div className="text-xs font-semibold">QUEZON INSTITUTE</div>
        <div className="text-[10px]">E. Rodriguez Sr. Ave., Quezon City</div>
        <div className="mt-1 text-xs font-bold uppercase">Form 2a. Laboratory Request and Result Form</div>
      </div>

      <section className="border border-slate-800">
        <div className="bg-slate-100 border-b border-slate-800 px-2 py-1 text-center font-semibold italic">
          To be filled out by requesting facility health worker
        </div>
        <div className="p-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <Field label="Name of Request Facility/Unit:">
              <Line value={v('facilityName')} onChange={set('facilityName')} readOnly={readOnly} />
            </Field>
            <Field label="Date of Request:">
              <Line type="date" value={v('dateOfRequest')} onChange={set('dateOfRequest')} readOnly={readOnly} />
            </Field>
            <Field label="Facility contact information:">
              <Line value={v('facilityContact')} onChange={set('facilityContact')} readOnly={readOnly} />
            </Field>
            <Field label="Requesting Physician:">
              <Line value={v('requestingPhysician')} onChange={set('requestingPhysician')} readOnly={readOnly} />
            </Field>
            <Field label="Patient's Full Name:">
              <Line value={v('patientName')} onChange={set('patientName')} readOnly={readOnly} />
            </Field>
            <div className="flex items-end gap-3">
              <Field label="Age:">
                <Line value={v('age')} onChange={set('age')} readOnly={readOnly} />
              </Field>
              <span className="shrink-0">Sex:</span>
              <Box checked={v('sex') === 'M'} label="M" readOnly={readOnly} onChange={() => pick('sex', 'M')} />
              <Box checked={v('sex') === 'F'} label="F" readOnly={readOnly} onChange={() => pick('sex', 'F')} />
            </div>
            <Field label="Province/City:">
              <Line value={v('provinceCity')} onChange={set('provinceCity')} readOnly={readOnly} />
            </Field>
            <Field label="Patient's Contact Number:">
              <Line value={v('patientContact')} onChange={set('patientContact')} readOnly={readOnly} />
            </Field>
          </div>

          <div className="pt-1">
            <div className="font-semibold">Reason for Examination / History of Treatment:</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Diagnosis</span>
              <Box checked={v('diagnosis') === 'New'} label="New" readOnly={readOnly} onChange={() => pick('diagnosis', 'New')} />
              <Box checked={v('diagnosis') === 'Retreatment'} label="Retreatment" readOnly={readOnly} onChange={() => pick('diagnosis', 'Retreatment')} />
              <Box checked={v('treatmentPhase') === 'Baseline'} label="Baseline" readOnly={readOnly} onChange={() => pick('treatmentPhase', 'Baseline')} />
              <Box checked={v('treatmentPhase') === 'Follow-up'} label="Follow-up" readOnly={readOnly} onChange={() => pick('treatmentPhase', 'Follow-up')} />
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-3">
              <Field label="TB Case No.:">
                <Line value={v('tbCaseNo')} onChange={set('tbCaseNo')} readOnly={readOnly} />
              </Field>
              <Field label="Month of Treatment:">
                <Line value={v('monthOfTreatment')} onChange={set('monthOfTreatment')} readOnly={readOnly} />
              </Field>
            </div>
          </div>

          <div>
            <div className="font-semibold">Test Requested:</div>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
              {REQUESTED_TESTS.map((test) => (
                <Box
                  key={test.id}
                  checked={checked(test.id)}
                  label={test.label}
                  readOnly={readOnly}
                  onChange={toggle(test.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
            <span className="font-semibold">Type of Specimen:</span>
            <Box checked={v('specimenType') === 'Sputum'} label="Sputum" readOnly={readOnly} onChange={() => pick('specimenType', 'Sputum')} />
            <Box checked={v('specimenType') === 'Other'} label="Other (specify)" readOnly={readOnly} onChange={() => pick('specimenType', 'Other')} />
            {v('specimenType') === 'Other' ? (
              <div className="min-w-[8rem] flex-1">
                <Line value={v('specimenOther')} onChange={set('specimenOther')} readOnly={readOnly} />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span>Repeat Collection?</span>
            <Box checked={v('repeatCollection') === 'No'} label="No" readOnly={readOnly} onChange={() => pick('repeatCollection', 'No')} />
            <Box checked={v('repeatCollection') === 'Yes'} label="Yes" readOnly={readOnly} onChange={() => pick('repeatCollection', 'Yes')} />
            <span>Reason:</span>
            <div className="min-w-[8rem] flex-1">
              <Line value={v('repeatReason')} onChange={set('repeatReason')} readOnly={readOnly} />
            </div>
          </div>

          <Field label="Date:">
            <Line type="date" value={v('collectionDate')} onChange={set('collectionDate')} readOnly={readOnly} />
          </Field>
          <table className="w-full border border-slate-800 border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-800 px-1 py-1 text-left font-semibold w-16">Specimen</th>
                <th className="border border-slate-800 px-1 py-1 text-left font-semibold">Date Collected</th>
                <th className="border border-slate-800 px-1 py-1 text-left font-semibold">Date Dispatched to Laboratory</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2].map((n) => (
                <tr key={n}>
                  <td className="border border-slate-800 px-2 py-1">{n}</td>
                  <td className="border border-slate-800 px-1 py-1">
                    <Line type="date" value={v(`spec${n}_collected`)} onChange={set(`spec${n}_collected`)} readOnly={readOnly} />
                  </td>
                  <td className="border border-slate-800 px-1 py-1">
                    <Line type="date" value={v(`spec${n}_dispatched`)} onChange={set(`spec${n}_dispatched`)} readOnly={readOnly} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <div>Remarks:</div>
            {readOnly ? (
              <div className="min-h-[2rem] border-b border-slate-800 whitespace-pre-wrap">{v('remarks')}</div>
            ) : (
              <textarea
                value={v('remarks')}
                onChange={(e) => onChange('remarks', e.target.value)}
                rows={2}
                placeholder="Pre-collection details, existing medical conditions, medications taken prior to testing, or other known risk factors"
                className="mt-0.5 w-full border border-slate-400 px-1 py-1 text-[11px] focus:outline-none focus:border-[#0176d3]"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <div className="text-[10px] text-center">Prepared by</div>
              <Line value={v('preparedBy')} onChange={set('preparedBy')} readOnly={readOnly} />
              <div className="text-center text-[10px]">Signature over Printed Name</div>
            </div>
            <div>
              <div className="text-[10px] text-center">Designation:</div>
              <Line value={v('preparedDesignation')} onChange={set('preparedDesignation')} readOnly={readOnly} />
            </div>
          </div>
        </div>
      </section>

      <section className="border border-slate-800">
        <div className="bg-slate-100 border-b border-slate-800 px-2 py-1 text-center font-semibold italic">
          To be filled out by receiving laboratory technician / microscopist / medical technologist
        </div>
        <div className="p-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <Field label="Name of Laboratory:">
              <Line
                value={v('labName') || 'PTSI-Q CENTRAL LABORATORY'}
                onChange={set('labName')}
                readOnly={readOnly}
              />
            </Field>
            <Field label="Date and Time Specimen Received:">
              <Line type="datetime-local" value={v('specimenReceivedAt')} onChange={set('specimenReceivedAt')} readOnly={readOnly} />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Specimen Received and Quality:</span>
            <Box checked={v('specimenQuality') === 'Accepted'} label="Accepted" readOnly={readOnly} onChange={() => pick('specimenQuality', 'Accepted')} />
            <Box checked={v('specimenQuality') === 'Rejected'} label="Rejected" readOnly={readOnly} onChange={() => pick('specimenQuality', 'Rejected')} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="Laboratory Serial Number:">
              <Line value={v('labSerial')} onChange={set('labSerial')} readOnly={readOnly} />
            </Field>
            <Field label="Date Specimen Examined:">
              <Line type="date" value={v('dateExamined')} onChange={set('dateExamined')} readOnly={readOnly} />
            </Field>
          </div>

          <table className="w-full border border-slate-800 border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-800 px-2 py-1 text-left font-semibold">Diagnostic Tests</th>
                <th className="border border-slate-800 px-2 py-1 text-left font-semibold">Results</th>
              </tr>
            </thead>
            <tbody>
              {RESULT_TESTS.map((test) => (
                <tr key={test.id}>
                  <td className="border border-slate-800 px-2 py-1">{test.label}</td>
                  <td className="border border-slate-800 px-1 py-1">
                    <Line value={v(test.id)} onChange={set(test.id)} readOnly={readOnly} />
                  </td>
                </tr>
              ))}
              <tr>
                <td className="border border-slate-800 px-2 py-1 align-top">
                  <div className="font-semibold">Smear Microscopy</div>
                  <div>Acid Fast Bacilli</div>
                </td>
                <td className="border border-slate-800 px-1 py-1">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Reading 1">
                      <Line value={v('smear_reading1')} onChange={set('smear_reading1')} readOnly={readOnly} />
                    </Field>
                    <Field label="Reading 2">
                      <Line value={v('smear_reading2')} onChange={set('smear_reading2')} readOnly={readOnly} />
                    </Field>
                  </div>
                  <div className="mt-1">
                    <Field label="Laboratory Diagnosis">
                      <Line value={v('smear_diagnosis')} onChange={set('smear_diagnosis')} readOnly={readOnly} />
                    </Field>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-3 gap-3 pt-3">
            {[
              ['performedBy', 'Performed by'],
              ['verifiedBy', 'Verified by'],
              ['notedBy', 'Noted by'],
            ].map(([key, label]) => (
              <div key={key}>
                <div className="text-[10px]">{label}</div>
                <Line value={v(key)} onChange={set(key)} readOnly={readOnly} />
                <div className="text-center text-[10px]">Signature over Printed Name</div>
              </div>
            ))}
          </div>
          <Field label="Date and Time Released:">
            <Line type="datetime-local" value={v('dateReleased')} onChange={set('dateReleased')} readOnly={readOnly} />
          </Field>
        </div>
      </section>

      <p className="text-[10px] text-center text-slate-700">
        A separate result form for LPA, Culture and DST will be issued
      </p>
    </div>
  );
};
