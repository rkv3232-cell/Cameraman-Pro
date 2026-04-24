import jsPDF from "jspdf";
import { Booking } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rupee = (paise: number) =>
    `Rs. ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const toDateStr = (val: any): string => {
    try {
        const d = val?.toDate ? val.toDate() : new Date(val);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
        return "—";
    }
};

// ─── Colour palette ───────────────────────────────────────────────────────────

const C = {
    accent: [99, 102, 241] as [number, number, number],  // indigo-500
    accentDark: [67, 56, 202] as [number, number, number],  // indigo-700
    text: [17, 24, 39] as [number, number, number],  // gray-900
    muted: [107, 114, 128] as [number, number, number],  // gray-500
    border: [229, 231, 235] as [number, number, number],  // gray-200
    white: [255, 255, 255] as [number, number, number],
    greenBg: [240, 253, 244] as [number, number, number],  // green-50
    greenText: [22, 163, 74] as [number, number, number],  // green-600
    redBg: [254, 242, 242] as [number, number, number],  // red-50
    redText: [220, 38, 38] as [number, number, number],  // red-600
};

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generates a professional A4-size invoice PDF from booking data.
 * @returns jsPDF instance — call `.save()` or `.output()` on it.
 */
export function generateInvoicePDF(booking: Booking, studioName = "Cameraman Pro"): jsPDF {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const PW = 210;                 // page width mm
    const ML = 14;                  // left margin
    const MR = PW - ML;             // right margin
    const CW = MR - ML;             // content width
    let Y = 0;                   // running Y cursor

    // ── Header band ──────────────────────────────────────────────────────────
    doc.setFillColor(...C.accentDark);
    doc.rect(0, 0, PW, 36, "F");

    // Studio name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...C.white);
    doc.text(studioName, ML, 16);

    // "INVOICE" label — right-aligned
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("TAX INVOICE", MR, 12, { align: "right" });

    // Invoice number + date
    const invoiceNo = `INV-${booking.id.slice(0, 8).toUpperCase()}`;
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    doc.setFontSize(8);
    doc.text(`Invoice No: ${invoiceNo}`, MR, 18, { align: "right" });
    doc.text(`Date: ${today}`, MR, 23, { align: "right" });

    Y = 44;

    // ── Client + Event meta block ─────────────────────────────────────────────
    // Left: Bill To
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text("BILL TO", ML, Y);
    Y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...C.text);
    doc.text(booking.clientName, ML, Y);
    Y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.muted);
    doc.text(booking.clientPhone ?? "—", ML, Y);
    if (booking.clientEmail) {
        Y += 4;
        doc.text(booking.clientEmail, ML, Y);
    }
    if (booking.clientAddress) {
        Y += 4;
        doc.text(booking.clientAddress, ML, Y, { maxWidth: 80 });
    }

    // Right: Event details block
    const RX = ML + CW / 2 + 4;
    let RY = 44;
    const metaRows: [string, string][] = [
        ["Event Type", booking.eventType?.replace(/-/g, " ")?.replace(/\b\w/g, c => c.toUpperCase()) ?? "—"],
        ["Event Date", toDateStr(booking.eventDate)],
        ["Venue", booking.venue ?? "—"],
        ["Status", booking.status.toUpperCase()],
    ];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text("EVENT DETAILS", RX, RY);
    RY += 5;
    for (const [k, v] of metaRows) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...C.muted);
        doc.text(k + ":", RX, RY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.text);
        doc.text(v, RX + 26, RY);
        RY += 5;
    }

    Y = Math.max(Y, RY) + 8;

    // ── Divider ───────────────────────────────────────────────────────────────
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(ML, Y, MR, Y);
    Y += 6;

    // ── Sub-events table (if any) ─────────────────────────────────────────────
    if (booking.subEvents && booking.subEvents.length > 0) {
        // Header
        doc.setFillColor(...C.accent);
        doc.roundedRect(ML, Y, CW, 7, 1.5, 1.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...C.white);
        doc.text("Event Schedule", ML + 3, Y + 5);

        Y += 10;

        for (const ev of booking.subEvents) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(...C.text);
            doc.text(`• ${ev.title}`, ML + 3, Y);
            doc.setTextColor(...C.muted);
            doc.text(`${ev.date}  •  ${ev.time}`, ML + 45, Y);
            Y += 6;
        }
        Y += 4;
    }

    // ── Services / package block ──────────────────────────────────────────────
    // Header row
    doc.setFillColor(...C.accent);
    doc.roundedRect(ML, Y, CW, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.white);
    doc.text("Description", ML + 3, Y + 5.5);
    doc.text("Amount", MR - 3, Y + 5.5, { align: "right" });
    Y += 11;

    // Single service line (photography package)
    const serviceLabel = `${(booking.eventType ?? "Photography")
            .replace(/-/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase())
        } Package`;

    doc.setFillColor(248, 250, 252);   // slate-50
    doc.rect(ML, Y - 1, CW, 8, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.text);
    doc.text(serviceLabel, ML + 3, Y + 5);
    doc.text(rupee(booking.financials.totalAmount), MR - 3, Y + 5, { align: "right" });
    Y += 12;

    // Equipment add-ons
    if (booking.equipmentBooked && booking.equipmentBooked.length > 0) {
        for (const eq of booking.equipmentBooked) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(...C.muted);
            doc.text(`  Add-on: ${eq.name}`, ML + 3, Y);
            if (eq.rentalRate && eq.rentalRate > 0) {
                doc.text(rupee(eq.rentalRate), MR - 3, Y, { align: "right" });
            }
            Y += 5;
        }
        Y += 2;
    }

    // ── Totals block ──────────────────────────────────────────────────────────
    const totalAmount = booking.financials.totalAmount;
    const amountPaid = booking.financials.advancePaid;
    const balance = Math.max(0, totalAmount - amountPaid);

    // Divider
    doc.setDrawColor(...C.border);
    doc.line(ML + CW * 0.5, Y, MR, Y);
    Y += 4;

    const totalRows: { label: string; value: string; bold?: boolean; color?: [number, number, number]; bg?: [number, number, number] }[] = [
        { label: "Subtotal", value: rupee(totalAmount) },
        { label: "Amount Paid", value: rupee(amountPaid), color: C.greenText },
        { label: "Balance Due", value: rupee(balance), color: balance > 0 ? C.redText : C.greenText, bold: true },
    ];

    const TX = ML + CW * 0.5;
    for (const row of totalRows) {
        if (row.bold) {
            // highlight row
            doc.setFillColor(...(balance > 0 ? C.redBg : C.greenBg));
            doc.roundedRect(TX, Y - 1, CW * 0.5, 8, 1.5, 1.5, "F");
        }
        doc.setFont("helvetica", row.bold ? "bold" : "normal");
        doc.setFontSize(9);
        doc.setTextColor(...(row.color ?? C.text));
        doc.text(row.label, TX + 3, Y + 5);
        doc.text(row.value, MR - 3, Y + 5, { align: "right" });
        Y += 9;
    }

    Y += 6;

    // ── Payment history ───────────────────────────────────────────────────────
    const history = booking.financials.paymentHistory ?? [];
    if (history.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...C.muted);
        doc.text("PAYMENT HISTORY", ML, Y);
        Y += 5;

        for (const tx of history) {
            const txDate = tx.date
                ? ((tx.date as any).toDate ? (tx.date as any).toDate() : new Date(tx.date as any))
                : null;
            const txStr = txDate
                ? txDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "—";
            const label = `${tx.method?.toUpperCase() ?? "PAYMENT"}${tx.referenceId ? " · Ref: " + tx.referenceId : ""}`;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(...C.text);
            doc.text(`• ${txStr}  —  ${label}`, ML + 3, Y);
            doc.setTextColor(...C.greenText);
            doc.text(`+ ${rupee(tx.amount)}`, MR - 3, Y, { align: "right" });
            doc.setTextColor(...C.text);
            Y += 5;
        }
        Y += 4;
    }

    // ── Notes section ─────────────────────────────────────────────────────────
    if (booking.notes) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...C.muted);
        doc.text("NOTES", ML, Y);
        Y += 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...C.text);
        const noteLines = doc.splitTextToSize(booking.notes, CW);
        doc.text(noteLines, ML, Y);
        Y += noteLines.length * 4 + 4;
    }

    // ── Footer band ───────────────────────────────────────────────────────────
    const footerY = 282;
    doc.setFillColor(...C.accent);
    doc.rect(0, footerY, PW, 15, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.white);
    doc.text("Thank you for choosing " + studioName + "  ·  Generated by Cameraman Pro", PW / 2, footerY + 6, { align: "center" });
    doc.text(`Invoice ID: ${invoiceNo}  ·  Status: ${booking.status.toUpperCase()}`, PW / 2, footerY + 11, { align: "center" });

    return doc;
}

/**
 * Convenience: generates & downloads the PDF immediately.
 */
export function downloadInvoicePDF(booking: Booking, studioName?: string): void {
    const doc = generateInvoicePDF(booking, studioName);
    const fname = `Invoice_${booking.clientName.replace(/\s+/g, "_")}_${booking.id.slice(0, 6)}.pdf`;
    doc.save(fname);
}
