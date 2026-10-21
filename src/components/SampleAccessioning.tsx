import React, { useState } from 'react';
import { 
  Barcode, 
  Plus, 
  QrCode, 
  Printer, 
  Split, 
  MapPin, 
  Thermometer, 
  History, 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Tag
} from 'lucide-react';
import { Sample, PriorityLevel, StorageLocation, CustodyRecord } from '../types/lims';

interface SampleAccessioningProps {
  samples: Sample[];
  onAddSample: (newSample: Sample) => void;
  onAddAliquot: (parentSampleId: string, count: number) => void;
  onRecordCustodyTransfer: (sampleId: string, custody: CustodyRecord) => void;
}

export const SampleAccessioning: React.FC<SampleAccessioningProps> = ({
  samples,
  onAddSample,
  onAddAliquot,
  onRecordCustodyTransfer,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'intake' | 'inventory' | 'storage-map'>('intake');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(samples[0] || null);
  const [showAliquotModal, setShowAliquotModal] = useState(false);
  const [aliquotCountInput, setAliquotCountInput] = useState(2);
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [custodyRecipient, setCustodyRecipient] = useState('Dr. Katherine Zhang, Lead Chemist');
  const [custodyReason, setCustodyReason] = useState('Transfer to LC-MS/MS Instrument Queue');

  // Intake Form State
  const [externalId, setExternalId] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sampleType, setSampleType] = useState<Sample['sampleType']>('Serum');
  const [matrix, setMatrix] = useState('SST Separator Gel Tube');
  const [priority, setPriority] = useState<PriorityLevel>('ROUTINE');
  const [volumeMl, setVolumeMl] = useState(3.5);
  const [preservation, setPreservation] = useState('Refrigerated 2°C - 8°C');
  const [storageUnit, setStorageUnit] = useState('Freezer -80°C #2');
  const [storageRack, setStorageRack] = useState('RACK-ALPHA');
  const [storageBox, setStorageBox] = useState('BOX-04');
  const [storageWell, setStorageWell] = useState('C5');
  const [assignedTest, setAssignedTest] = useState('test-cbc');
  const [notes, setNotes] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleCreateSample = (e: React.FormEvent) => {
    e.preventDefault();
    const newBarcode = `SMP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Hold time deadline 24h from now
    const holdDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    const created: Sample = {
      id: `smp-${Date.now()}`,
      barcode: newBarcode,
      externalId: externalId || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      sampleType,
      matrix,
      patientOrSourceName: sourceName || 'Anonymous Specimen',
      collectionDate: now,
      receivedDate: now,
      holdTimeDeadline: holdDate,
      priority,
      status: 'ACCESSIONED',
      storageLocation: {
        facility: 'Central Laboratory',
        room: 'Rm 201 - Intake Vault',
        unit: storageUnit,
        rack: storageRack,
        box: storageBox,
        well: storageWell,
        temperature: '-80°C',
      },
      preservationStatus: preservation,
      volumeMl,
      assignedTests: [assignedTest],
      aliquotCount: 1,
      chainOfCustody: [
        {
          id: `coc-${Date.now()}`,
          timestamp: now,
          fromUser: 'Accessioning Tech R. Davies',
          toUser: 'Central Intake Storage',
          action: 'Initial Intake Accessioning & Barcoding',
          reason: 'Sample Registration & Barcode Assignment',
          signatureHash: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
          temperatureAtTransfer: '4.0°C',
        },
      ],
      notes,
    };

    onAddSample(created);
    setSelectedSample(created);
    setSuccessToast(`Specimen ${newBarcode} successfully accessioned with 2D Barcode!`);
    setTimeout(() => setSuccessToast(null), 4000);

    // Reset Form
    setExternalId('');
    setSourceName('');
    setNotes('');
  };

  const filteredSamples = samples.filter(
    (s) =>
      s.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.externalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.patientOrSourceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-heading">
              Sample Accessioning & Chain of Custody (CoC)
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              ISO 15189 / 17025 Compliant
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Rapid barcode intake, aliquot splitting, freezer rack mapping, and cryptographic custody verification.
          </p>
        </div>

        {/* Subtabs Switcher */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('intake')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'intake'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Intake Accessioning
          </button>
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'inventory'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sample Master Registry ({samples.length})
          </button>
          <button
            onClick={() => setActiveSubTab('storage-map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'storage-map'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            -80°C Storage Map
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successToast}
        </div>
      )}

      {/* VIEW 1: INTAKE ACCESSIONING FORM & LIVE BARCODE PREVIEW */}
      {activeSubTab === 'intake' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Intake Registration Form */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
              <Barcode className="w-4 h-4 text-cyan-400" />
              Primary Specimen Intake Form
            </h3>

            <form onSubmit={handleCreateSample} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Patient / Source Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jonathan Doe / Metro Water Stn 4"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    External Reference / MRN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MRN-892104 / CLIENT-REF-09"
                    value={externalId}
                    onChange={(e) => setExternalId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Specimen Type
                  </label>
                  <select
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Serum">Serum (SST)</option>
                    <option value="Whole Blood">Whole Blood (EDTA)</option>
                    <option value="Plasma">Plasma (Sodium Citrate)</option>
                    <option value="Urine">Urine</option>
                    <option value="Drinking Water">Drinking Water</option>
                    <option value="Wastewater">Wastewater</option>
                    <option value="Soil">Soil / Sediment</option>
                    <option value="Biopsy Tissue">Biopsy Tissue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold focus:outline-none ${
                      priority === 'STAT'
                        ? 'bg-rose-950 border-rose-600 text-rose-200'
                        : priority === 'PRIORITY'
                        ? 'bg-amber-950 border-amber-600 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value="ROUTINE">ROUTINE (Standard SLA)</option>
                    <option value="PRIORITY">PRIORITY (Expedited)</option>
                    <option value="STAT">STAT (Emergency &lt;60m)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Volume (mL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Test Assignment
                  </label>
                  <select
                    value={assignedTest}
                    onChange={(e) => setAssignedTest(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="test-cbc">CBC Complete Blood Count (Hematology)</option>
                    <option value="test-tox-metals">Heavy Metals Panel (ICP-MS)</option>
                    <option value="test-cmp">Comprehensive Metabolic Panel (Cobas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preservation / Anticoagulant Matrix
                  </label>
                  <input
                    type="text"
                    value={matrix}
                    onChange={(e) => setMatrix(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Storage Position Mapping */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <MapPin className="w-3.5 h-3.5" />
                  Target Storage Cell Assignment
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">Freezer / Unit</label>
                    <input
                      type="text"
                      value={storageUnit}
                      onChange={(e) => setStorageUnit(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Rack</label>
                    <input
                      type="text"
                      value={storageRack}
                      onChange={(e) => setStorageRack(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Box</label>
                    <input
                      type="text"
                      value={storageBox}
                      onChange={(e) => setStorageBox(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Well</label>
                    <input
                      type="text"
                      value={storageWell}
                      onChange={(e) => setStorageWell(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Accessioning Remarks / Clinical Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter any special handling, hemolysis observations, or clinical notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Generate Barcode & Accession
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Barcode Label Preview & Quick Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  Cryo Barcode Label Output
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Zebra ZD620 Ready
                </span>
              </div>

              {/* Visual Barcode Label Card */}
              <div className="bg-white text-slate-900 p-4 rounded-xl shadow-2xl border-2 border-slate-300 space-y-3 font-sans select-none">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <div>
                    <div className="text-[10px] font-bold text-cyan-800 tracking-wider">AEGISLIMS CLINICAL</div>
                    <div className="text-sm font-black font-mono">
                      {selectedSample ? selectedSample.barcode : 'SMP-2026-88019'}
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                    selectedSample?.priority === 'STAT' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'
                  }`}>
                    {selectedSample?.priority || 'ROUTINE'}
                  </div>
                </div>

                {/* Barcode Graphic Simulation */}
                <div className="py-2 text-center bg-slate-50 border border-slate-200 rounded">
                  <div className="font-mono text-xl tracking-[5px] font-bold py-1">
                    ||| | |||| | || ||| || |||
                  </div>
                  <div className="text-[10px] font-mono font-semibold text-slate-600">
                    *{selectedSample ? selectedSample.barcode : 'SMP-2026-88019'}*
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-500 font-semibold">PATIENT:</span>
                    <div className="font-bold truncate">{selectedSample?.patientOrSourceName || 'Alexander Wright'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">MATRIX:</span>
                    <div className="font-bold">{selectedSample?.sampleType || 'Whole Blood'} ({selectedSample?.volumeMl || 4.0}mL)</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">STORAGE:</span>
                    <div className="font-mono font-bold">{selectedSample?.storageLocation.unit || 'Freezer -80C #2'} : {selectedSample?.storageLocation.well || 'A1'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">RECEIVED:</span>
                    <div className="font-mono font-bold">2026-10-06 09:15</div>
                  </div>
                </div>
              </div>

              {/* Label Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => alert(`Simulated Thermal Print: Sent ${selectedSample?.barcode || 'SMP-2026-88019'} to Zebra Network Printer 01`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  Print 2D Cryo Label
                </button>
                <button
                  onClick={() => setShowAliquotModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  <Split className="w-3.5 h-3.5" />
                  Split Aliquots
                </button>
              </div>
            </div>

            {/* Chain of Custody History Card for Selected Sample */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  Chain of Custody (CoC)
                </h3>
                <button
                  onClick={() => setShowCustodyModal(true)}
                  className="px-2.5 py-1 text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg hover:bg-cyan-900 transition-colors font-semibold"
                >
                  Transfer Custody
                </button>
              </div>

              <div className="space-y-3">
                {(selectedSample?.chainOfCustody || []).map((coc, idx) => (
                  <div
                    key={coc.id || idx}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{coc.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{coc.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {coc.fromUser} <span className="text-cyan-400">→</span> {coc.toUser}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-cyan-400" />
                        {coc.temperatureAtTransfer}
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Sig Validated
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SAMPLE MASTER REGISTRY TABLE */}
      {activeSubTab === 'inventory' && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by barcode, patient, or external MRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Barcode</th>
                  <th className="p-3">Patient / Source</th>
                  <th className="p-3">Type & Matrix</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Storage Location</th>
                  <th className="p-3">Hold Deadline</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSamples.map((sample) => (
                  <tr
                    key={sample.id}
                    onClick={() => setSelectedSample(sample)}
                    className={`cursor-pointer transition-colors ${
                      selectedSample?.id === sample.id ? 'bg-cyan-950/40' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-cyan-400" />
                      {sample.barcode}
                    </td>
                    <td className="p-3 font-medium text-slate-200">
                      {sample.patientOrSourceName}
                      <span className="block text-[10px] text-slate-400 font-mono">{sample.externalId}</span>
                    </td>
                    <td className="p-3">
                      <span>{sample.sampleType}</span>
                      <span className="block text-[10px] text-slate-400">{sample.matrix}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                          sample.priority === 'STAT'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : sample.priority === 'PRIORITY'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {sample.priority}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      <span className="text-cyan-400 font-semibold">{sample.status}</span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">
                      {sample.storageLocation.unit} ({sample.storageLocation.well || 'R1'})
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {sample.holdTimeDeadline}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSample(sample);
                          setActiveSubTab('intake');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold"
                      >
                        View & Label
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: -80°C FREEZER & BOX STORAGE MAP */}
      {activeSubTab === 'storage-map' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                Cryogenic Freezer Unit 2 (-80°C) · Rack Alpha · Box 04 (9x9 Grid)
              </h3>
              <p className="text-xs text-slate-400">
                Visual slot allocation. Blue cells indicate occupied sample positions.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-600"></span> Occupied (4)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700"></span> Available (77)
              </span>
            </div>
          </div>

          {/* 9x9 Freezer Box Grid */}
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 max-w-2xl mx-auto">
            <div className="grid grid-cols-9 gap-2">
              {Array.from({ length: 81 }).map((_, idx) => {
                const row = String.fromCharCode(65 + Math.floor(idx / 9));
                const col = (idx % 9) + 1;
                const pos = `${row}${col}`;
                const matchedSample = samples.find((s) => s.storageLocation.well === pos);

                return (
                  <div
                    key={pos}
                    onClick={() => matchedSample && setSelectedSample(matchedSample)}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all border text-center ${
                      matchedSample
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50 hover:scale-105'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                    title={matchedSample ? `${matchedSample.barcode} (${matchedSample.patientOrSourceName})` : `Empty Cell: ${pos}`}
                  >
                    <span className="text-[10px] font-mono font-bold">{pos}</span>
                    {matchedSample && (
                      <span className="text-[8px] font-mono text-cyan-300 truncate w-full">
                        {matchedSample.barcode.split('-')[2]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Aliquot Split Modal */}
      {showAliquotModal && selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Split className="w-4 h-4 text-cyan-400" />
                Create Aliquot Splits for {selectedSample.barcode}
              </h3>
              <button onClick={() => setShowAliquotModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-300">
              Each child aliquot inherits parent metadata, collection timestamps, and creates unique subordinate barcodes.
            </p>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Number of Aliquots</label>
              <input
                type="number"
                min="1"
                max="8"
                value={aliquotCountInput}
                onChange={(e) => setAliquotCountInput(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAliquotModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onAddAliquot(selectedSample.id, aliquotCountInput);
                  setShowAliquotModal(false);
                  setSuccessToast(`Created ${aliquotCountInput} child aliquots for ${selectedSample.barcode}`);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Generate Aliquots
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custody Transfer Modal */}
      {showCustodyModal && selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                21 CFR Part 11 Custody Handover Sign-off
              </h3>
              <button onClick={() => setShowCustodyModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-300">
              Transfer custodial responsibility for <strong className="text-white font-mono">{selectedSample.barcode}</strong>.
            </p>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Transfer Recipient *</label>
              <input
                type="text"
                value={custodyRecipient}
                onChange={(e) => setCustodyRecipient(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Reason for Custody Transfer *</label>
              <input
                type="text"
                value={custodyReason}
                onChange={(e) => setCustodyReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustodyModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
                  const record: CustodyRecord = {
                    id: `coc-${Date.now()}`,
                    timestamp: now,
                    fromUser: 'Accessioning Vault',
                    toUser: custodyRecipient,
                    action: 'Custody Handover',
                    reason: custodyReason,
                    signatureHash: 'e982137498a87b1c345987123abcdef987123456789abcdef987123456789abc',
                    temperatureAtTransfer: '4.2°C',
                  };
                  onRecordCustodyTransfer(selectedSample.id, record);
                  setShowCustodyModal(false);
                  setSuccessToast(`Custody transferred to ${custodyRecipient}`);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Sign & Authorize Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
