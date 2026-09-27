export interface DistrictInfo {
  code: string;
  name: string;
  stateCode: 'TG' | 'AP';
  stateName: string;
  headquarters: string;
  center: {
    lat: number;
    lng: number;
  };
  tier: 2 | 3;
  popularLocalities: string[];
}

export interface StateInfo {
  code: string;
  name: string;
  districts: DistrictInfo[];
}

export const TELANGANA_DISTRICTS: DistrictInfo[] = [
  {
    code: 'WARANGAL',
    name: 'Warangal',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Warangal / Hanamkonda',
    center: { lat: 17.9689, lng: 79.5941 },
    tier: 2,
    popularLocalities: ['Subedari', 'Nakkalagutta', 'Kazipet', 'Hunter Road', 'Hanamkonda', 'Balasamudram', 'Waddepally'],
  },
  {
    code: 'MAHABUBNAGAR',
    name: 'Mahabubnagar',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Mahabubnagar',
    center: { lat: 16.7488, lng: 77.9942 },
    tier: 2,
    popularLocalities: ['Raichur Road', 'Yenugonda', 'Christian Pally', 'Balanagar', 'Old Town', 'Boyapally'],
  },
  {
    code: 'NALGONDA',
    name: 'Nalgonda',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Nalgonda',
    center: { lat: 17.0575, lng: 79.2684 },
    tier: 3,
    popularLocalities: ['Clock Tower Center', 'Ramagiri', 'Devarakonda Road', 'Prakasham Bazar', 'Miryalaguda Road'],
  },
  {
    code: 'KARIMNAGAR',
    name: 'Karimnagar',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Karimnagar',
    center: { lat: 18.4386, lng: 79.1288 },
    tier: 2,
    popularLocalities: ['Mukarrampura', 'Collectorate Road', 'Kothapalli', 'Manakondur Road', 'Vidyanagar', 'Sapthagiri Colony'],
  },
  {
    code: 'KHAMMAM',
    name: 'Khammam',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Khammam',
    center: { lat: 17.2473, lng: 80.1514 },
    tier: 2,
    popularLocalities: ['Wyra Road', 'Mamillagudem', 'Rotary Nagar', 'Bank Colony', 'Balanagar', 'Khanapuram'],
  },
  {
    code: 'NIZAMABAD',
    name: 'Nizamabad',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Nizamabad',
    center: { lat: 18.6725, lng: 78.0941 },
    tier: 2,
    popularLocalities: ['Khaleelwadi', 'Pragathi Nagar', 'Bodhan Road', 'Armoor Road', 'Subhash Nagar', 'Vinayak Nagar'],
  },
  {
    code: 'HYDERABAD',
    name: 'Hyderabad',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Hyderabad',
    center: { lat: 17.3850, lng: 78.4867 },
    tier: 2,
    popularLocalities: ['Gachibowli', 'Hitec City', 'Banjara Hills', 'Kondapur', 'Madhapur', 'Jubilee Hills', 'Kukatpally'],
  },
  {
    code: 'RANGAREDDY',
    name: 'Rangareddy',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Shamshabad',
    center: { lat: 17.2403, lng: 78.4294 },
    tier: 2,
    popularLocalities: ['Shamshabad', 'Rajendranagar', 'Attapur', 'Manikonda', 'Gopanpally'],
  },
  {
    code: 'MEDCHAL_MALKAJGIRI',
    name: 'Medchal-Malkajgiri',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Malkajgiri',
    center: { lat: 17.4984, lng: 78.5312 },
    tier: 2,
    popularLocalities: ['Malkajgiri', 'Kompally', 'Medchal', 'Alwal', 'Sainikpuri', 'Kukatpally'],
  },
  {
    code: 'SIDDIPET',
    name: 'Siddipet',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Siddipet',
    center: { lat: 18.1018, lng: 78.8520 },
    tier: 3,
    popularLocalities: ['KCR Nagar', 'Old Bus Stand', 'Medak Road', 'Mustabad Road'],
  },
  {
    code: 'SURYAPET',
    name: 'Suryapet',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Suryapet',
    center: { lat: 17.1439, lng: 79.6239 },
    tier: 3,
    popularLocalities: ['Khammam Road', 'NH65 Bypass', 'Vidyanagar', 'Kudakuda Road'],
  },
  {
    code: 'ADILABAD',
    name: 'Adilabad',
    stateCode: 'TG',
    stateName: 'Telangana',
    headquarters: 'Adilabad',
    center: { lat: 19.6641, lng: 78.5320 },
    tier: 3,
    popularLocalities: ['Shivaji Nagar', 'Collectorate Area', 'Bhuktapur', 'Brahminwadi'],
  },
];

