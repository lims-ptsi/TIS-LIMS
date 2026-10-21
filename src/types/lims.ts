export type SampleStatus = 
  | 'REGISTERED' 
  | 'RECEIVED' 
  | 'ACCESSIONED' 
  | 'TESTING' 
  | 'REVIEW_PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'ARCHIVED';

export type PriorityLevel = 'ROUTINE' | 'PRIORITY' | 'STAT';

export type PatientCategory = 
  | 'OPD' 
  | 'PhilHealth' 
  | 'Indigent' 
  | 'Corporate' 
  | 'Pre-Employment / Employee'
  | 'Employee' 
  | 'Projects';

export type ParameterDataType = 'NUMERIC' | 'STRING' | 'ENUM' | 'CALCULATED' | 'BOOLEAN';

export interface StorageLocation {
  facility: string;
  room: string;
  unit: string; // e.g., Freezer -80°C #2
  rack: string;
  box: string;
  well?: string; // e.g., C4
  temperature: string;
}

export interface CustodyRecord {
  id: string;
  timestamp: string;
  fromUser: string;
  toUser: string;
  action: string;
  reason: string;
  signatureHash: string;
  temperatureAtTransfer: string;
}

export interface Sample {
  id: string;
  barcode: string;
  externalId: string; // Medical Record No / Client Sample ID
  sampleType: 'Whole Blood' | 'Serum' | 'Plasma' | 'Urine' | 'Wastewater' | 'Soil' | 'Drinking Water' | 'Biopsy Tissue';
  matrix: string;
  patientOrSourceName: string;
  patientCategory?: PatientCategory;
  collectionDate: string;
  receivedDate: string;
  holdTimeDeadline: string; // SLA hold time
  priority: PriorityLevel;
  status: SampleStatus;
  storageLocation: StorageLocation;
  preservationStatus: string;
  volumeMl: number;
  assignedTests: string[]; // Test catalog IDs
  chainOfCustody: CustodyRecord[];
  aliquotCount: number;
  parentSampleId?: string;
  notes?: string;
}

export interface TestParameter {
  id: string;
  code: string;
  name: string;
  unit: string;
  dataType: ParameterDataType;
  lodLimit?: number; // Limit of Detection
  loqLimit?: number; // Limit of Quantitation
  specMin?: number;
  specMax?: number;
  criticalMin?: number;
  criticalMax?: number;
  enumOptions?: string[];
  calculationFormula?: string; // e.g. "param['dry_wt'] - param['tare_wt']"
  qcTargetMean?: number;
  qcTargetSD?: number;
  sequenceOrder: number;
}

export interface TestDefinition {
  id: string;
  code: string;
  name: string;
  category: 'Clinical Chemistry' | 'Hematology' | 'Toxicology & Mass Spec' | 'Molecular PCR' | 'Environmental & Water';
  methodReference: string; // e.g. "EPA 200.8", "ISO 15189 Standard", "LC-MS/MS Method 401"
  tatHours: number;
  defaultInstrumentId?: string;
  reagentRequiredLot?: string;
  reagentVolumePerTestMl?: number;
  parameters: TestParameter[];
}

export interface TestResultItem {
  parameterId: string;
  parameterCode: string;
  parameterName: string;
  unit: string;
  rawValue: string;
  calculatedValue?: number;
  formattedDisplay: string;
  flag: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL' | 'OOS' | 'PENDING';
  deltaCheckWarning?: boolean;
  previousValue?: string;
  dilutionFactor: number;
}

export interface TestOrder {
  id: string;
  sampleId: string;
  sampleBarcode: string;
  patientOrSourceName: string;
  testDefinitionId: string;
  testCode: string;
  testName: string;
  priority: PriorityLevel;
  status: 'QUEUED' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'APPROVED' | 'REJECTED';
  assignedAnalyst: string;
  instrumentId?: string;
  batchId?: string;
  results: Record<string, TestResultItem>; // keyed by parameterId
  startedAt?: string;
  completedAt?: string;
  validatedBy?: string;
  validatedAt?: string;
  notes?: string;
}

