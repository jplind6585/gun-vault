import XLSX from 'xlsx';

const workbook = XLSX.readFile('/Users/banner-james/Downloads/ammo_inventory_v2.xlsx');

console.log('Spreadsheet tabs:', workbook.SheetNames.join(', '));

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n\n=== ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Rows: ${data.length}`);
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]).join(', '));
    console.log('\nFirst 3 rows:');
    console.log(JSON.stringify(data.slice(0, 3), null, 2));
  }
});