export const ANDHRA_PRADESH_DISTRICTS: DistrictInfo[] = [
  {
    code: 'NTR_VIJAYAWADA',
    name: 'Vijayawada / NTR',
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    headquarters: 'Vijayawada',
    center: { lat: 16.5062, lng: 80.6480 },
    tier: 2,
    popularLocalities: ['Benz Circle', 'MG Road', 'Bhavanipuram', 'Gunadala', 'Auto Nagar', 'Governorpet', 'Satyanarayanapuram'],
  },
  {
    code: 'GUNTUR',
    name: 'Guntur',
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    headquarters: 'Guntur',
    center: { lat: 16.3067, lng: 80.4365 },
    tier: 2,
    popularLocalities: ['Lakshmipuram', 'Brodipet', 'Arundelpet', 'Vidya Nagar', 'Pattabhipuram', 'Amaravati Road'],
  },
  {
    code: 'VISAKHAPATNAM',
    name: 'Visakhapatnam',
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    headquarters: 'Visakhapatnam',
    center: { lat: 17.6868, lng: 83.2185 },
    tier: 2,
    popularLocalities: ['Beach Road', 'MVP Colony', 'Madhurawada', 'Gajuwaka', 'Dwaraka Nagar', 'Seethammadhara'],
  },
  {
    code: 'TIRUPATI',
    name: 'Tirupati',
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    headquarters: 'Tirupati',
    center: { lat: 13.6288, lng: 79.4192 },
    tier: 2,
    popularLocalities: ['AIR Bypass Road', 'Korlagunta', 'Alipiri Road', 'Bhavani Nagar', 'KT Road', 'MR Palli'],
  },
  {
    code: 'KURNOOL',
    name: 'Kurnool',
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    headquarters: 'Kurnool',
    center: { lat: 15.8281, lng: 78.0373 },
    tier: 2,
    popularLocalities: ['Nandyal Road', 'Collectorate', 'B Camp', 'Roza Dargah', 'Venkayapalli'],
  },
  {
    code: 'NELLORE',
    name: 'Nellore',
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    headquarters: 'Nellore',
    center: { lat: 14.4426, lng: 79.9865 },
    tier: 2,
    popularLocalities: ['Vedayapalem', 'Dargamitta', 'Magunta Layout', 'Podalakur Road', 'Pogathota'],
  },
  {
    code: 'ANANTAPUR',
    name: 'Anantapur',
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    headquarters: 'Anantapur',
    center: { lat: 14.6819, lng: 77.6006 },
    tier: 3,
    popularLocalities: ['Clock Tower', 'Subash Nagar', 'Kamalanagar', 'Housing Board Colony'],
  },
  {
    code: 'KAKINADA',
    name: 'Kakinada',
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    headquarters: 'Kakinada',
    center: { lat: 16.9891, lng: 82.2475 },
    tier: 2,
    popularLocalities: ['Bhanugudi Junction', 'Sarpavaram', 'Main Road', 'Cinema Road', 'Suryaraopeta'],
  },
  {
    code: 'RAJAHMUNDRY',
    name: 'Rajahmundry / East Godavari',
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    headquarters: 'Rajahmundry',
    center: { lat: 17.0005, lng: 81.8040 },
    tier: 2,
    popularLocalities: ['Danavaipeta', 'Kotipalli Bus Stand', 'Morampudi', 'Syndicate Bank Colony'],
  },
];

export const STATES_CONFIG: StateInfo[] = [
  {
    code: 'TG',
    name: 'Telangana',
    districts: TELANGANA_DISTRICTS,
  },
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    districts: ANDHRA_PRADESH_DISTRICTS,
  },
];

export class GeographyService {
  static getStates() {
    return STATES_CONFIG.map((s) => ({ code: s.code, name: s.name, districtCount: s.districts.length }));
  }

  static getDistrictsByState(stateNameOrCode?: string): DistrictInfo[] {
    if (!stateNameOrCode) {
      return [...TELANGANA_DISTRICTS, ...ANDHRA_PRADESH_DISTRICTS];
    }
    const clean = stateNameOrCode.trim().toLowerCase();
    const state = STATES_CONFIG.find(
      (s) => s.code.toLowerCase() === clean || s.name.toLowerCase() === clean
    );
    return state ? state.districts : [];
  }

  static findDistrict(districtName: string): DistrictInfo | undefined {
    const clean = districtName.trim().toLowerCase();
    return [...TELANGANA_DISTRICTS, ...ANDHRA_PRADESH_DISTRICTS].find(
      (d) => d.name.toLowerCase() === clean || d.code.toLowerCase() === clean || d.headquarters.toLowerCase().includes(clean)
    );
  }
}
