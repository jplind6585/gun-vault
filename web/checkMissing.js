import XLSX from 'xlsx';

const workbook = XLSX.readFile('/Users/banner-james/Downloads/ammo_inventory_v2.xlsx');
const sheet = workbook.Sheets['Full Inventory'];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Rows with missing or invalid grain data:\n');
data.forEach((row, i) => {
  const grain = parseInt(row.Grain);
  if (!row.Grain || isNaN(grain) || grain <= 0) {
    console.log(`Row ${i+1}: ${row.Caliber} | ${row.Brand} | Grain=[${row.Grain}] | ${row.Rounds} rounds`);
  }
});
