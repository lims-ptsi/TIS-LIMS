/** Corporate-scheme sending health facilities (by region) that forward specimens to PTSI. */

export type CorporateSenderRegionId =
  | 'QUEZON CITY'
  | 'LAGUNA'
  | 'RIZAL'
  | 'MANDALUYONG'
  | 'PARANAQUE'
  | 'SAN JUAN'
  | 'MUNTINLUPA';

export const CORPORATE_SENDER_REGIONS: { id: CorporateSenderRegionId; label: string }[] = [
  { id: 'QUEZON CITY', label: 'Quezon City' },
  { id: 'LAGUNA', label: 'Laguna' },
  { id: 'RIZAL', label: 'Rizal' },
  { id: 'MANDALUYONG', label: 'Mandaluyong' },
  { id: 'PARANAQUE', label: 'Parañaque' },
  { id: 'SAN JUAN', label: 'San Juan' },
  { id: 'MUNTINLUPA', label: 'Muntinlupa' },
];

/** @deprecated use CorporateSenderRegionId */
export const QUEZON_CITY_CORPORATE_REGION = 'QUEZON CITY' as const;

export interface CorporateHealthFacility {
  id: string;
  region: CorporateSenderRegionId;
  name: string;
}

export const CORPORATE_SENDER_OTHER_ID = '__corporate_sender_other__';

const QUEZON_CITY_FACILITIES: Omit<CorporateHealthFacility, 'region'>[] = [
  { id: 'qc-apolonio-samson', name: 'Apolonio Samson Health Center' },
  { id: 'qc-baesa', name: 'Baesa Health Center' },
  { id: 'qc-bago-bantay', name: 'Bago Bantay Health Center' },
  { id: 'qc-bagong-pag-asa', name: 'Bagong Pag-asa Health Center' },
  { id: 'qc-balingasa', name: 'Balingasa Health Center' },
  { id: 'qc-banlat', name: 'Banlat Health Center' },
  { id: 'qc-batasan-idots', name: 'Batasan Hills Super Health Center-iDOTS' },
  { id: 'qc-bernardo', name: 'Bernardo Health Center' },
  { id: 'qc-eamc', name: 'EAMC' },
  {
    id: 'qc-jose-rodriguez-tala',
    name: 'Dr. Jose N. Rodriguez Memorial Hospital and Sanitarium / TALA',
  },
  { id: 'qc-e-rodriguez', name: 'E. Rodriguez Health Center' },
  { id: 'qc-ermin-garcia', name: 'Ermin Garcia Health Center' },
  { id: 'qc-escopa', name: 'Escopa Health Center' },
  { id: 'qc-gen-roxas', name: 'Gen Roxas Health Center' },
  { id: 'qc-kalayaan', name: 'Kalayaan Health Center' },
  { id: 'qc-kamuning', name: 'Kamuning Health Center' },
  { id: 'qc-krus-na-ligas', name: 'Krus na Ligas' },
  { id: 'qc-pinahan', name: 'Piñahan Health Center' },
  { id: 'qc-ptsi-idots-kasaka', name: 'PTSI iDOTS / KASAKA' },
  { id: 'qc-la-loma', name: 'La Loma Health Center' },
  { id: 'qc-lung-center', name: 'Lung Center of the Philippines' },
  { id: 'qc-masambong', name: 'Masambong Health Center' },
  { id: 'qc-melchora-aquino', name: 'Melchora Aquino Health Center' },
  { id: 'qc-mercedes-de-joya', name: 'Mercedes De Joya Health Center' },
  { id: 'qc-murphy', name: 'Murphy Super Health Center' },
  { id: 'qc-mh-pedro', name: 'M. H. Pedro Health Center' },
  { id: 'qc-old-balara', name: 'Old Balara Health Center' },
  { id: 'qc-paltok', name: 'Paltok Health Center' },
  { id: 'qc-pansol', name: 'Pansol Health Center' },
  { id: 'qc-project-4', name: 'Project 4 Health Center' },
  { id: 'qc-proj-6', name: 'Proj 6 Health Center' },
  { id: 'qc-proj-7', name: 'Proj 7 Health Center' },
  { id: 'qc-qmmc', name: 'QMMC' },
  { id: 'qc-san-antonio', name: 'San Antonio Health Center' },
  { id: 'qc-san-francisco', name: 'San Francisco Super Health Center' },
  { id: 'qc-san-vicente', name: 'San Vicente Health Center' },
  { id: 'qc-sangandaan', name: 'Sangandaan Health Center' },
  { id: 'qc-socorro', name: 'Socorro Health Center' },
  { id: 'qc-tandang-sora', name: 'Tandang Sora Health Center' },
  { id: 'qc-toro-hills', name: 'Toro Hills Health Center' },
  { id: 'qc-v-luna', name: 'V. Luna Medical Center' },
  { id: 'qc-veterans-hc', name: 'Veterans Health Center' },
  { id: 'qc-vmmc', name: 'Veterans Memorial Medical Center' },
];

