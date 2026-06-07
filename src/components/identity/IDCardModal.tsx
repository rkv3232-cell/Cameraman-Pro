import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer, QrCode, RotateCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { StaffMember } from '../../types/staff';

interface Props {
  member: StaffMember;
  onClose: () => void;
}

const STUDIO_NAME = 'Cameraman Pro';

export function IDCardModal({ member, onClose }: Props) {
  const [showBack, setShowBack] = useState(false);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const frontExportRef = useRef<HTMLDivElement>(null);
  const backExportRef = useRef<HTMLDivElement>(null);

  const qrUrl = `${window.location.origin}/staff/${member.employeeId}`;

  const exportPNG = async () => {
    if (!frontExportRef.current || !backExportRef.current) return;
    setExporting(true);
    try {
      const opts = { scale: 3, useCORS: true, backgroundColor: null, logging: false };
      const frontCanvas = await html2canvas(frontExportRef.current, opts);
      const backCanvas = await html2canvas(backExportRef.current, opts);

      const canvas = document.createElement('canvas');
      canvas.width = frontCanvas.width;
      canvas.height = frontCanvas.height * 2 + 60; // 60px gap
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, 0, frontCanvas.height + 60);

      const link = document.createElement('a');
      link.download = `ID_${member.employeeId}_Full.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!frontExportRef.current || !backExportRef.current) return;
    setExporting(true);
    try {
      const opts = { scale: 3, useCORS: true, backgroundColor: null, logging: false };
      const frontCanvas = await html2canvas(frontExportRef.current, opts);
      const backCanvas = await html2canvas(backExportRef.current, opts);

      // Standard Aadhar/ID Card size: 85.6mm x 54mm
      const cardWidth = 85.6;
      const cardHeight = 54;
      const gap = 10; // 10mm gap between front and back

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const totalWidth = (cardWidth * 2) + gap;
      const marginX = (210 - totalWidth) / 2; // Center side-by-side horizontally on A4

      pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', marginX, 20, cardWidth, cardHeight);
      pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', marginX + cardWidth + gap, 20, cardWidth, cardHeight);
      pdf.save(`ID_${member.employeeId}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const printCard = async () => {
    if (!frontExportRef.current || !backExportRef.current) return;
    setExporting(true);
    try {
      const opts = { scale: 3, useCORS: true, backgroundColor: null };
      const frontCanvas = await html2canvas(frontExportRef.current, opts);
      const backCanvas = await html2canvas(backExportRef.current, opts);

      const win = window.open('', '_blank');
      if (!win) {
        alert("Please allow popups to print");
        return;
      }

      // Print exactly at 85.6mm x 54mm (Aadhar/PVC standard), Side by side
      win.document.write(`
        <html><head><title>ID Card - ${member.fullName}</title>
        <style>
          body { margin: 0; padding: 20px; display: flex; flex-direction: row; justify-content: center; align-items: flex-start; gap: 10mm; background: #fff; }
          .card { width: 85.6mm; height: 54mm; object-fit: contain; }
          @media print {
            body { padding: 0; margin: 10mm auto; }
            @page { margin: 0; }
          }
        </style></head>
        <body>
          <img class="card" src="${frontCanvas.toDataURL('image/jpeg', 1.0)}" />
          <img class="card" src="${backCanvas.toDataURL('image/jpeg', 1.0)}" onload="setTimeout(() => { window.print(); window.close(); }, 500)" />
        </body></html>
      `);
      win.document.close();
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-[#0d1530] to-[#111827] border border-[#c9a227]/20 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c9a227] to-[#f0c040] flex items-center justify-center">
              <QrCode size={18} className="text-[#0a0f1e]" />
            </div>
            <div>
              <h2 className="font-bold text-white">ID Card Generator</h2>
              <p className="text-xs text-slate-400">{member.fullName} · {member.employeeId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBack(!showBack)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium transition-colors"
            >
              <RotateCcw size={13} />
              {showBack ? 'Front' : 'Back'}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Card Preview */}
        <div className="p-6 flex justify-center">
          <AnimatePresence mode="wait">
            {!showBack ? (
              <motion.div
                key="front"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <IDCardFront ref={cardRef} member={member} qrUrl={qrUrl} />
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <IDCardBack ref={cardRef} member={member} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Export Buttons */}
        <div className="p-5 pt-0 flex gap-2">
          <button
            onClick={exportPNG}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#c9a227]/10 hover:bg-[#c9a227]/20 text-[#c9a227] text-sm font-medium transition-colors"
          >
            <Download size={15} />
            PNG
          </button>
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium transition-colors"
          >
            <Download size={15} />
            PDF
          </button>
          <button
            onClick={printCard}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors"
          >
            <Printer size={15} />
            Print
          </button>
        </div>
      </motion.div>

      {/* Hidden Container for Exporting Both Sides Independently */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none', zIndex: -100 }}>
        <div>
          <div ref={frontExportRef}><IDCardFront member={member} qrUrl={qrUrl} /></div>
          <div ref={backExportRef}><IDCardBack member={member} /></div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ID Card Front ─────────────────────────────────────────────────────────────
import React from 'react';
const IDCardFront = React.forwardRef<HTMLDivElement, { member: StaffMember; qrUrl: string }>(
  ({ member, qrUrl }, ref) => (
    <div
      ref={ref}
      style={{
        width: '342px',
        height: '216px',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0d1530 100%)',
        border: '1.5px solid rgba(201,162,39,0.5)',
        boxShadow: '0 0 40px rgba(201,162,39,0.2), 0 20px 60px rgba(0,0,0,0.8)',
        position: 'relative',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Gold shine top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px',
        background: 'linear-gradient(90deg, transparent, #c9a227, #f0c040, #c9a227, transparent)',
      }} />
      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: 'rgba(201,162,39,0.08)',
      }} />

      {/* Header Bar */}
      <div style={{
        flexShrink: 0,
        background: 'linear-gradient(90deg, #c9a227 0%, #f0c040 50%, #c9a227 100%)',
        padding: '6px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0a0f1e', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', lineHeight: 'normal' }}>Cameraman Pro</span>
        <span style={{ fontSize: '8px', fontWeight: 700, color: '#0a0f1e', opacity: 0.7, letterSpacing: '1px', display: 'block', lineHeight: 'normal' }}>OFFICIAL ID</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', padding: '8px 16px', gap: '12px' }}>
        {/* Photo + QR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          {member.profilePhoto ? (
            <img
              src={member.profilePhoto}
              alt={member.fullName}
              crossOrigin="anonymous"
              style={{
                width: '66px', height: '74px', borderRadius: '10px', objectFit: 'cover',
                border: '2px solid rgba(201,162,39,0.6)',
                flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: '66px', height: '74px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #1a2744, #0d1530)',
              border: '2px solid rgba(201,162,39,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px', fontWeight: 900, color: '#c9a227',
              flexShrink: 0
            }}>
              {member.fullName.charAt(0)}
            </div>
          )}
          {/* QR Code */}
          <div style={{
            padding: '3px', background: 'white', borderRadius: '6px',
            border: '1px solid rgba(201,162,39,0.3)', display: 'flex', flexShrink: 0
          }}>
            <QRCodeSVG
              value={qrUrl}
              size={42}
              fgColor="#0a0f1e"
              bgColor="white"
              level="H"
            />
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
          {/* Verified badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '20px', padding: '2px 8px', width: 'fit-content',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#10b981', letterSpacing: '0.5px' }}>VERIFIED</span>
          </div>

          <div style={{ marginTop: '2px' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', lineHeight: 1.2 }}>
              {member.fullName}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#c9a227', letterSpacing: '0.5px', marginTop: '2px' }}>
              {member.role.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>

          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <InfoRow label="ID" value={member.employeeId} highlight />
            <InfoRow label="Joined" value={member.joiningDate ? new Date(member.joiningDate).getFullYear().toString() : '—'} />
            {member.experience && <InfoRow label="Exp" value={member.experience} />}
            {member.city && <InfoRow label="City" value={member.city} />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0,
        background: 'rgba(201,162,39,0.08)',
        borderTop: '1px solid rgba(201,162,39,0.2)',
        padding: '6px 20px 15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
          <span style={{
            fontSize: '7.5px',
            fontWeight: 800,
            color: '#c9a227',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            lineHeight: 1.2
          }}>
            {STUDIO_NAME}
          </span>
          <span style={{
            fontSize: '5.5px',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '160px',
            lineHeight: 1.2
          }}>
          </span>
        </div>
        <span style={{
          fontSize: '7.5px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          Scan QR to verify
        </span>
      </div>
    </div>
  )
);

// ─── ID Card Back ──────────────────────────────────────────────────────────────
const IDCardBack = React.forwardRef<HTMLDivElement, { member: StaffMember }>(
  ({ member }, ref) => (
    <div
      ref={ref}
      style={{
        width: '342px',
        height: '216px',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a2744 0%, #0a0f1e 60%, #0d1530 100%)',
        border: '1.5px solid rgba(201,162,39,0.5)',
        boxShadow: '0 0 40px rgba(201,162,39,0.2), 0 20px 60px rgba(0,0,0,0.8)',
        position: 'relative',
        fontFamily: 'system-ui, sans-serif',
        padding: '10px 16px 16px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Magnetic stripe simulation */}
      <div style={{
        position: 'absolute', top: '24px', left: 0, right: 0, height: '24px',
        background: 'linear-gradient(180deg, #1a1a2e, #16213e)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, marginTop: '52px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 52px)' }}>
        {/* Contact Info Row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '5px' }}>
          <div>
            <div style={{ fontSize: '7px', color: '#c9a227', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Phone</div>
            <div style={{ fontSize: '9px', color: 'white', fontWeight: 600 }}>{member.phone}</div>
          </div>
          <div>
            <div style={{ fontSize: '7px', color: '#c9a227', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Emergency</div>
            <div style={{ fontSize: '9px', color: 'white', fontWeight: 600 }}>{member.emergencyContact || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '7px', color: '#c9a227', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Blood</div>
            <div style={{ fontSize: '9px', color: 'white', fontWeight: 600 }}>{member.bloodGroup || '—'}</div>
          </div>
        </div>

        <div style={{ marginBottom: '5px' }}>
          <div style={{ fontSize: '7px', color: '#c9a227', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</div>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
            {[member.address, member.city, member.state].filter(Boolean).join(', ') || '—'}
          </div>
        </div>

        {/* Terms */}
        <div style={{
          background: 'rgba(201,162,39,0.06)', borderRadius: '5px', padding: '4px 7px',
          border: '1px solid rgba(201,162,39,0.1)',
        }}>
          <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
            This card is property of {STUDIO_NAME}.
            Unauthorized use is prohibited. Valid only with official stamp.
          </div>
        </div>

        {/* Signature line */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', paddingRight: '4px' }}>
          <div style={{ textAlign: 'center', width: '72px' }}>
            <div style={{ width: '72px', height: '1px', background: 'rgba(201,162,39,0.4)', marginBottom: '2px' }} />
            <div style={{ fontSize: '6px', color: 'rgba(201,162,39,0.5)', fontWeight: 700, letterSpacing: '0.3px' }}>AUTHORIZED SIGNATORY</div>
          </div>
        </div>
      </div>
    </div>
  )
);

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
      <span style={{ fontSize: '8px', color: 'rgba(201,162,39,0.6)', fontWeight: 700, textTransform: 'uppercase', minWidth: '28px', letterSpacing: '0.3px' }}>
        {label}
      </span>
      <span style={{ fontSize: highlight ? '11px' : '9px', color: highlight ? '#c9a227' : 'rgba(255,255,255,0.7)', fontWeight: highlight ? 800 : 500, letterSpacing: highlight ? '0.5px' : 0 }}>
        {value}
      </span>
    </div>
  );
}
