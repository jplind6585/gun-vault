import { useState, useEffect, useRef } from 'react';
import { theme } from './theme';
import type { Optic, OpticAssignment } from './types';
import {
  getAllOptics, getAllAssignments, getActiveAssignmentForOptic,
  addOptic, updateOptic, getMountsForOptic,
} from './storage';
import { getAllGuns } from './storage';
import { getOpticBrands, getOpticModelsForBrand, getOpticSpec } from './lib/referenceData';

interface OpticsListProps {
  onSelectOptic: (optic: Optic) => void;
}

const OPTIC_TYPE_COLORS: Record<string, string> = {
  'Red Dot':    theme.red,
  'Holographic': theme.orange,
  'LPVO':       theme.accent,
  'Scope':      theme.blue,
  'Prism':      theme.green,
  'Night Vision': '#b197fc',
  'Thermal':    '#ff8787',
  'Magnifier':  theme.textSecondary,
  'Rangefinder': '#63e6be',
};

const OPTIC_TYPES = [
  'Red Dot', 'Holographic', 'LPVO', 'Scope', 'Prism',
  'Night Vision', 'Thermal', 'Magnifier', 'Rangefinder',
] as const;

const FOCAL_PLANES = ['FFP', 'SFP', 'N/A'] as const;
const TURRET_UNITS = ['MOA', 'MRAD'] as const;
const OPTIC_STATUSES = ['Active', 'Stored', 'Loaned Out', 'Sold'] as const;

// ── Known optic specs database ────────────────────────────────────────────────
interface KnownSpec {
  opticType: typeof OPTIC_TYPES[number];
  magnificationMin?: number;
  magnificationMax?: number;
  objectiveMM?: number;
  focalPlane?: typeof FOCAL_PLANES[number];
  reticleName?: string;
  illuminated?: boolean;
  turretUnit?: typeof TURRET_UNITS[number];
  clickValueMOA?: number;
  clickValueMRAD?: number;
  batteryType?: string;
  weightOz?: number;
  msrp?: number;
}

