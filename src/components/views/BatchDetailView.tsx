import React, { useState } from 'react';
import { 
  Box, 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  Copy, 
  Leaf, 
  Info,
  Check,
  Package
} from 'lucide-react';
import { LifecycleChevronBar } from '../layout/LifecycleChevronBar';

interface BatchDetailViewProps {
  batchId?: string;
  batchName?: string;
  onEditBatch?: () => void;
  onDeleteBatch?: () => void;
  onCloneBatch?: () => void;
  onNavigateToSample?: (sampleId: string) => void;
}

export const BatchDetailView: React.FC<BatchDetailViewProps> = ({
  batchId = 'BT000000',
  batchName = 'TWA Batch',
  onEditBatch,
  onDeleteBatch,
  onCloneBatch,
  onNavigateToSample,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'print-label'>('details');
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [storageExpanded, setStorageExpanded] = useState(true);
  const [associatedExpanded, setAssociatedExpanded] = useState(true);

  const inventoryItems = [
    { name: 'Gel Extraction Kit', color: '#032d60', count: 1, percentage: 5 },
    { name: 'NEB Luna qPCR master mix B', color: '#0176d3', count: 1, percentage: 5 },
    { name: 'Primer 16S Forward', color: '#00a1e0', count: 1, percentage: 5 },
    { name: 'Primer 16S Reverse', color: '#4bca81', count: 1, percentage: 5 },
    { name: 'Qubit DNA HS standard 2', color: '#e28704', count: 1, percentage: 5 },
    { name: 'Qubit DNA HS tubes', color: '#e5b800', count: 15, percentage: 75 },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Lifecycle Chevron Bar */}
      <LifecycleChevronBar
        currentStage="Quality Control Testing Complete"
        entityType="Batch"
        onCompleteStage={() => alert(`Marked batch ${batchId} lifecycle as complete!`)}
      />

      {/* 2. Record Header Card */}
      <div className="bg-white border border-[#d8dde6] rounded-md p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Blue 3D Cube Icon */}
          <div className="w-10 h-10 rounded-md bg-[#eef4ff] border border-[#adc9fa] flex items-center justify-center text-[#0176d3] shadow-xs">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Batch</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {batchId}
            </h1>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEditBatch}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDeleteBatch}
            className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onCloneBatch}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-[#d8dde6] shadow-xs transition-colors"
          >
            <span>Clone</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </div>

      {/* 3. Sub-Tabs */}
      <div className="flex items-center gap-6 border-b border-[#d8dde6] bg-white px-4 rounded-t-md">
        <button
          onClick={() => setActiveTab('details')}
          className={`py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'details'
              ? 'text-[#0176d3] border-[#0176d3]'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('print-label')}
          className={`py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'print-label'
              ? 'text-[#0176d3] border-[#0176d3]'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          Print Label
        </button>
      </div>

      {/* 4. Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 of 12) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Section 1: Information */}
          <div className="lims-card">
            <button
              onClick={() => setInfoExpanded(!infoExpanded)}
              className="w-full lims-card-header flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-[13px] text-slate-900">
                {infoExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                <span>Information</span>
              </div>
            </button>

            {infoExpanded && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs border-t border-slate-100">
                {/* Row 1 */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 group">
                  <span className="text-slate-500 font-medium">Batch name</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-semibold">{batchName}</span>
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Batch ID</span>
                  <span className="text-slate-900 font-mono font-semibold">{batchId}</span>
                </div>

                {/* Row 2 */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 group">
                  <span className="text-slate-500 font-medium">Creation date</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900">7/6/2023</span>
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 group">
                  <span className="text-slate-500 font-medium">Batch Lifecycle</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-semibold">Quality Control Testing Complete</span>
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 group">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    Quality Control Check <Info className="w-3 h-3 text-slate-400" />
                  </span>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#0176d3]" />
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                </div>
                <div></div>
              </div>
            )}
          </div>

          {/* Section 2: Storage */}
          <div className="lims-card">
            <button
              onClick={() => setStorageExpanded(!storageExpanded)}
              className="w-full lims-card-header flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-[13px] text-slate-900">
                {storageExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                <span>Storage</span>
              </div>
            </button>

            {storageExpanded && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs border-t border-slate-100">
                {/* Row 1 */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 group">
                  <span className="text-slate-500 font-medium">Box ID</span>
                  <div className="flex items-center gap-2">
                    <span className="link-blue font-mono cursor-pointer">BX000027</span>
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Box Position</span>
                  <span className="font-mono text-slate-900 font-semibold">A01</span>
                </div>

                {/* Row 2 */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 group">
                  <span className="text-slate-500 font-medium">Location Name</span>
                  <div className="flex items-center gap-2">
                    <span className="link-blue cursor-pointer">Batch Testing Site</span>
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 group">
                  <span className="text-slate-500 font-medium">Shelf ID</span>
                  <div className="flex items-center gap-2">
                    <span className="link-blue font-mono cursor-pointer">SH000002</span>
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 group">
                  <span className="text-slate-500 font-medium">Equipment Name</span>
                  <div className="flex items-center gap-2">
                    <span className="link-blue cursor-pointer">Main Freezer</span>
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 group">
                  <span className="text-slate-500 font-medium">Rack ID</span>
                  <div className="flex items-center gap-2">
                    <span className="link-blue font-mono cursor-pointer">RK000005</span>
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                </div>

                {/* Row 4 */}
                <div></div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 group">
                  <span className="text-slate-500 font-medium">Drawer ID</span>
                  <div className="flex items-center gap-2">
                    <span className="link-blue font-mono cursor-pointer">DR000003</span>
                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 of 12) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Widget 1: Associated Samples (3) */}
          <div className="lims-card overflow-hidden">
            <div className="lims-card-header bg-[#f8fafc] flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <div className="w-4 h-4 rounded bg-[#eaf5ea] border border-[#a3d9a5] flex items-center justify-center text-[#2e844a]">
                  <Leaf className="w-2.5 h-2.5" />
                </div>
                <span>Associated Samples (3)</span>
              </div>
              <button onClick={() => setAssociatedExpanded(!associatedExpanded)} className="text-slate-400 hover:text-slate-700">
                {associatedExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {associatedExpanded && (
              <div className="p-3.5 space-y-2.5 text-xs">
                {/* Item 1 */}
                <div className="p-3 bg-white rounded border border-[#e5e7eb] shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="link-blue font-mono font-bold">BSA000000</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="text-slate-400">Sample: Sample Na...</span> <strong className="text-slate-800">TWA Demo_A4_D1_S000436</strong>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="p-3 bg-white rounded border border-[#e5e7eb] shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="link-blue font-mono font-bold">BSA000001</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="text-slate-400">Sample: Sample Na...</span> <strong className="text-slate-800">TWA Demo_A5_D1_S000437</strong>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="p-3 bg-white rounded border border-[#e5e7eb] shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="link-blue font-mono font-bold">BSA000002</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="text-slate-400">Sample: Sample Na...</span> <strong className="text-slate-800">TWA Demo_A6_D1_S000438</strong>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <button className="link-blue text-xs font-semibold">View All</button>
                </div>
              </div>
            )}
          </div>

          {/* Widget 2: Inventory Used During Testing (with Donut Chart matching Screenshot 3) */}
          <div className="lims-card p-4 space-y-3">
            <h3 className="font-bold text-xs text-slate-900">Inventory Used During Testing</h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-2">
              {/* Left: SVG Donut Chart */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div className="text-[10px] font-semibold text-slate-500 mb-1">Record Count</div>
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {/* Ring Segments */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e5b800" strokeWidth="18" strokeDasharray="180 240" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e28704" strokeWidth="18" strokeDasharray="15 240" strokeDashoffset="-180" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#4bca81" strokeWidth="18" strokeDasharray="15 240" strokeDashoffset="-195" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#00a1e0" strokeWidth="18" strokeDasharray="15 240" strokeDashoffset="-210" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0176d3" strokeWidth="18" strokeDasharray="15 240" strokeDashoffset="-225" />
                  </svg>
                  {/* Center Number: 20 */}
                  <div className="absolute text-center">
                    <span className="text-xl font-bold text-slate-900">20</span>
                  </div>
                </div>
              </div>

              {/* Right: Legend */}
              <div className="md:col-span-7 space-y-1.5 text-[10px]">
                <div className="text-right text-slate-400 font-medium mb-1">Item Name</div>
                {inventoryItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-1 text-slate-700">
                    <span className="font-mono text-slate-500">{item.count}</span>
                    <span className="truncate flex-1 text-right">{item.name}</span>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