const LAGUNA_FACILITIES: Omit<CorporateHealthFacility, 'region'>[] = [
  { id: 'lag-alaminos', name: 'Alaminos RHU' },
  { id: 'lag-bay', name: 'Bay RHU' },
  { id: 'lag-binan', name: 'Binan CHO' },
  { id: 'lag-cabuyao', name: 'Cabuyao CHO' },
  { id: 'lag-calamba', name: 'Calamba CHO' },
  { id: 'lag-calauan', name: 'Calauan RHU' },
  { id: 'lag-kalayaan', name: 'Kalayaan RHU' },
  { id: 'lag-los-banos', name: 'Los Baños RHU 2' },
  { id: 'lag-mabitac', name: 'Mabitac RHU' },
  { id: 'lag-paete', name: 'Paete RHU' },
  { id: 'lag-pakil', name: 'Pakil RHU' },
  { id: 'lag-pangil', name: 'Pangil RHU' },
  { id: 'lag-pila', name: 'Pila RHU' },
  { id: 'lag-san-pablo-idots', name: 'San Pablo Colleges iDOTS' },
  { id: 'lag-san-pedro', name: 'San Pedro RHU' },
  { id: 'lag-santa-maria', name: 'Santa Maria RHU' },
  { id: 'lag-sta-rosa', name: 'Sta Rosa CHO' },
  { id: 'lag-siniloan', name: 'Siniloan RHU' },
  { id: 'lag-victoria', name: 'Victoria RHU' },
];

const RIZAL_FACILITIES: Omit<CorporateHealthFacility, 'region'>[] = [
  { id: 'riz-angono', name: 'Angono RHU' },
  { id: 'riz-antipolo', name: 'Antipolo City Health' },
  { id: 'riz-baras', name: 'Baras RHU' },
  { id: 'riz-binangonan', name: 'Binangonan RHU' },
  { id: 'riz-cainta', name: 'Cainta RHU' },
  { id: 'riz-cardona', name: 'Cardona RHU' },
  { id: 'riz-jala-jala', name: 'Jala-Jala RHU' },
  { id: 'riz-morong', name: 'Morong RHU' },
  { id: 'riz-pililla', name: 'Pililla RHU' },
  { id: 'riz-rodriguez', name: 'Rodriguez RHU' },
  { id: 'riz-san-mateo-super', name: 'San Mateo Super Health' },
  { id: 'riz-san-mateo', name: 'San Mateo RHU' },
  { id: 'riz-tanay', name: 'Tanay RHU' },
  { id: 'riz-taytay', name: 'Taytay RHU' },
  { id: 'riz-teresa', name: 'Teresa RHU' },
];

