import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Download } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { getCompletedCycleLengths, median, standardDeviation, predictPeriodLength } from '@/lib/prediction';
import { scorePbacForCycle, PBAC_HEAVY_THRESHOLD } from '@/lib/pbac';
import { figoContext, checkRedFlags } from '@/lib/redFlags';
import { psstResultWording } from '@/lib/psst';
import { format, parseISO, differenceInCalendarDays, subMonths } from 'date-fns';
import jsPDF from 'jspdf';

export default function Report() {
  const navigate = useNavigate();
  const store = useStore();
  const { showToast } = useToast();
  const { user, cycles, logs, products, psstResults, dailyRatings, currentStage } = store;
  const [range, setRange] = useState<'last-cycle' | 'last-3' | 'last-6' | 'lifetime'>('last-3');
  const [clinicianNotes, setClinicianNotes] = useState('');

  if (!user) return null;

  const completedLengths = getCompletedCycleLengths(cycles);
  const periodLen = predictPeriodLength(cycles, logs);
  const figo = figoContext(completedLengths, user.ageBand);
  const redFlags = checkRedFlags(cycles, logs, currentStage, { ageBand: user.ageBand, healthNote: user.healthNote }, products, psstResults);

  // PBAC totals per cycle
  const pbacPerCycle = cycles.slice(0, -1).map((cycle, i) => {
    const nextStart = cycles[i + 1]?.startDate;
    return {
      cycleNum: i + 1,
      total: scorePbacForCycle(logs, cycle.startDate, cycle.endDate ?? nextStart, products),
    };
  }).filter((p) => p.total > 0);

  // Remedy stats
  const remedyStats = new Map<string, { tried: number; helped: number }>();
  for (const log of logs) {
    for (const remedy of log.remedies) {
      const stats = remedyStats.get(remedy.name) ?? { tried: 0, helped: 0 };
      stats.tried++;
      if (remedy.helped === 'a-lot' || remedy.helped === 'a-bit') stats.helped++;
      remedyStats.set(remedy.name, stats);
    }
  }
  const topRemedies = Array.from(remedyStats.entries())
    .sort((a, b) => b[1].helped / b[1].tried - a[1].helped / a[1].tried)
    .slice(0, 3);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const left = 20;
    let y = 20;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cyclewise Clinician Report', left, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Age band: ${user.ageBand}  |  Mode: ${currentStage}  |  Date range: ${range}`, left, y);
    y += 6;
    doc.text(`Cycles logged: ${cycles.length}  |  Generated: ${format(new Date(), 'd MMM yyyy')}`, left, y);
    y += 10;

    // What changed
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('What changed', left, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (completedLengths.length >= 2) {
      doc.text(`- Cycle length median: ${median(completedLengths.slice(-6))} days (variation ±${Math.round(standardDeviation(completedLengths.slice(-6)))} days)`, left, y);
      y += 5;
    }
    if (pbacPerCycle.length > 0) {
      const latest = pbacPerCycle[pbacPerCycle.length - 1];
      doc.text(`- Latest PBAC score: ${latest.total} ${latest.total >= PBAC_HEAVY_THRESHOLD ? '(heavy menstrual bleeding range)' : ''}`, left, y);
      y += 5;
    }
    if (redFlags.length > 0) {
      doc.text(`- Red-flag items noticed: ${redFlags.length}`, left, y);
      y += 5;
    }
    if (psstResults.length > 0) {
      doc.text(`- PSST screening: ${psstResults[0].pattern}`, left, y);
      y += 5;
    }
    y += 4;

    // FIGO table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FIGO parameters', left, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Frequency: ${completedLengths.length > 0 ? median(completedLengths.slice(-6)) + ' days (usual: 24-38)' : 'Insufficient data'}`, left, y); y += 5;
    doc.text(`Duration: ${periodLen.median} days (usual: <=8)`, left, y); y += 5;
    doc.text(`Regularity: ±${completedLengths.length > 0 ? Math.round(standardDeviation(completedLengths.slice(-6))) : 0} days`, left, y); y += 5;
    doc.text(`Volume: ${pbacPerCycle.length > 0 ? pbacPerCycle[pbacPerCycle.length - 1].total + ' PBAC' : 'Not scored'}`, left, y); y += 8;

    // PBAC
    if (pbacPerCycle.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PBAC totals per cycle', left, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      for (const p of pbacPerCycle) {
        doc.text(`Cycle ${p.cycleNum}: ${p.total} ${p.total >= PBAC_HEAVY_THRESHOLD ? '(HMB range)' : ''}`, left, y);
        y += 5;
      }
      y += 4;
    }

    // Symptom & pain pattern
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Symptom & pain pattern', left, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const painLogs = logs.filter((l) => l.pain.severity >= 5);
    if (painLogs.length > 0) {
      doc.text(`- Pain severity ≥5 logged on ${painLogs.length} days`, left, y); y += 5;
      doc.text(`- Common pain locations: ${[...new Set(painLogs.flatMap((l) => l.pain.locations))].join(', ')}`, left, y); y += 5;
    }
    y += 4;

    // PSST
    if (psstResults.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PSST screening (screening tool — not a diagnosis)', left, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const wording = psstResultWording(psstResults[0].pattern);
      const lines = doc.splitTextToSize(wording, 170);
      doc.text(lines, left, y);
      y += lines.length * 5 + 4;
    }

    // Red flags
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Red-flag checklist (ACOG-based)', left, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (redFlags.length === 0) {
      doc.text('No red flags detected in logged data.', left, y); y += 5;
    } else {
      for (const flag of redFlags) {
        doc.text(`[X] ${flag.whatWeNoticed}`, left, y); y += 5;
      }
    }
    y += 4;

    // What helped
    if (topRemedies.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('What helped (patient-reported)', left, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      for (const [name, stats] of topRemedies) {
        doc.text(`- ${name}: helped ${stats.helped} of ${stats.tried} times`, left, y); y += 5;
      }
      y += 4;
    }

    // Patient notes
    if (clinicianNotes) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Patient notes / questions for clinician', left, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(clinicianNotes, 170);
      doc.text(lines, left, y);
      y += lines.length * 5 + 4;
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Prepared with Cyclewise. This is a wellness record, not a medical device. It does not diagnose.', left, 285);

    doc.save('cyclewise-clinician-report.pdf');
    showToast('PDF exported');
  };

  const handleExportJSON = () => {
    const data = { user, cycles, logs, products, psstResults, dailyRatings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyclewise-export.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported as JSON');
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">Clinician Report</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        <Card>
          <p className="text-sm text-ink-2 mb-3">A one-page PDF with what changed, your cycle parameters, PBAC scores, symptom patterns, and red-flag checklist. Free, forever.</p>
          <p className="text-sm font-medium text-ink mb-2">Choose range</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'last-cycle', label: 'Last cycle' },
              { key: 'last-3', label: 'Last 3 cycles' },
              { key: 'last-6', label: 'Last 6 months' },
              { key: 'lifetime', label: 'Lifetime brief' },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key as any)}
                className={`px-3 py-2 rounded-full text-sm border ${range === r.key ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-lg text-ink mb-3">What will be in the report</h2>
          <div className="space-y-2 text-sm text-ink-2">
            <p>1. Header: age band, mode, date range, cycle count</p>
            <p>2. What changed: key findings from your data</p>
            <p>3. FIGO parameter table (frequency, regularity, duration, volume)</p>
            <p>4. PBAC totals per cycle {pbacPerCycle.length > 0 && `(${pbacPerCycle.length} cycles scored)`}</p>
            <p>5. Symptom & pain pattern summary</p>
            {psstResults.length > 0 && <p>6. PSST result (labelled "screening tool — not a diagnosis")</p>}
            <p>7. Red-flag checklist ({redFlags.length} flagged)</p>
            <p>8. What helped: top remedies from your Playbook</p>
            <p>9. Your notes for the clinician</p>
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-lg text-ink mb-3">Your notes for the clinician</h2>
          <textarea
            value={clinicianNotes}
            onChange={(e) => setClinicianNotes(e.target.value)}
            placeholder="Write any questions or things you want your clinician to know..."
            className="w-full p-3 rounded-xl border border-line bg-surface text-ink text-sm min-h-[100px] resize-none"
          />
        </Card>

        <div className="space-y-2">
          <Button onClick={handleExportPDF} size="lg" className="w-full">
            <FileText size={18} className="inline mr-2" /> Export PDF
          </Button>
          <Button variant="secondary" onClick={handleExportJSON} className="w-full">
            <Download size={16} className="inline mr-1" /> Export all data (JSON)
          </Button>
        </div>

        <p className="text-xs text-ink-2 text-center italic">
          Cyclewise helps you track and prepare. It is not a medical device, does not diagnose, and does not replace a clinician.
        </p>
      </div>
    </div>
  );
}