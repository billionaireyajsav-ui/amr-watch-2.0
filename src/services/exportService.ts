import type { Hospital, Patient } from '@/types';

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell);
          return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(',')
    )
    .join('\n');
}

export function exportHospitalsCSV(hospitals: Hospital[]) {
  const rows = [
    ['Hospital ID', 'Name', 'District', 'AMR Score', 'Risk Level', 'Patients', 'Broad %', 'Narrow %', 'Lab Confirmation %'],
    ...hospitals.map((h) => [h.hospitalId, h.name, h.district, h.amrScore, h.riskLevel, h.patients, h.broadSpectrumPct, h.narrowSpectrumPct, h.labConfirmationRate]),
  ];
  downloadBlob(toCSV(rows), 'amr_hospitals_report.csv', 'text/csv');
}

export function exportPatientsCSV(patients: Patient[]) {
  const rows = [
    ['Patient Number', 'Name', 'Age', 'Gender', 'Hospital', 'Initial Antibiotic', 'Final Antibiotic', 'Treatment Changed', 'Recovery Status', 'Date'],
    ...patients.map((p) => [p.patientNumber, p.name, p.age, p.gender, p.hospitalName, p.initialAntibiotic, p.finalAntibiotic, p.treatmentChanged ? 'Yes' : 'No', p.recoveryStatus, p.date]),
  ];
  downloadBlob(toCSV(rows), 'amr_patients_report.csv', 'text/csv');
}

// Minimal SpreadsheetML (.xls) so it opens natively in Excel without extra deps.
function toExcelXML(title: string, headers: string[], rows: (string | number)[][]): string {
  const cellsFor = (arr: (string | number)[]) =>
    arr
      .map((v) => {
        const isNum = typeof v === 'number';
        return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`;
      })
      .join('');
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${title}">
<Table>
<Row>${cellsFor(headers)}</Row>
${rows.map((r) => `<Row>${cellsFor(r)}</Row>`).join('\n')}
</Table>
</Worksheet>
</Workbook>`;
}

export function exportHospitalsExcel(hospitals: Hospital[]) {
  const headers = ['Hospital ID', 'Name', 'District', 'AMR Score', 'Risk Level', 'Patients', 'Broad %', 'Narrow %', 'Lab Confirmation %'];
  const rows = hospitals.map((h) => [h.hospitalId, h.name, h.district, h.amrScore, h.riskLevel, h.patients, h.broadSpectrumPct, h.narrowSpectrumPct, h.labConfirmationRate]);
  downloadBlob(toExcelXML('Hospitals', headers, rows), 'amr_hospitals_report.xls', 'application/vnd.ms-excel');
}

export function exportPatientsExcel(patients: Patient[]) {
  const headers = ['Patient Number', 'Name', 'Age', 'Gender', 'Hospital', 'Initial Antibiotic', 'Final Antibiotic', 'Treatment Changed', 'Recovery Status', 'Date'];
  const rows = patients.map((p) => [p.patientNumber, p.name, p.age, p.gender, p.hospitalName, p.initialAntibiotic, p.finalAntibiotic, p.treatmentChanged ? 'Yes' : 'No', p.recoveryStatus, p.date]);
  downloadBlob(toExcelXML('Patients', headers, rows), 'amr_patients_report.xls', 'application/vnd.ms-excel');
}