const KNOWN_OPTICS: Record<string, Record<string, KnownSpec>> = {
  Trijicon: {
    'ACOG 4x32':           { opticType: 'Prism',   magnificationMin: 4, magnificationMax: 4,   objectiveMM: 32, focalPlane: 'FFP', reticleName: 'BDC', illuminated: true,  turretUnit: 'MOA', weightOz: 9.9,  msrp: 1199 },
    'ACOG 3.5x35':         { opticType: 'Prism',   magnificationMin: 3.5, magnificationMax: 3.5, objectiveMM: 35, focalPlane: 'FFP', reticleName: 'BDC', illuminated: true,  turretUnit: 'MOA', weightOz: 10.3, msrp: 1199 },
    'MRO':                 { opticType: 'Red Dot',  illuminated: true, batteryType: 'CR2032', weightOz: 4.1, msrp: 479 },
    'MRO HD':              { opticType: 'Red Dot',  illuminated: true, batteryType: 'CR2032', weightOz: 5.0, msrp: 629 },
    'RMR Type 2':          { opticType: 'Red Dot',  illuminated: true, batteryType: 'CR2032', weightOz: 1.2, msrp: 699 },
    'RMR CC':              { opticType: 'Red Dot',  illuminated: true, batteryType: 'CR2032', weightOz: 1.0, msrp: 699 },
    'SRO':                 { opticType: 'Red Dot',  illuminated: true, batteryType: 'CR2032', weightOz: 1.3, msrp: 849 },
    'VCOG 1-6x24':         { opticType: 'LPVO',    magnificationMin: 1, magnificationMax: 6,   objectiveMM: 24, focalPlane: 'FFP', reticleName: 'MRAD Segmented Circle', illuminated: true,  turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 19.0, msrp: 2999 },
    'Credo HX 1-6x24':     { opticType: 'LPVO',    magnificationMin: 1, magnificationMax: 6,   objectiveMM: 24, focalPlane: 'SFP', reticleName: 'MOA Duplex', illuminated: false, turretUnit: 'MOA',  clickValueMOA: 0.25, weightOz: 16.8, msrp: 999 },
    'AccuPower 1-4x24':    { opticType: 'LPVO',    magnificationMin: 1, magnificationMax: 4,   objectiveMM: 24, focalPlane: 'SFP', illuminated: true,  turretUnit: 'MOA',  clickValueMOA: 0.25, weightOz: 13.4, msrp: 799 },
    'AccuPower 4-16x50':   { opticType: 'Scope',   magnificationMin: 4, magnificationMax: 16,  objectiveMM: 50, focalPlane: 'FFP', turretUnit: 'MOA',  clickValueMOA: 0.25, weightOz: 24.0, msrp: 1199 },
  },
  Aimpoint: {
    'PRO':      { opticType: 'Red Dot', illuminated: true, batteryType: 'DL1/3N', weightOz: 7.8, msrp: 459 },
    'CompM5':   { opticType: 'Red Dot', illuminated: true, batteryType: 'AA',     weightOz: 5.4, msrp: 945 },
    'CompM5s':  { opticType: 'Red Dot', illuminated: true, batteryType: 'AA',     weightOz: 5.1, msrp: 875 },
    'T2':       { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 3.0, msrp: 799 },
    'Micro T-2':{ opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 3.0, msrp: 799 },
    'ACRO P-2': { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 2.0, msrp: 599 },
  },
  EOTech: {
    'XPS2':              { opticType: 'Holographic', illuminated: true, batteryType: 'CR123', weightOz: 9.0, msrp: 549 },
    'XPS3':              { opticType: 'Holographic', illuminated: true, batteryType: 'CR123', weightOz: 9.0, msrp: 699 },
    'EXPS3':             { opticType: 'Holographic', illuminated: true, batteryType: 'AA',    weightOz: 11.2, msrp: 749 },
    'VUDU 1-6x24 FFP':   { opticType: 'LPVO',       magnificationMin: 1, magnificationMax: 6,  objectiveMM: 24, focalPlane: 'FFP', illuminated: true,  turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 17.0, msrp: 1299 },
    'VUDU 5-25x50 FFP':  { opticType: 'Scope',      magnificationMin: 5, magnificationMax: 25, objectiveMM: 50, focalPlane: 'FFP', illuminated: false, turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 31.9, msrp: 1999 },
  },
  Vortex: {
    'Spitfire 3x Prism':        { opticType: 'Prism',  magnificationMin: 3, magnificationMax: 3,  objectiveMM: 25, focalPlane: 'FFP', reticleName: 'EBR-556B', illuminated: true,  turretUnit: 'MOA', weightOz: 9.9,  msrp: 349 },
    'Spitfire HD Gen II 5x':    { opticType: 'Prism',  magnificationMin: 5, magnificationMax: 5,  objectiveMM: 25, focalPlane: 'FFP', reticleName: 'EBR-556B', illuminated: true,  turretUnit: 'MOA', weightOz: 14.1, msrp: 399 },
    'Strike Eagle 1-6x24':      { opticType: 'LPVO',   magnificationMin: 1, magnificationMax: 6,  objectiveMM: 24, focalPlane: 'SFP', reticleName: 'EBR-8', illuminated: true,  turretUnit: 'MOA', clickValueMOA: 0.5, weightOz: 16.8, msrp: 299 },
    'Strike Eagle 1-8x24':      { opticType: 'LPVO',   magnificationMin: 1, magnificationMax: 8,  objectiveMM: 24, focalPlane: 'SFP', reticleName: 'EBR-8', illuminated: true,  turretUnit: 'MOA', clickValueMOA: 0.5, weightOz: 17.5, msrp: 399 },
    'Razor HD Gen II-E 1-6x24': { opticType: 'LPVO',   magnificationMin: 1, magnificationMax: 6,  objectiveMM: 24, focalPlane: 'FFP', reticleName: 'JM-1 BDC', illuminated: true,  turretUnit: 'MOA', clickValueMOA: 0.5, weightOz: 21.5, msrp: 1399 },
    'Razor HD Gen III 1-10x24': { opticType: 'LPVO',   magnificationMin: 1, magnificationMax: 10, objectiveMM: 24, focalPlane: 'FFP', reticleName: 'EBR-9', illuminated: true,  turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 24.2, msrp: 2299 },
    'Viper PST Gen II 1-6x24':  { opticType: 'LPVO',   magnificationMin: 1, magnificationMax: 6,  objectiveMM: 24, focalPlane: 'FFP', reticleName: 'EBR-2C', illuminated: true,  turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 22.6, msrp: 699 },
    'Viper PST Gen II 5-25x50': { opticType: 'Scope',  magnificationMin: 5, magnificationMax: 25, objectiveMM: 50, focalPlane: 'FFP', reticleName: 'EBR-7C', illuminated: false, turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 35.6, msrp: 999 },
    'Crossfire Red Dot':        { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 1.6, msrp: 139 },
    'AMG UH-1 Gen II':          { opticType: 'Holographic', illuminated: true, batteryType: 'CR123', weightOz: 9.0, msrp: 399 },
    'SPARC AR':                 { opticType: 'Red Dot', illuminated: true, batteryType: 'AA', weightOz: 5.3, msrp: 199 },
    'Diamondback Tactical 6-24x50': { opticType: 'Scope', magnificationMin: 6, magnificationMax: 24, objectiveMM: 50, focalPlane: 'FFP', turretUnit: 'MOA', clickValueMOA: 0.1, weightOz: 28.9, msrp: 349 },
  },
  Leupold: {
    'Mark 4HD 1-4.5x24':  { opticType: 'LPVO',  magnificationMin: 1,   magnificationMax: 4.5, objectiveMM: 24, focalPlane: 'FFP', illuminated: true,  turretUnit: 'MOA', clickValueMOA: 0.5, weightOz: 16.9, msrp: 999 },
    'Mark 5HD 3.6-18x44': { opticType: 'Scope', magnificationMin: 3.6, magnificationMax: 18,  objectiveMM: 44, focalPlane: 'FFP', illuminated: false, turretUnit: 'MOA', clickValueMOA: 0.1, weightOz: 26.9, msrp: 1999 },
    'Mark 5HD 5-25x56':   { opticType: 'Scope', magnificationMin: 5,   magnificationMax: 25,  objectiveMM: 56, focalPlane: 'FFP', illuminated: false, turretUnit: 'MOA', clickValueMOA: 0.1, weightOz: 33.6, msrp: 2499 },
    'VX-6HD 1-6x24':      { opticType: 'LPVO',  magnificationMin: 1,   magnificationMax: 6,   objectiveMM: 24, focalPlane: 'SFP', illuminated: true,  turretUnit: 'MOA', clickValueMOA: 0.25, weightOz: 19.5, msrp: 1349 },
    'Mark 6 1-6x20':      { opticType: 'LPVO',  magnificationMin: 1,   magnificationMax: 6,   objectiveMM: 20, focalPlane: 'FFP', illuminated: true,  turretUnit: 'MOA', clickValueMOA: 0.1, weightOz: 23.6, msrp: 2199 },
    'Deltapoint Pro':      { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 1.95, msrp: 429 },
  },
  Nightforce: {
    'ATACR 1-8x24':   { opticType: 'LPVO',  magnificationMin: 1, magnificationMax: 8,  objectiveMM: 24, focalPlane: 'FFP', illuminated: true,  turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 30.0, msrp: 3299 },
    'ATACR 4-16x42':  { opticType: 'Scope', magnificationMin: 4, magnificationMax: 16, objectiveMM: 42, focalPlane: 'FFP', illuminated: false, turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 30.5, msrp: 2699 },
    'ATACR 5-25x56':  { opticType: 'Scope', magnificationMin: 5, magnificationMax: 25, objectiveMM: 56, focalPlane: 'FFP', illuminated: false, turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 44.0, msrp: 3599 },
    'NX8 1-8x24':     { opticType: 'LPVO',  magnificationMin: 1, magnificationMax: 8,  objectiveMM: 24, focalPlane: 'FFP', illuminated: true,  turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 19.2, msrp: 1799 },
    'SHV 3-10x42':    { opticType: 'Scope', magnificationMin: 3, magnificationMax: 10, objectiveMM: 42, focalPlane: 'SFP', illuminated: false, turretUnit: 'MOA', clickValueMOA: 0.25, weightOz: 20.0, msrp: 999 },
    'BEAST 5-25x56':  { opticType: 'Scope', magnificationMin: 5, magnificationMax: 25, objectiveMM: 56, focalPlane: 'FFP', illuminated: false, turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 69.8, msrp: 5499 },
  },
  'Primary Arms': {
    'GLx 2x Prism':       { opticType: 'Prism',  magnificationMin: 2, magnificationMax: 2,  objectiveMM: 28, focalPlane: 'FFP', reticleName: 'ACSS Cyclops', illuminated: true,  turretUnit: 'MOA', weightOz: 10.2, msrp: 259 },
    'GLx 4x Prism':       { opticType: 'Prism',  magnificationMin: 4, magnificationMax: 4,  objectiveMM: 32, focalPlane: 'FFP', reticleName: 'ACSS',         illuminated: true,  turretUnit: 'MOA', weightOz: 15.5, msrp: 329 },
    'SLx 3x MicroPrism':  { opticType: 'Prism',  magnificationMin: 3, magnificationMax: 3,  objectiveMM: 28, focalPlane: 'FFP', reticleName: 'ACSS Cyclops', illuminated: true,  turretUnit: 'MOA', weightOz: 9.0,  msrp: 199 },
    'GLx 6x Prism':       { opticType: 'Prism',  magnificationMin: 6, magnificationMax: 6,  objectiveMM: 32, focalPlane: 'FFP', reticleName: 'ACSS',         illuminated: true,  turretUnit: 'MOA', weightOz: 17.6, msrp: 399 },
    'SLx 1-6x24 FFP':     { opticType: 'LPVO',   magnificationMin: 1, magnificationMax: 6,  objectiveMM: 24, focalPlane: 'FFP', reticleName: 'ACSS Raptor', illuminated: true,  turretUnit: 'MOA', clickValueMOA: 0.5, weightOz: 18.2, msrp: 449 },
  },
  'SIG Sauer': {
    'Romeo5':             { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 5.1, msrp: 149 },
    'Romeo7':             { opticType: 'Red Dot', illuminated: true, batteryType: 'AA',     weightOz: 7.2, msrp: 249 },
    'Romeo Zero':         { opticType: 'Red Dot', illuminated: true, batteryType: 'CR1632', weightOz: 0.8, msrp: 199 },
    'Tango6T 1-6x24':     { opticType: 'LPVO',   magnificationMin: 1, magnificationMax: 6,  objectiveMM: 24, focalPlane: 'FFP', illuminated: true,  turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 23.5, msrp: 1499 },
    'Tango4 4-16x44':     { opticType: 'Scope',  magnificationMin: 4, magnificationMax: 16, objectiveMM: 44, focalPlane: 'FFP', illuminated: false, turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 26.5, msrp: 999 },
    'Whiskey5 3-15x56':   { opticType: 'Scope',  magnificationMin: 3, magnificationMax: 15, objectiveMM: 56, focalPlane: 'SFP', illuminated: false, turretUnit: 'MOA', clickValueMOA: 0.25, weightOz: 31.4, msrp: 799 },
    'KILO2400ABS':        { opticType: 'Rangefinder', weightOz: 26.0, msrp: 2599 },
  },
  Holosun: {
    '510C':           { opticType: 'Red Dot', illuminated: true, batteryType: 'AA',     weightOz: 3.8, msrp: 299 },
    '507C':           { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 1.6, msrp: 249 },
    '507C X2':        { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 1.6, msrp: 279 },
    '507K':           { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 1.1, msrp: 249 },
    '407C':           { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 1.4, msrp: 199 },
    'AEMS':           { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 3.5, msrp: 399 },
    'SCS-MOS':        { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 0.7, msrp: 329 },
    'HE510C-GR Elite':{ opticType: 'Red Dot', illuminated: true, batteryType: 'AA',     weightOz: 3.8, msrp: 399 },
  },
  Burris: {
    'FastFire 3':         { opticType: 'Red Dot',  illuminated: true, batteryType: 'CR2032', weightOz: 1.5, msrp: 209 },
    'XTR III 3.3-18x50':  { opticType: 'Scope',   magnificationMin: 3.3, magnificationMax: 18, objectiveMM: 50, focalPlane: 'FFP', turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 31.0, msrp: 1299 },
    'Veracity 4-20x50':   { opticType: 'Scope',   magnificationMin: 4,   magnificationMax: 20, objectiveMM: 50, focalPlane: 'SFP', turretUnit: 'MOA', clickValueMOA: 0.25, weightOz: 28.0, msrp: 799 },
    'RT-6 1-6x24':        { opticType: 'LPVO',    magnificationMin: 1,   magnificationMax: 6,  objectiveMM: 24, focalPlane: 'SFP', illuminated: true, turretUnit: 'MOA', clickValueMOA: 0.5, weightOz: 19.0, msrp: 399 },
  },
  Bushnell: {
    'Elite Tactical DMR3 3.5-21x50': { opticType: 'Scope', magnificationMin: 3.5, magnificationMax: 21, objectiveMM: 50, focalPlane: 'FFP', turretUnit: 'MOA', clickValueMOA: 0.1, weightOz: 36.8, msrp: 1599 },
    'First Strike 2.0':              { opticType: 'Red Dot', illuminated: true, batteryType: 'CR2032', weightOz: 3.0, msrp: 179 },
    'AR Optics 1-4x24':              { opticType: 'LPVO',   magnificationMin: 1, magnificationMax: 4, objectiveMM: 24, focalPlane: 'SFP', illuminated: true, turretUnit: 'MOA', clickValueMOA: 0.5, weightOz: 14.5, msrp: 229 },
    'LMSS2 10x42':                   { opticType: 'Rangefinder', weightOz: 25.6, msrp: 599 },
  },
  Zeiss: {
    'LRP S5 3.6-18x50': { opticType: 'Scope', magnificationMin: 3.6, magnificationMax: 18, objectiveMM: 50, focalPlane: 'FFP', turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 31.7, msrp: 3299 },
    'Conquest V4 3-12x56': { opticType: 'Scope', magnificationMin: 3, magnificationMax: 12, objectiveMM: 56, focalPlane: 'SFP', turretUnit: 'MOA', clickValueMOA: 0.25, weightOz: 28.9, msrp: 1399 },
    'Victory V8 1.1-8x30': { opticType: 'LPVO', magnificationMin: 1.1, magnificationMax: 8, objectiveMM: 30, focalPlane: 'FFP', illuminated: true, turretUnit: 'MOA', weightOz: 23.3, msrp: 3999 },
  },
  'Schmidt & Bender': {
    'PM II 3-12x50':  { opticType: 'Scope', magnificationMin: 3,  magnificationMax: 12, objectiveMM: 50, focalPlane: 'FFP', turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 30.7, msrp: 3799 },
    'PM II 5-25x56':  { opticType: 'Scope', magnificationMin: 5,  magnificationMax: 25, objectiveMM: 56, focalPlane: 'FFP', turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 44.0, msrp: 4499 },
    'Short Dot 1-4x24': { opticType: 'LPVO', magnificationMin: 1, magnificationMax: 4,  objectiveMM: 24, focalPlane: 'FFP', illuminated: true, turretUnit: 'MRAD', clickValueMRAD: 0.1, weightOz: 23.0, msrp: 2799 },
  },
  Swarovski: {
    'Z8i 1-8x24':  { opticType: 'LPVO',  magnificationMin: 1, magnificationMax: 8,  objectiveMM: 24, focalPlane: 'FFP', illuminated: true, turretUnit: 'MOA', clickValueMOA: 0.25, weightOz: 22.4, msrp: 3699 },
    'Z6i 1-6x24':  { opticType: 'LPVO',  magnificationMin: 1, magnificationMax: 6,  objectiveMM: 24, focalPlane: 'SFP', illuminated: true, turretUnit: 'MOA', clickValueMOA: 0.25, weightOz: 20.5, msrp: 2799 },
    'Z5 3.5-18x44':{ opticType: 'Scope', magnificationMin: 3.5, magnificationMax: 18, objectiveMM: 44, focalPlane: 'SFP', illuminated: false, turretUnit: 'MOA', clickValueMOA: 0.25, weightOz: 20.1, msrp: 1999 },
  },
};