const MANDALUYONG_FACILITIES: Omit<CorporateHealthFacility, 'region'>[] = [
  { id: 'mdl-block-37', name: 'Block 37 Health Center' },
  { id: 'mdl-block-38', name: 'Block 38 Health Center' },
  { id: 'mdl-block-39', name: 'Block 39 Health Center' },
  { id: 'mdl-mabini-jose-rizal', name: 'Mabini-Jose Rizal Health Center' },
  { id: 'mdl-mauway', name: 'Mauway Health Center' },
  { id: 'mdl-ncmh', name: 'National Center for Mental Health' },
  { id: 'mdl-panatag', name: 'Panatag Health Center' },
  { id: 'mdl-plainview', name: 'Plainview Health Center' },
  { id: 'mdl-pleasant-hills', name: 'Pleasant Hills Health Center' },
  { id: 'mdl-poblacion', name: 'Poblacion Health Center' },
  { id: 'mdl-saniboy', name: 'Saniboy Health Center' },
  { id: 'mdl-san-jose', name: 'San Jose Health Center' },
  { id: 'mdl-vergara', name: 'Vergara Health Center' },
  { id: 'mdl-welfareville', name: 'Welfareville Health Center' },
  { id: 'mdl-zaniga', name: 'Zaniga Health Center' },
];

const PARANAQUE_FACILITIES: Omit<CorporateHealthFacility, 'region'>[] = [
  { id: 'pq-baclaran', name: 'Baclaran Health Center' },
  { id: 'pq-bf-homes', name: 'BF Homes Health Center' },
  { id: 'pq-don-bosco', name: 'Don Bosco Health Center' },
  { id: 'pq-don-galo', name: 'Don Galo Health Center' },
  { id: 'pq-la-huerta', name: 'La Huerta Health Center' },
  { id: 'pq-marcelo-green', name: 'Marcelo Green Health Center' },
  { id: 'pq-merville', name: 'Merville Health Center' },
  { id: 'pq-moonwalk', name: 'Moonwalk Health Center' },
  { id: 'pq-san-antonio', name: 'San Antonio Health Center' },
  { id: 'pq-san-dionisio', name: 'San Dionisio Health Center' },
  { id: 'pq-san-isidro', name: 'San Isidro Health Center' },
  { id: 'pq-san-martin-porres', name: 'San Martin de Porres Health Center' },
  { id: 'pq-sto-nino', name: 'Sto Nino Health Center' },
  { id: 'pq-sun-valley', name: 'Sun Valley Mega Health Center' },
  { id: 'pq-tambo', name: 'Tambo Health Center' },
  { id: 'pq-vitalez', name: 'Vitalez Health Center' },
];

const SAN_JUAN_FACILITIES: Omit<CorporateHealthFacility, 'region'>[] = [
  { id: 'sj-balong-bato', name: 'Balong bato Health Center' },
  { id: 'sj-batis', name: 'Batis Health Center' },
  { id: 'sj-corazon-de-jesus', name: 'Corazon De Jesus' },
  { id: 'sj-kabayanan', name: 'Kabayanan Health Center' },
  { id: 'sj-onse', name: 'Onse Health Center' },
  { id: 'sj-salapan', name: 'Salapan Health Center' },
  { id: 'sj-cho', name: 'San Juan CHO' },
  { id: 'sj-sta-lucia', name: 'Sta Lucia Health Center' },
  { id: 'sj-tibagan', name: 'Tibagan Health Center' },
  { id: 'sj-west-crame', name: 'West Crame Health Center' },
];

const MUNTINLUPA_FACILITIES: Omit<CorporateHealthFacility, 'region'>[] = [
  { id: 'mnl-nbp-hospital', name: 'New Bilibid Prison Hospital' },
];

export const CORPORATE_HEALTH_FACILITIES: CorporateHealthFacility[] = [
  ...QUEZON_CITY_FACILITIES.map((f) => ({ ...f, region: 'QUEZON CITY' as const })),
  ...LAGUNA_FACILITIES.map((f) => ({ ...f, region: 'LAGUNA' as const })),
  ...RIZAL_FACILITIES.map((f) => ({ ...f, region: 'RIZAL' as const })),
  ...MANDALUYONG_FACILITIES.map((f) => ({ ...f, region: 'MANDALUYONG' as const })),
  ...PARANAQUE_FACILITIES.map((f) => ({ ...f, region: 'PARANAQUE' as const })),
  ...SAN_JUAN_FACILITIES.map((f) => ({ ...f, region: 'SAN JUAN' as const })),
  ...MUNTINLUPA_FACILITIES.map((f) => ({ ...f, region: 'MUNTINLUPA' as const })),
];

