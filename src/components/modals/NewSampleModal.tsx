import React, { useState } from 'react';
import { X, Plus, Leaf, Check } from 'lucide-react';
import { Sample, PriorityLevel } from '../../types/lims';

interface NewSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSample: (newSample: Sample) => void;
}

export const NewSampleModal: React.FC<NewSampleModalProps> = ({
  isOpen,
  onClose,
  onAddSample,
}) => {
  const [customerName, setCustomerName] = useState('Immunir');
  const [sampleName, setSampleName] = useState('Lockbox_S000445');
  const [sampleType, setSampleType] = useState<Sample['sampleType']>('Serum');
  const [matrix, setMatrix] = useState('SST Separator Tube');
  const [priority, setPriority] = useState<PriorityLevel>('ROUTINE');
  const [volumeMl, setVolumeMl] = useState(3.0);
  const [boxId, setBoxId] = useState('BX000026');
  const [boxPosition, setBoxPosition] = useState('A01');
  const [shelfId, setShelfId] = useState('Shelf 1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = Math.floor(1000 + Math.random() * 9000);
    const barcode = `SMP-2026-${idNum}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const holdDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    const created: Sample = {
      id: `smp-${Date.now()}`,
      barcode,
      externalId: `S000${Math.floor(100 + Math.random() * 900)}`,
      sampleName: sampleName.trim() || `${customerName}_${barcode}`,
      sampleType,
      matrix,
      patientOrSourceName: `${customerName}_${barcode}`,
      collectionDate: now,
      receivedDate: now,
      holdTimeDeadline: holdDate,
      priority,
      status: 'ACCESSIONED',
      storageLocation: {
        facility: 'Central Laboratory',
        room: 'Rm 102 - Cold Vault',
        unit: 'Main Freezer',
        rack: 'RK000001',
        box: boxId,
        well: boxPosition,
        temperature: '-80°C',
      },
      preservationStatus: 'Cold Chain Validated',
      volumeMl,
      assignedTests: ['test-cbc'],
      aliquotCount: 3,
      chainOfCustody: [
        {
          id: `coc-${Date.now()}`,
          timestamp: now,
          fromUser: 'Intake Receptionist',
          toUser: 'Storage Vault',
          action: 'Sample Accessioning',
          reason: 'Initial Registration',
          signatureHash: 'e982137498a87b1c345987123abcdef987123456789abcdef987123456789abc',
          temperatureAtTransfer: '4.0°C',
        },
      ],
    };

    onAddSample(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-[#d8dde6] rounded-md max-w-xl w-full p-6 space-y-4 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-md bg-[#eaf5ea] border border-[#a3d9a5] flex items-center justify-center text-[#2e844a]">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">New Sample Intake</h3>
            <p className="text-xs text-slate-500">Accession a new specimen into the repository</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3]"
              />
            </div>
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Sample Name *</label>
              <input
                type="text"
                required
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                placeholder="Lockbox_S000445"
                className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 font-mono text-xs focus:outline-none focus:border-[#0176d3]"
              />
            </div>
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Sample Type *</label>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900 focus:outline-none focus:border-[#0176d3]"
              >
                <option value="Serum">Serum (SST)</option>
                <option value="Whole Blood">Whole Blood (EDTA)</option>
                <option value="Plasma">Plasma</option>
                <option value="Drinking Water">Drinking Water</option>
                <option value="Wastewater">Wastewater</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded border border-[#d8dde6] text-slate-900"
              >
                <option value="ROUTINE">Routine</option>
                <option value="PRIORITY">Priority</option>
                <option value="STAT">STAT Emergency</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Target Box ID</label>
              <input
                type="text"
                value={boxId}
                onChange={(e) => setBoxId(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#d8dde6] font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Box Position</label>
              <input
                type="text"
                value={boxPosition}
                onChange={(e) => setBoxPosition(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#d8dde6] font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white rounded text-xs font-bold shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save & Accession Sample</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
