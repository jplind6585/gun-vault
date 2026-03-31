import fs from 'fs';

const data = JSON.parse(fs.readFileSync('guns_data.json', 'utf-8'));
const realGuns = data.filter(g => g.Manufacturer && g.Model && g.Caliber);

function inferAction(type, model, caliber) {
  const modelLower = String(model).toLowerCase();
  const caliberLower = String(caliber).toLowerCase();

  if (type === 'Shotgun') {
    if (modelLower.includes('pump') || modelLower.includes('870') || modelLower.includes('500')) return 'Pump';
    if (modelLower.includes('o/u') || modelLower.includes('over under')) return 'Break';
    return 'Semi-Auto';
  }

  if (type === 'Pistol') {
    if (modelLower.includes('revolver') || caliberLower.includes('.357') || caliberLower.includes('.44') || caliberLower.includes('.38')) {
      return 'Revolver';
    }
    return 'Semi-Auto';
  }

  if (modelLower.includes('bolt') || modelLower.includes('enfield') || modelLower.includes('mosin') || modelLower.includes('howa') || modelLower.includes('savage')) return 'Bolt';
  if (modelLower.includes('lever')) return 'Lever';
  if (modelLower.includes('pump')) return 'Pump';
  if (modelLower.includes('ar-') || modelLower.includes('ak') || modelLower.includes('m1a') || modelLower.includes('pioneer')) return 'Semi-Auto';

  if (type === 'Rifle') return 'Bolt';
  return 'Semi-Auto';
}

const converted = realGuns.map(g => {
  const notes = [];
  if (g['Optic Type']) notes.push(`Optic: ${g['Optic Type']}`);
  if (g['Optic Model'] && g['Optic Model'] !== '-' && g['Optic Model'] !== 'TBD') notes.push(`Model: ${g['Optic Model']}`);
  if (g['Other Attachments'] && g['Other Attachments'] !== 'Nothing' && g['Other Attachments'] !== '-') notes.push(`Attachments: ${g['Other Attachments']}`);
  if (g['Notes']) notes.push(g['Notes']);

  return {
    make: String(g.Manufacturer),
    model: String(g.Model),
    caliber: String(g.Caliber),
    action: inferAction(g.Type, g.Model, g.Caliber),
    type: g.Type,
    serialNumber: g.Serial ? String(g.Serial) : undefined,
    status: 'Active',
    notes: notes.join('. ')
  };
});

const output = `// Generated from Gun Library spreadsheet (${converted.length} guns)
import type { Gun } from './types';

export const seedGuns: Omit<Gun, 'id' | 'createdAt' | 'updatedAt' | 'roundCount'>[] = ${JSON.stringify(converted, null, 2)};
`;

fs.writeFileSync('src/seedData.ts', output);
console.log(`✅ Generated ${converted.length} guns to src/seedData.ts`);