/** @deprecated use corporateSendersForRegion('QUEZON CITY') */
export const QUEZON_CITY_CORPORATE_SENDERS = QUEZON_CITY_FACILITIES;

const senderById = new Map(CORPORATE_HEALTH_FACILITIES.map((s) => [s.id, s]));

const senderByRegionAndName = new Map<string, CorporateHealthFacility>();
for (const s of CORPORATE_HEALTH_FACILITIES) {
  senderByRegionAndName.set(`${s.region}\0${s.name.toLowerCase()}`, s);
}

export function corporateSendersForRegion(
  region: CorporateSenderRegionId
): CorporateHealthFacility[] {
  return CORPORATE_HEALTH_FACILITIES.filter((s) => s.region === region);
}

export function findCorporateHealthFacilityById(id: string): CorporateHealthFacility | undefined {
  return senderById.get(id);
}

function stripRegionPrefix(raw: string): { region: CorporateSenderRegionId | null; namePart: string } {
  for (const { id: region } of CORPORATE_SENDER_REGIONS) {
    const emDash = `${region} —`;
    const hyphen = `${region} -`;
    if (raw.toUpperCase().startsWith(emDash.toUpperCase())) {
      return { region, namePart: raw.slice(emDash.length).trim() };
    }
    if (raw.toUpperCase().startsWith(hyphen.toUpperCase())) {
      return { region, namePart: raw.slice(hyphen.length).trim() };
    }
  }
  return { region: null, namePart: raw };
}

export function formatCorporateSenderOrganization(
  region: CorporateSenderRegionId,
  senderName: string
): string {
  const trimmed = senderName.trim();
  if (!trimmed) return '';
  const prefixed = `${region} — ${trimmed}`;
  if (trimmed.toUpperCase().startsWith(region)) return trimmed;
  return prefixed;
}

/** Resolve saved organization string back to region, dropdown, and optional free text. */
export function parseCorporateSenderOrganization(org?: string | null): {
  region: CorporateSenderRegionId;
  senderId: string;
  otherText: string;
} {
  const raw = String(org ?? '').trim();
  if (!raw) {
    return { region: 'QUEZON CITY', senderId: '', otherText: '' };
  }

  if (raw.toUpperCase() === 'PHILIPPINE TUBERCULOSIS SOCIETY, INC.') {
    return { region: 'QUEZON CITY', senderId: '', otherText: '' };
  }

  const { region, namePart } = stripRegionPrefix(raw);
  const effectiveRegion = region ?? 'QUEZON CITY';

  if (region) {
    const matched = senderByRegionAndName.get(`${region}\0${namePart.toLowerCase()}`);
    if (matched) {
      return { region: matched.region, senderId: matched.id, otherText: '' };
    }
  } else {
    for (const s of CORPORATE_HEALTH_FACILITIES) {
      if (s.name.toLowerCase() === namePart.toLowerCase()) {
        return { region: s.region, senderId: s.id, otherText: '' };
      }
    }
  }

  return {
    region: effectiveRegion,
    senderId: CORPORATE_SENDER_OTHER_ID,
    otherText: namePart || raw,
  };
}

export function resolveCorporateOrganizationForSave(
  region: CorporateSenderRegionId,
  senderId: string,
  otherText: string
): string {
  if (!senderId) return '';
  if (senderId === CORPORATE_SENDER_OTHER_ID) {
    return formatCorporateSenderOrganization(region, otherText);
  }
  const sender = findCorporateHealthFacilityById(senderId);
  if (!sender) return '';
  return formatCorporateSenderOrganization(sender.region, sender.name);
}