const KNOWN_BRANDS = Object.keys(KNOWN_OPTICS).sort();

// ── Known retailers ───────────────────────────────────────────────────────────
const KNOWN_RETAILERS = [
  // Online specialists
  'Brownells', 'MidwayUSA', 'Optics Planet', 'Euro Optic', 'SWFA Outdoors',
  'Rainier Arms', 'Palmetto State Armory', 'Primary Arms', 'Guns.com',
  "Bud's Gun Shop", 'GrabAGun', 'Silencer Shop', 'KyGunCo',
  // Big box / sporting
  "Cabela's", 'Bass Pro Shops', "Sportsman's Warehouse", 'Academy Sports',
  "Dick's Sporting Goods", 'Rural King', 'Scheels', 'Walmart',
  // Manufacturer direct
  'Manufacturer Direct',
  // Other
  'Gun Show', 'Private Sale', 'Pawn Shop', 'Local Gun Shop',
];

// ── Autocomplete input ────────────────────────────────────────────────────────
function AutocompleteInput({
  value, onChange, placeholder, options, onSelect, style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: string[];
  onSelect?: (v: string) => void;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = value
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : options.slice(0, 8);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={style}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 200,
          backgroundColor: '#1a1a1a', border: '0.5px solid ' + theme.border,
          borderRadius: '6px', overflow: 'hidden', maxHeight: '180px', overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {filtered.map(opt => (
            <div
              key={opt}
              onMouseDown={e => { e.preventDefault(); onChange(opt); (onSelect || onChange)(opt); setOpen(false); }}
              style={{
                padding: '8px 12px', fontFamily: 'monospace', fontSize: '11px',
                color: opt.toLowerCase() === value.toLowerCase() ? theme.accent : theme.textSecondary,
                cursor: 'pointer', borderBottom: '0.5px solid rgba(255,255,255,0.04)',
                backgroundColor: opt.toLowerCase() === value.toLowerCase() ? 'rgba(255,212,59,0.08)' : 'transparent',
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OpticsList({ onSelectOptic }: OpticsListProps) {
  const [optics, setOptics]       = useState<Optic[]>([]);
  const [assignments, setAssignments] = useState<OpticAssignment[]>([]);
  const [guns, setGuns]           = useState<ReturnType<typeof getAllGuns>>([]);
  const [filter, setFilter]       = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  function reload() {
    setOptics(getAllOptics());
    setAssignments(getAllAssignments());
    setGuns(getAllGuns());
  }

  useEffect(() => { reload(); }, []);

  const gunMap = new Map(guns.map(g => [g.id, g]));

  const filtered = optics.filter(o => {
    if (filter === 'assigned') return assignments.some(a => a.opticId === o.id && !a.removedDate);
    if (filter === 'unassigned') return !assignments.some(a => a.opticId === o.id && !a.removedDate);
    return true;
  });

  const totalValue = optics.reduce((s, o) => s + (o.purchasePrice || 0), 0);
  const assignedCount = optics.filter(o => assignments.some(a => a.opticId === o.id && !a.removedDate)).length;

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100%', paddingBottom: '32px' }}>

      {/* Top stats */}
      <div style={{ display: 'flex', gap: '8px', padding: '14px 16px 0' }}>
        {[
          { label: 'Optics', value: optics.length },
          { label: 'Mounted', value: assignedCount },
          { label: 'Value', value: totalValue > 0 ? '$' + totalValue.toLocaleString() : '—' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`,
            borderRadius: '6px', padding: '10px 12px',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '3px' }}>{s.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.accent, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0', margin: '14px 16px 0', border: `0.5px solid ${theme.border}`, borderRadius: '6px', overflow: 'hidden' }}>
        {(['all', 'assigned', 'unassigned'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1, padding: '8px',
              backgroundColor: filter === f ? theme.accent : 'transparent',
              border: 'none',
              color: filter === f ? theme.bg : theme.textSecondary,
              fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.5px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            {f === 'all' ? 'ALL' : f === 'assigned' ? 'MOUNTED' : 'UNMOUNTED'}
          </button>
        ))}
      </div>

      {/* Optics list */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`,
            borderRadius: '8px',
          }}>
            <div style={{ marginBottom: '12px', opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="9" width="16" height="7" rx="3.5" stroke={theme.textSecondary} strokeWidth="1.5"/>
                <ellipse cx="18" cy="12.5" rx="2" ry="4" stroke={theme.textSecondary} strokeWidth="1.2"/>
                <circle cx="22" cy="12.5" r="1.5" stroke={theme.textSecondary} strokeWidth="1"/>
                <line x1="6" y1="12.5" x2="14" y2="12.5" stroke={theme.textSecondary} strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
                <circle cx="10" cy="12.5" r="2" stroke={theme.textSecondary} strokeWidth="1.2"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textSecondary, marginBottom: '6px' }}>
              {optics.length === 0 ? 'NO OPTICS YET' : 'NO RESULTS'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '20px' }}>
              {optics.length === 0 ? 'Track your glass collection. Log zeros, swaps, and torque specs.' : 'Adjust the filter above.'}
            </div>
            {optics.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '10px 20px', backgroundColor: theme.accent,
                  border: 'none', borderRadius: '6px', color: theme.bg,
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                ADD FIRST OPTIC
              </button>
            )}
          </div>
        ) : (
          filtered.map(optic => {
            const active = assignments.find(a => a.opticId === optic.id && !a.removedDate);
            const gun = active ? gunMap.get(active.gunId) : undefined;
            const mount = active?.mountId ? getMountsForOptic(optic.id).find(m => m.id === active.mountId) : undefined;
            const mag = optic.magnificationMax
              ? optic.magnificationMin === optic.magnificationMax
                ? `${optic.magnificationMax}x`
                : `${optic.magnificationMin ?? 1}-${optic.magnificationMax}x`
              : undefined;

            return (
              <button
                key={optic.id}
                onClick={() => onSelectOptic(optic)}
                style={{
                  backgroundColor: theme.surface,
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary }}>
                      {optic.brand} {optic.model}
                    </div>
                    {mag && (
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>
                        {mag}{optic.objectiveMM ? `×${optic.objectiveMM}` : ''}
                        {optic.focalPlane && optic.focalPlane !== 'N/A' ? ` · ${optic.focalPlane}` : ''}
                      </div>
                    )}
                  </div>
                  <div style={{
                    backgroundColor: OPTIC_TYPE_COLORS[optic.opticType] + '22',
                    border: `0.5px solid ${OPTIC_TYPE_COLORS[optic.opticType]}`,
                    borderRadius: '3px', padding: '2px 7px',
                    fontFamily: 'monospace', fontSize: '8px', fontWeight: 700,
                    color: OPTIC_TYPE_COLORS[optic.opticType], letterSpacing: '0.5px',
                    flexShrink: 0,
                  }}>
                    {optic.opticType.toUpperCase()}
                  </div>
                </div>

                {/* Mounted on */}
                {gun ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.green, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary }}>
                      {gun.make} {gun.model}
                    </span>
                    {mount && (
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
                        · {mount.brand} {mount.model}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.border, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>Unmounted</span>
                  </div>
                )}

                {/* Bottom row */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  {optic.turretUnit && (
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
                      {optic.turretUnit}
                    </span>
                  )}
                  {optic.reticleName && (
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
                      {optic.reticleName}
                    </span>
                  )}
                  {optic.status !== 'Active' && (
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#ff9999' }}>
                      {optic.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddForm(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
          right: '20px',
          zIndex: 1000,
          width: '52px', height: '52px',
          borderRadius: '50%',
          backgroundColor: theme.accent,
          border: 'none', color: theme.bg, fontSize: '26px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(255,212,59,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          outline: 'none', WebkitTapHighlightColor: 'transparent',
        }}
      >
        +
      </button>

      {showAddForm && (
        <AddOpticForm
          onSave={(data) => {
            addOptic({ ...data, status: data.status || 'Active' } as Omit<Optic, 'id' | 'createdAt' | 'updatedAt'>);
            reload();
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

// ─── Add Optic Form ──────────────────────────────────────────────────────────

function AddOpticForm({
  onSave,
  onCancel,
  initial,
}: {
  onSave: (data: Partial<Optic>) => void;
  onCancel: () => void;
  initial?: Partial<Optic>;
}) {
  const [brand, setBrand]             = useState(initial?.brand || '');
  const [model, setModel]             = useState(initial?.model || '');
  const [serial, setSerial]           = useState(initial?.serialNumber || '');
  const [opticType, setOpticType]     = useState<typeof OPTIC_TYPES[number]>(initial?.opticType || 'Red Dot');
  const [magMin, setMagMin]           = useState(initial?.magnificationMin?.toString() || '');
  const [magMax, setMagMax]           = useState(initial?.magnificationMax?.toString() || '');
  const [objective, setObjective]     = useState(initial?.objectiveMM?.toString() || '');
  const [focalPlane, setFocalPlane]   = useState<typeof FOCAL_PLANES[number]>(initial?.focalPlane || 'N/A');
  const [reticle, setReticle]         = useState(initial?.reticleName || '');
  const [illuminated, setIlluminated] = useState(initial?.illuminated ?? false);
  const [turretUnit, setTurretUnit]   = useState<typeof TURRET_UNITS[number]>(initial?.turretUnit || 'MOA');
  const [clickVal, setClickVal]       = useState(initial?.clickValueMOA?.toString() || '');
  const [batteryType, setBatteryType] = useState(initial?.batteryType || '');
  const [weightOz, setWeightOz]       = useState(initial?.weightOz?.toString() || '');
  const [price, setPrice]             = useState(initial?.purchasePrice?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate || '');
  const [purchasedFrom, setPurchasedFrom] = useState(initial?.purchasedFrom || '');
  const [notes, setNotes]             = useState(initial?.notes || '');
  const [prefillBanner, setPrefillBanner] = useState('');
  // Supabase-backed brand/model lists merged with KNOWN_OPTICS
  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const [dbModels, setDbModels] = useState<string[]>([]);

  useEffect(() => {
    getOpticBrands().then(brands => {
      setDbBrands(brands);
    });
  }, []);

  useEffect(() => {
    if (!brand.trim()) { setDbModels([]); return; }
    getOpticModelsForBrand(brand).then(setDbModels);
  }, [brand]);

  // When a known brand+model is selected, pre-fill all known specs.
  // Tries KNOWN_OPTICS first (instant), then falls back to Supabase optic_models.
  async function applyKnownSpec(b: string, m: string) {
    const local = KNOWN_OPTICS[b]?.[m];
    if (local) {
      applySpec(local, b, m);
    } else {
      const remote = await getOpticSpec(b, m);
      if (remote) {
        applySpec({
          opticType: remote.optic_type as typeof OPTIC_TYPES[number],
          magnificationMin: remote.magnification_min ?? undefined,
          magnificationMax: remote.magnification_max ?? undefined,
          objectiveMM: remote.objective_mm ?? undefined,
          focalPlane: (remote.focal_plane as typeof FOCAL_PLANES[number]) ?? undefined,
          reticleName: remote.reticle_name ?? undefined,
          illuminated: remote.illuminated,
          turretUnit: (remote.turret_unit as typeof TURRET_UNITS[number]) ?? undefined,
          clickValueMOA: remote.click_value_moa ?? undefined,
          clickValueMRAD: remote.click_value_mrad ?? undefined,
          batteryType: remote.battery_type ?? undefined,
          weightOz: remote.weight_oz ?? undefined,
          msrp: remote.msrp_usd ?? undefined,
        }, b, m);
      }
    }
  }

  function applySpec(spec: KnownSpec, b: string, m: string) {
    setOpticType(spec.opticType);
    setMagMin(spec.magnificationMin?.toString() || '');
    setMagMax(spec.magnificationMax?.toString() || '');
    setObjective(spec.objectiveMM?.toString() || '');
    setFocalPlane(spec.focalPlane || 'N/A');
    setReticle(spec.reticleName || '');
    setIlluminated(spec.illuminated ?? false);
    setTurretUnit(spec.turretUnit || 'MOA');
    if (spec.turretUnit === 'MRAD') setClickVal(spec.clickValueMRAD?.toString() || '');
    else setClickVal(spec.clickValueMOA?.toString() || '');
    setBatteryType(spec.batteryType || '');
    setWeightOz(spec.weightOz?.toString() || '');
    if (spec.msrp && !price) setPrice(spec.msrp.toString());
    setPrefillBanner(`Specs pre-filled from ${b} ${m}`);
    setTimeout(() => setPrefillBanner(''), 3000);
  }

  // All brands: merge local KNOWN_OPTICS + Supabase, sorted, deduped
  const allBrands = [...new Set([...KNOWN_BRANDS, ...dbBrands])].sort();

  // Models for the current brand: merge local + Supabase
  const knownModelsForBrand = (() => {
    const exact = Object.keys(KNOWN_OPTICS).find(b => b.toLowerCase() === brand.toLowerCase());
    const localModels = exact ? Object.keys(KNOWN_OPTICS[exact]) : [];
    return [...new Set([...localModels, ...dbModels])].sort();
  })();

  const hasMag = ['LPVO', 'Scope', 'Prism', 'Magnifier'].includes(opticType);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '6px',
    color: theme.textPrimary,
    fontFamily: 'monospace', fontSize: '12px',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px',
    color: theme.textMuted, textTransform: 'uppercase', marginBottom: '5px',
  };

  function handleSave() {
    if (!brand.trim() || !model.trim()) return;
    const cv = parseFloat(clickVal);
    onSave({
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serial.trim() || undefined,
      opticType,
      magnificationMin: magMin ? parseFloat(magMin) : undefined,
      magnificationMax: magMax ? parseFloat(magMax) : undefined,
      objectiveMM: objective ? parseFloat(objective) : undefined,
      focalPlane: hasMag ? focalPlane : 'N/A',
      reticleName: reticle.trim() || undefined,
      illuminated,
      turretUnit,
      clickValueMOA: turretUnit === 'MOA' && !isNaN(cv) ? cv : undefined,
      clickValueMRAD: turretUnit === 'MRAD' && !isNaN(cv) ? cv : undefined,
      batteryType: batteryType.trim() || undefined,
      weightOz: weightOz ? parseFloat(weightOz) : undefined,
      purchasePrice: price ? parseFloat(price) : undefined,
      purchaseDate: purchaseDate || undefined,
      purchasedFrom: purchasedFrom.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'Active',
    });
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        margin: '20px auto', maxWidth: '480px', width: '100%',
        backgroundColor: theme.surface, borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: theme.textPrimary }}>
            ADD OPTIC
          </span>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '18px', cursor: 'pointer', padding: '4px' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Type */}
          <div>
            <div style={labelStyle}>Optic Type *</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {OPTIC_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setOpticType(t)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: opticType === t ? theme.accent : 'transparent',
                    border: `0.5px solid ${opticType === t ? theme.accent : theme.border}`,
                    borderRadius: '4px',
                    color: opticType === t ? theme.bg : theme.textSecondary,
                    fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Brand + Model */}
          {prefillBanner && (
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.green, letterSpacing: '0.5px', padding: '6px 10px', backgroundColor: 'rgba(81,207,102,0.08)', borderRadius: '4px', border: '0.5px solid rgba(81,207,102,0.2)' }}>
              ✓ {prefillBanner}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>Brand *</div>
              <AutocompleteInput
                value={brand}
                onChange={v => { setBrand(v); setModel(''); setPrefillBanner(''); }}
                onSelect={v => { setBrand(v); setModel(''); setPrefillBanner(''); }}
                placeholder="Trijicon, Vortex…"
                options={allBrands}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>Model *</div>
              <AutocompleteInput
                value={model}
                onChange={v => setModel(v)}
                onSelect={v => {
                  setModel(v);
                  const exactBrand = Object.keys(KNOWN_OPTICS).find(b => b.toLowerCase() === brand.toLowerCase()) || brand;
                  applyKnownSpec(exactBrand, v);
                }}
                placeholder={knownModelsForBrand.length ? 'Select or type…' : 'MRO, Strike Eagle…'}
                options={knownModelsForBrand}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Serial */}
          <div>
            <div style={labelStyle}>Serial Number</div>
            <input style={inputStyle} value={serial} onChange={e => setSerial(e.target.value)} placeholder="Optional — stored locally" />
          </div>

          {/* Magnification — only for scopes */}
          {hasMag && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <div style={labelStyle}>Mag Min</div>
                <input type="number" style={inputStyle} value={magMin} onChange={e => setMagMin(e.target.value)} placeholder="1" />
              </div>
              <div>
                <div style={labelStyle}>Mag Max</div>
                <input type="number" style={inputStyle} value={magMax} onChange={e => setMagMax(e.target.value)} placeholder="6" />
              </div>
              <div>
                <div style={labelStyle}>Objective (mm)</div>
                <input type="number" style={inputStyle} value={objective} onChange={e => setObjective(e.target.value)} placeholder="24" />
              </div>
            </div>
          )}

          {/* Focal plane */}
          {hasMag && (
            <div>
              <div style={labelStyle}>Focal Plane</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {FOCAL_PLANES.map(fp => (
                  <button
                    key={fp}
                    onClick={() => setFocalPlane(fp)}
                    style={{
                      flex: 1, padding: '8px',
                      backgroundColor: focalPlane === fp ? theme.accent : 'transparent',
                      border: `0.5px solid ${focalPlane === fp ? theme.accent : theme.border}`,
                      borderRadius: '4px',
                      color: focalPlane === fp ? theme.bg : theme.textSecondary,
                      fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {fp}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reticle + Illuminated */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <div style={labelStyle}>Reticle Name</div>
              <input style={inputStyle} value={reticle} onChange={e => setReticle(e.target.value)} placeholder="ACSS, BDC, MOA Grid..." />
            </div>
            <div style={{ paddingBottom: '1px' }}>
              <div style={labelStyle}>Illuminated</div>
              <button
                onClick={() => setIlluminated(v => !v)}
                style={{
                  padding: '10px 14px',
                  backgroundColor: illuminated ? theme.accent : 'transparent',
                  border: `0.5px solid ${illuminated ? theme.accent : theme.border}`,
                  borderRadius: '6px',
                  color: illuminated ? theme.bg : theme.textSecondary,
                  fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {illuminated ? 'YES' : 'NO'}
              </button>
            </div>
          </div>

          {/* Turret unit + click value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>Turret Unit</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {TURRET_UNITS.map(u => (
                  <button
                    key={u}
                    onClick={() => setTurretUnit(u)}
                    style={{
                      flex: 1, padding: '10px',
                      backgroundColor: turretUnit === u ? theme.accent : 'transparent',
                      border: `0.5px solid ${turretUnit === u ? theme.accent : theme.border}`,
                      borderRadius: '4px',
                      color: turretUnit === u ? theme.bg : theme.textSecondary,
                      fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Click Value ({turretUnit})</div>
              <input type="number" step="0.01" style={inputStyle} value={clickVal} onChange={e => setClickVal(e.target.value)} placeholder={turretUnit === 'MOA' ? '0.25' : '0.1'} />
            </div>
          </div>

          {/* Battery + weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>Battery Type</div>
              <input style={inputStyle} value={batteryType} onChange={e => setBatteryType(e.target.value)} placeholder="CR2032" />
            </div>
            <div>
              <div style={labelStyle}>Weight (oz)</div>
              <input type="number" step="0.1" style={inputStyle} value={weightOz} onChange={e => setWeightOz(e.target.value)} placeholder="3.5" />
            </div>
          </div>

          {/* Purchase info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>Purchase Price ($)</div>
              <input type="number" style={inputStyle} value={price} onChange={e => setPrice(e.target.value)} placeholder="599" />
            </div>
            <div>
              <div style={labelStyle}>Purchase Date</div>
              <input type="date" style={inputStyle} value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
            </div>
          </div>
          <div>
            <div style={labelStyle}>Purchased From</div>
            <AutocompleteInput
              value={purchasedFrom}
              onChange={setPurchasedFrom}
              placeholder="Brownells, Optics Planet…"
              options={KNOWN_RETAILERS}
              style={inputStyle}
            />
          </div>

          {/* Notes */}
          <div>
            <div style={labelStyle}>Notes</div>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes..."
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button onClick={onCancel} style={{
              flex: 1, padding: '12px', backgroundColor: 'transparent',
              border: `0.5px solid ${theme.border}`, borderRadius: '6px',
              color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer',
            }}>
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={!brand.trim() || !model.trim()}
              style={{
                flex: 2, padding: '12px',
                backgroundColor: !brand.trim() || !model.trim() ? theme.border : theme.accent,
                border: 'none', borderRadius: '6px',
                color: !brand.trim() || !model.trim() ? theme.textMuted : theme.bg,
                fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              SAVE OPTIC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
