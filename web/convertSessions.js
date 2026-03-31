import XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('/Users/banner-james/Downloads/Gun Library (3.29.26)');
const shootingSheet = workbook.Sheets['Shooting'];
const shootingData = XLSX.utils.sheet_to_json(shootingSheet);

console.log(`Found ${shootingData.length} shooting sessions in spreadsheet`);

// Excel dates are numbers - need to convert
function excelDateToISO(serial) {
  if (!serial || typeof serial !== 'number') return new Date().toISOString().split('T')[0];
  const utcDays = serial - 25569;
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  return dateInfo.toISOString().split('T')[0];
}

const converted = shootingData
  .filter(s => s.Gun && s['# of shots'])
  .map(s => ({
    gunName: String(s.Gun),
    date: excelDateToISO(s.Date),
    location: s.Location || undefined,
    indoorOutdoor: s['Inside/Outside'] === 'Inside' ? 'Indoor' : 'Outdoor',
    roundsExpended: parseInt(s['# of shots']) || 0,
    issues: s['Issues?'] === 'Yes',
    issueDescription: s['Issues?'] === 'Yes' ? s.Notes : undefined,
    notes: s['Issues?'] !== 'Yes' ? s.Notes : undefined,
  }));

const output = `// Generated from Gun Library spreadsheet Shooting tab (${converted.length} sessions)
// NOTE: These need to be matched to gun IDs after guns are loaded
import type { Session } from './types';

export const seedSessions: Omit<Session, 'id' | 'gunId' | 'createdAt'>[] = ${JSON.stringify(converted, null, 2)};

// Gun name mapping - used to match sessions to guns by name
export const sessionGunNames: string[] = ${JSON.stringify(converted.map(s => s.gunName), null, 2)};
`;

fs.writeFileSync('src/seedSessions.ts', output);
console.log(`✅ Generated ${converted.length} sessions to src/seedSessions.ts`);