export interface MicroplateWell {
  row: string; // A - H
  col: number; // 1 - 12
  position: string; // A1, A2...
  type: 'EMPTY' | 'SAMPLE' | 'BLANK' | 'CALIBRATOR' | 'QC_LOW' | 'QC_HIGH' | 'NEGATIVE_CTRL' | 'POSITIVE_CTRL';
  sampleBarcode?: string;
  sampleId?: string;
  testOrderId?: string;
  testCode?: string;
  replicate?: number;
  status?: 'UNASSIGNED' | 'ASSIGNED' | 'TESTED' | 'FLAGGED';
}

export interface BatchWorklist {
  id: string;
  batchNumber: string;
  name: string;
  testDefinitionId: string;
  testCode: string;
  instrumentId: string;
  createdAt: string;
  createdBy: string;
  status: 'PREPARATION' | 'RUNNING' | 'COMPLETED' | 'VALIDATED';
  plateLayout: MicroplateWell[];
  orderIds: string[];
}

export interface QCRunRecord {
  id: string;
  runDate: string;
  testCode: string;
  parameterCode: string;
  parameterName: string;
  controlLot: string;
  level: 'LEVEL_1_LOW' | 'LEVEL_2_NORMAL' | 'LEVEL_3_HIGH';
  targetMean: number;
  targetSD: number;
  measuredValue: number;
  zScore: number;
  westgardRuleTriggered: 'NONE' | '1-2s' | '1-3s' | '2-2s' | 'R-4s' | '4-1s' | '10-x';
  status: 'ACCEPTED' | 'WARNING' | 'REJECTED';
  analyst: string;
  correctiveAction?: string;
}

export interface ReagentInventoryItem {
  id: string;
  catalogNumber: string;
  name: string;
  testCategoryId: string;
  lotNumber: string;
  supplier: string;
  volumeRemainingMl: number;
  initialVolumeMl: number;
  storageTemp: string;
  receivedDate: string;
  openedDate?: string;
  expirationDate: string;
  openStabilityDays: number;
  isExpired: boolean;
  isLocked: boolean;
  minThresholdAlertMl: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SIGN_OFF' | 'OVERRIDE' | 'BATCH_RELEASE';
  user: string;
  userRole: string;
  ipAddress: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  reasonForChange: string;
  prevHash: string;
  entryHash: string;
}

export interface InstrumentDevice {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  protocol: 'ASTM E1381/E1394' | 'HL7 v2.5.1' | 'RS-232 Serial' | 'File Watcher (LC-MS)' | 'REST / MQTT';
  status: 'ONLINE' | 'RUNNING' | 'MAINTENANCE_DUE' | 'OFFLINE' | 'CALIBRATING';
  currentBatch?: string;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  connectionEndpoint: string;
  throughputSamplesPerHour: number;
}

export type CivilStatus = 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Divorced';

export interface LabTestRequisition {
  id: string;
  requisitionNumber: string;
  requestDate: string; // Date
  patientOrSubjectName: string; // Combined Full Name
  patientId?: string; // Stable id shared by every request for this person
  firstName?: string; // First Name
  middleName?: string; // Middle Name
  lastName?: string; // Last Name
  suffix?: string; // Suffix (Jr., Sr., III, etc.)
  patientDob: string; // Birthday
  patientAddress: string; // Address
  caseNo: string; // Case No
  patientAge: number; // Age
  patientGender: 'Male' | 'Female' | 'Other'; // Sex
  civilStatus: CivilStatus; // Civil Status
  kindOfExamination: string[]; // Kind of Examination
  orderingPhysicianOrPI: string; // Requesting Physician (name of doctor, should have ,MD after the name)
  orNumber: string; // OR#
  chargeSlipNumber: string; // Charge Slip#
  
  // Supplementary workflow fields
  organizationOrClient: string;
  externalRef: string;
  patientCategory?: PatientCategory;
  priority: PriorityLevel;
  selectedTestIds: string[];
  selectedTestNames: string[];
  specimenTypes: string[];
  tubeCount: number;
  clinicalNotes: string;
  status: 'SUBMITTED' | 'RECEIVED' | 'IN_TESTING' | 'COMPLETED' | 'CANCELLED';
  tatDeadline: string;
}

export type NotificationType = 
  | 'NEW_REQUEST' 
  | 'ACCESSIONED' 
  | 'RESULTS_READY' 
  | 'PAYMENT_SETTLED' 
  | 'STAT_ALERT'
  | 'SYSTEM_ALERT';

export interface LimsNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: PriorityLevel;
  reqId?: string;
  caseNo?: string;
  sampleId?: string;
  patientName?: string;
  targetTab?: string;
}
