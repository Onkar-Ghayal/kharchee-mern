import { jsPDF } from "jspdf";

/**
 * Kharchee - Executive PDF Statement Generator
 * Generates an authentic, high-res A4 financial statement PDF.
 */
export function generateExecutivePDFDoc(friend, userName = "User") {
    if (!friend) return null;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
    const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
    const margin = 40;
    const contentWidth = pageWidth - margin * 2; // 515.28 pt

    const friendName = friend.name || "Friend";
    const currentAmount = Number(friend.currentAmount) || 0;
    const isLoss = currentAmount < 0;
    const isZero = currentAmount === 0;
    const history = Array.isArray(friend.history) ? friend.history : [];

    // Totals
    const totalGiven = history.reduce((acc, h) => (Number(h?.amount) > 0 ? acc + Number(h.amount) : acc), 0);
    const totalTaken = history.reduce((acc, h) => (Number(h?.amount) < 0 ? acc + Math.abs(Number(h.amount)) : acc), 0);

    // Reference ID & Date
    const refCode = `KC-${(Math.abs(currentAmount) * 7 + (friend._id ? friend._id.slice(-4).charCodeAt(0) : 100)) % 89999 + 10000}`;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
    const timeFormatted = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });

    // 1. TOP HEADER BANNER
    doc.setFillColor(15, 23, 42); // Deep Navy (#0f172a)
    doc.roundedRect(margin, margin, contentWidth, 72, 8, 8, "F");

    // Brand Badge Icon
    doc.setFillColor(99, 102, 241); // Indigo (#6366f1)
    doc.roundedRect(margin + 16, margin + 14, 44, 44, 8, 8, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("K", margin + 32, margin + 43, { align: "center" });

    // Brand Name
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("KHARCHEE", margin + 70, margin + 34);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text("OFFICIAL PAYMENT STATEMENT & LEDGER", margin + 70, margin + 49);

    // Ref & Date (Right)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(129, 140, 248); // Indigo 400
    doc.text(`REF: #${refCode}`, pageWidth - margin - 18, margin + 34, { align: "right" });

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`${dateFormatted} • ${timeFormatted}`, pageWidth - margin - 18, margin + 49, { align: "right" });

    // 2. RECIPIENT & SENDER PARTY META CARDS
    const partyY = margin + 86;
    const cardW = (contentWidth - 14) / 2;

    // Card 1: Billed To (Friend)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, partyY, cardW, 58, 6, 6, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("STATEMENT FOR / BILLED TO", margin + 14, partyY + 18);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(friendName, margin + 14, partyY + 35);

    if (friend.mobile) {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`Mobile: ${friend.mobile}`, margin + 14, partyY + 48);
    }

    // Card 2: Issued By (User)
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + cardW + 14, partyY, cardW, 58, 6, 6, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("ISSUED BY (LEDGER OWNER)", margin + cardW + 28, partyY + 18);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(userName, margin + cardW + 28, partyY + 35);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Platform: Kharchee App", margin + cardW + 28, partyY + 48);

    // 3. HERO AMOUNT DUE BOX
    const heroY = partyY + 70;
    if (isLoss) {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(252, 165, 165);
    } else if (isZero) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
    } else {
        doc.setFillColor(236, 253, 245);
        doc.setDrawColor(110, 231, 183);
    }
    doc.roundedRect(margin, heroY, contentWidth, 80, 8, 8, "FD");

    // Caption
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    if (isLoss) doc.setTextColor(220, 38, 38);
    else if (isZero) doc.setTextColor(100, 116, 139);
    else doc.setTextColor(5, 150, 105);

    doc.text(
        isLoss ? "● TOTAL AMOUNT OWED" : isZero ? "● BALANCE SETTLED" : "● NET OUTSTANDING BALANCE DUE",
        margin + 20,
        heroY + 24
    );

    // Big Amount Figure
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    const amountStr = `Rs. ${Math.abs(currentAmount).toLocaleString("en-IN")}`;
    doc.text(amountStr, margin + 20, heroY + 58);

    // Status Tag Pill (Right)
    const statusText = isLoss ? "YOU OWE" : isZero ? "SETTLED" : "PENDING PAYMENT";
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    const textWidth = doc.getTextWidth(statusText);
    const pillW = textWidth + 18;
    const pillX = pageWidth - margin - 20 - pillW;
    const pillY = heroY + 34;

    if (isLoss) doc.setFillColor(239, 68, 68);
    else if (isZero) doc.setFillColor(100, 116, 139);
    else doc.setFillColor(16, 185, 129);

    doc.roundedRect(pillX, pillY, pillW, 22, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, pillX + pillW / 2, pillY + 15, { align: "center" });

    // 4. SUMMARY METRICS BAR
    const summaryY = heroY + 92;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, summaryY, contentWidth, 42, 6, 6, "FD");

    const colW = contentWidth / 3;

    // Total Received
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL RECEIVED", margin + colW * 0.5, summaryY + 16, { align: "center" });

    doc.setFontSize(10.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`+Rs. ${totalGiven.toLocaleString("en-IN")}`, margin + colW * 0.5, summaryY + 32, { align: "center" });

    // Total Paid
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL PAID", margin + colW * 1.5, summaryY + 16, { align: "center" });

    doc.setFontSize(10.5);
    doc.setTextColor(239, 68, 68);
    doc.text(`-Rs. ${totalTaken.toLocaleString("en-IN")}`, margin + colW * 1.5, summaryY + 32, { align: "center" });

    // Total Entries
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL ENTRIES", margin + colW * 2.5, summaryY + 16, { align: "center" });

    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${history.length}`, margin + colW * 2.5, summaryY + 32, { align: "center" });

    // 5. ITEMIZED TRANSACTIONS TABLE
    const tableHeaderY = summaryY + 56;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Itemized Transaction Ledger", margin, tableHeaderY);

    // Table Header Row
    const thY = tableHeaderY + 10;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, thY, contentWidth, 24, 4, 4, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("#", margin + 12, thY + 16);
    doc.text("DATE & TIME", margin + 35, thY + 16);
    doc.text("DESCRIPTION / NOTE", margin + 140, thY + 16);
    doc.text("TYPE", margin + 360, thY + 16);
    doc.text("AMOUNT (INR)", pageWidth - margin - 12, thY + 16, { align: "right" });

    let currentY = thY + 24;
    const maxEntries = 12; // Fits neatly on 1-page A4
    const displayEntries = history.slice(0, maxEntries);

    if (displayEntries.length === 0) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, currentY + 6, contentWidth, 40, 4, 4, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text("No transactions recorded yet in ledger.", pageWidth / 2, currentY + 30, { align: "center" });
        currentY += 50;
    } else {
        displayEntries.forEach((txn, i) => {
            const isRowLoss = Number(txn.amount) < 0;
            const amt = Math.abs(Number(txn.amount) || 0);
            const d = txn.date ? new Date(txn.date) : new Date();
            const dateStr = !isNaN(d.getTime())
                ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "Recent";
            const timeStr = !isNaN(d.getTime())
                ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                : "";

            // Alternating Row Background
            if (i % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, currentY, contentWidth, 24, "F");
            }

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            doc.text(`${i + 1}`, margin + 12, currentY + 16);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(dateStr, margin + 35, currentY + 12);
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(148, 163, 184);
            doc.text(timeStr, margin + 35, currentY + 21);

            // Description
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);
            const desc = txn.description || "General Transaction";
            const truncatedDesc = desc.length > 40 ? desc.substring(0, 38) + "..." : desc;
            doc.text(truncatedDesc, margin + 140, currentY + 16);

            // Type
            const typeLabel = txn.type || (isRowLoss ? "DEBIT" : "CREDIT");
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 116, 139);
            doc.text(typeLabel.toUpperCase(), margin + 360, currentY + 16);

            // Amount
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            if (isRowLoss) {
                doc.setTextColor(239, 68, 68);
                doc.text(`-Rs. ${amt.toLocaleString("en-IN")}`, pageWidth - margin - 12, currentY + 16, { align: "right" });
            } else {
                doc.setTextColor(16, 185, 129);
                doc.text(`+Rs. ${amt.toLocaleString("en-IN")}`, pageWidth - margin - 12, currentY + 16, { align: "right" });
            }

            currentY += 24;
        });

        if (history.length > maxEntries) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100, 116, 139);
            doc.text(
                `+ ${history.length - maxEntries} additional older entries omitted for 1-page summary.`,
                margin + 6,
                currentY + 14
            );
            currentY += 20;
        }
    }

    // 6. FOOTER SEAL & TRUST WATERMARK
    const footerY = pageHeight - margin - 35;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(99, 102, 241);
    doc.text("Kharchee Verified Digital Financial Statement", pageWidth / 2, footerY + 16, { align: "center" });

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
        "Generated via Kharchee App • kharchee.vercel.app • Please settle via GPay / PhonePe / Paytm / Bank",
        pageWidth / 2,
        footerY + 28,
        { align: "center" }
    );

    return doc;
}

/**
 * Download the statement PDF locally
 */
export function downloadExecutivePDF(friend, userName = "User") {
    const doc = generateExecutivePDFDoc(friend, userName);
    if (!doc) return;
    const safeName = (friend.name || "friend").replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`Kharchee_Statement_${safeName}.pdf`);
}

/**
 * Direct WhatsApp PDF Sender
 * Uses Web Share API (native file sharing on Mobile / Supported Browsers)
 * Falls back to auto-downloading PDF + opening WhatsApp Chat with payment details
 */
export async function sendPDFStatementToWhatsApp(friend, userName = "User") {
    if (!friend) return;

    const doc = generateExecutivePDFDoc(friend, userName);
    if (!doc) return;

    const friendName = friend.name || "Friend";
    const currentAmount = Math.abs(Number(friend.currentAmount) || 0);
    const safeName = friendName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Kharchee_Statement_${safeName}.pdf`;

    // 1. Generate Blob & File object
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

    const shareText =
        `Hi ${friendName}! 👋 Here is our shared expense PDF statement from Kharchee.\n\n` +
        `💰 *Outstanding Balance:* ₹${currentAmount.toLocaleString("en-IN")}\n` +
        `📄 *Attached Document:* ${fileName}\n\n` +
        `Please check and settle when possible. Thanks! 😊`;

    // 2. Try Native File Web Share (Direct WhatsApp / App attachment)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
            await navigator.share({
                files: [pdfFile],
                title: `Kharchee Statement - ${friendName}`,
                text: shareText
            });
            return { success: true, mode: "direct-share" };
        } catch (err) {
            // User cancelled share or abort
            if (err.name === "AbortError") return { success: false, mode: "cancelled" };
        }
    }

    // 3. Fallback: Automatically download the PDF to their device & launch WhatsApp chat
    doc.save(fileName);

    const msg = encodeURIComponent(shareText);
    let waUrl = `https://wa.me/?text=${msg}`;
    if (friend?.mobile) {
        const cleanPhone = friend.mobile.replace(/[^0-9]/g, "");
        const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        waUrl = `https://wa.me/${formattedPhone}?text=${msg}`;
    }

    window.open(waUrl, "_blank");
    return { success: true, mode: "download-and-chat" };
}
