import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Patient, Hospital } from '@/types';

const TEAL: [number, number, number] = [42, 217, 194];
const INK: [number, number, number] = [15, 24, 48];
const MUTED: [number, number, number] = [110, 120, 145];

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...INK);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(...TEAL);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AMR Surveillance Network', 14, 12);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 20);
  doc.setFontSize(8);
  doc.setTextColor(200, 205, 215);
  doc.text(subtitle, 14, 25);
  doc.setTextColor(0, 0, 0);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Generated ${new Date().toLocaleString('en-IN')} · Confidential — for authorized public health use only`,
      14,
      290
    );
    doc.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' });
  }
}

export function generatePatientReportPDF(patient: Patient, hospital: Hospital | undefined) {
  const doc = new jsPDF();
  addHeader(doc, 'Patient Clinical & AMR Report', `${patient.patientNumber} · ${patient.name}`);

  autoTable(doc, {
    startY: 34,
    head: [['Patient Information', '']],
    body: [
      ['Name', patient.name],
      ['Patient Number', patient.patientNumber],
      ['Age / Gender', `${patient.age} / ${patient.gender}`],
      ['Admission Date', patient.date],
      ['Recovery Status', patient.recoveryStatus],
    ],
    theme: 'grid',
    headStyles: { fillColor: TEAL, textColor: INK },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [['Hospital Information', '']],
    body: [
      ['Hospital', patient.hospitalName],
      ['District', patient.district],
      ['Hospital AMR Score', hospital ? `${hospital.amrScore}/100 (${hospital.riskLevel} risk)` : 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: TEAL, textColor: INK },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [['Clinical Timeline', '']],
    body: [
      ['Symptoms', patient.symptoms.join(', ')],
      ['Initial Antibiotic', `${patient.initialAntibiotic} (${patient.initialAntibioticType})`],
      ['Lab-identified Bacteria', patient.labIdentifiedBacteria ?? 'Not confirmed'],
      ['Final Antibiotic', `${patient.finalAntibiotic} (${patient.finalAntibioticType})`],
      ['Treatment Changed', patient.treatmentChanged ? 'Yes — escalated/de-escalated after lab results' : 'No'],
    ],
    theme: 'grid',
    headStyles: { fillColor: TEAL, textColor: INK },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [['Doctor Notes', '']],
    body: [[patient.doctorNotes, '']],
    theme: 'grid',
    headStyles: { fillColor: TEAL, textColor: INK },
    styles: { fontSize: 9 },
    columnStyles: { 1: { cellWidth: 0 } },
  });

  addFooter(doc);
  doc.save(`${patient.patientNumber}_report.pdf`);
}

export function generateHospitalReportPDF(hospital: Hospital, aiText?: string) {
  const doc = new jsPDF();
  addHeader(doc, 'Hospital AMR Performance Report', `${hospital.name} · ${hospital.hospitalId}`);

  autoTable(doc, {
    startY: 34,
    head: [['Overview', '']],
    body: [
      ['District', hospital.district],
      ['Type', hospital.type],
      ['Bed Count', String(hospital.bedCount)],
      ['Patients Tracked', String(hospital.patients)],
      ['AMR Score', `${hospital.amrScore}/100 (${hospital.riskLevel} risk)`],
      ['Broad / Narrow Spectrum Use', `${hospital.broadSpectrumPct}% / ${hospital.narrowSpectrumPct}%`],
      ['Lab Confirmation Rate', `${hospital.labConfirmationRate}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: TEAL, textColor: INK },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [['Month', 'AMR Score', 'Broad %', 'Narrow %']],
    body: hospital.monthlyTrend.map((m) => [m.month, String(m.amrScore), `${m.broad}%`, `${m.narrow}%`]),
    theme: 'striped',
    headStyles: { fillColor: TEAL, textColor: INK },
    styles: { fontSize: 9 },
  });

  if (aiText) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [['AI-Generated Recommendation (based on this hospital\'s data)']],
      body: [[aiText]],
      theme: 'grid',
      headStyles: { fillColor: TEAL, textColor: INK },
      styles: { fontSize: 9 },
    });
  }

  addFooter(doc);
  doc.save(`${hospital.hospitalId}_report.pdf`);
}
