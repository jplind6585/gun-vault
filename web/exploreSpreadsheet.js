import XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('/Users/banner-james/Downloads/Gun Library (3.29.26)');

console.log('\n📊 Spreadsheet Tabs:');
console.log(workbook.SheetNames.join(', '));

// Let's look at each sheet's structure
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n\n=== ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Rows: ${data.length}`);

  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]).join(', '));
    console.log('\nFirst row sample:');
    console.log(JSON.stringify(data[0], null, 2));
  }
});
