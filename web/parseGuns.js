import XLSX from 'xlsx';
import fs from 'fs';

// Read the Excel file
const workbook = XLSX.readFile('/Users/banner-james/Downloads/Gun Library (3.29.26)');
const sheetName = 'Gun Library';
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('First 3 guns:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));
console.log(`\nTotal guns found: ${data.length}`);
console.log('\nColumn headers:', Object.keys(data[0] || {}));

// Save all data to file for inspection
fs.writeFileSync('guns_data.json', JSON.stringify(data, null, 2));
console.log('\nFull data saved to guns_data.json');
