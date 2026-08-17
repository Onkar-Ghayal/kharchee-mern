/**
 * Kharchee - Executive Visual Receipt & Statement Card Generator
 * High-Definition HTML5 Canvas rendering for WhatsApp / Instagram / Gallery
 * Designed without QR codes for a clean, executive financial look.
 */

export function drawReceiptCard(canvas, { friend, userName = "User", theme = "dark" }) {
    if (!canvas || !friend) return;

    const ctx = canvas.getContext("2d");
    const width = 800;
    const height = 1040;
    canvas.width = width;
    canvas.height = height;

    const isDark = theme === "dark";
    const friendName = friend.name || "Friend";
    const currentAmount = Number(friend.currentAmount) || 0;
    const isLoss = currentAmount < 0;
    const isZero = currentAmount === 0;
    const history = Array.isArray(friend.history) ? friend.history : [];

    // Totals
    const totalGiven = history.reduce((acc, h) => (Number(h?.amount) > 0 ? acc + Number(h.amount) : acc), 0);
    const totalTaken = history.reduce((acc, h) => (Number(h?.amount) < 0 ? acc + Math.abs(Number(h.amount)) : acc), 0);

    // Reference ID & Date
    const refCode = `#KC-${(Math.abs(currentAmount) * 7 + (friend._id ? friend._id.slice(-4).charCodeAt(0) : 100)) % 89999 + 10000}`;
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

    // Helper: Rounded Rectangle
    function roundRect(ctx, x, y, w, h, r, fill = true, stroke = false) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    // 1. BACKGROUND CANVAS
    if (isDark) {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#0b0f19");
        bgGrad.addColorStop(0.5, "#111827");
        bgGrad.addColorStop(1, "#070a12");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Ambient Glow Highlights
        const glow1 = ctx.createRadialGradient(150, 100, 10, 150, 100, 350);
        glow1.addColorStop(0, "rgba(99, 102, 241, 0.18)");
        glow1.addColorStop(1, "rgba(99, 102, 241, 0)");
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, width, height);

        const glow2 = ctx.createRadialGradient(650, 450, 10, 650, 450, 300);
        glow2.addColorStop(0, "rgba(16, 185, 129, 0.12)");
        glow2.addColorStop(1, "rgba(16, 185, 129, 0)");
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, width, height);
    } else {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#ffffff");
        bgGrad.addColorStop(0.5, "#f8fafc");
        bgGrad.addColorStop(1, "#f1f5f9");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Subtle warm glow
        const glow = ctx.createRadialGradient(400, 200, 10, 400, 200, 400);
        glow.addColorStop(0, "rgba(99, 102, 241, 0.06)");
        glow.addColorStop(1, "rgba(99, 102, 241, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
    }

    // Outer Card Frame
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)";
    ctx.lineWidth = 2;
    roundRect(ctx, 24, 24, width - 48, height - 48, 28, false, true);

    // 2. HEADER SECTION
    // Top Bar Background
    ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(241, 245, 249, 0.6)";
    roundRect(ctx, 26, 26, width - 52, 90, 26, true, false);

    // Brand Badge / Logo Icon
    const brandGrad = ctx.createLinearGradient(50, 45, 94, 89);
    brandGrad.addColorStop(0, "#6366f1");
    brandGrad.addColorStop(1, "#a855f7");
    ctx.fillStyle = brandGrad;
    roundRect(ctx, 50, 46, 48, 48, 14, true, false);

    // Bolt Icon in Badge
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚡", 74, 80);

    // Brand Name & Tagline
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
    ctx.font = "800 24px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("KHARCHEE", 112, 68);

    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.font = "600 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("OFFICIAL PAYMENT SLIP", 114, 86);

    // Reference & Date Badge (Top Right)
    ctx.textAlign = "right";
    ctx.fillStyle = isDark ? "#818cf8" : "#4f46e5";
    ctx.font = "700 13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(refCode, width - 55, 68);

    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "600 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`${dateFormatted} • ${timeFormatted}`, width - 55, 86);

    // 3. RECIPIENT & SENDER PARTY META ROW
    const partyY = 145;
    ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.75)" : "#ffffff";
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(226, 232, 240, 0.8)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 50, partyY, width - 100, 84, 18, true, true);

    // Billed To (Left)
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "700 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("BILLED TO / STATEMENT FOR", 74, partyY + 30);

    ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
    ctx.font = "800 18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(friendName, 74, partyY + 56);

    // Issued By (Right)
    ctx.textAlign = "right";
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "700 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("ISSUED BY", width - 74, partyY + 30);

    ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
    ctx.font = "800 18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(userName, width - 74, partyY + 56);

    // 4. HERO STATEMENT AMOUNT BOX
    const heroY = 250;
    const heroHeight = 160;
    const heroGrad = ctx.createLinearGradient(50, heroY, width - 50, heroY + heroHeight);

    if (isDark) {
        if (isLoss) {
            heroGrad.addColorStop(0, "rgba(239, 68, 68, 0.14)");
            heroGrad.addColorStop(1, "rgba(239, 68, 68, 0.04)");
        } else if (isZero) {
            heroGrad.addColorStop(0, "rgba(148, 163, 184, 0.12)");
            heroGrad.addColorStop(1, "rgba(148, 163, 184, 0.04)");
        } else {
            heroGrad.addColorStop(0, "rgba(16, 185, 129, 0.16)");
            heroGrad.addColorStop(1, "rgba(16, 185, 129, 0.04)");
        }
    } else {
        if (isLoss) {
            heroGrad.addColorStop(0, "rgba(254, 242, 242, 1)");
            heroGrad.addColorStop(1, "rgba(255, 255, 255, 1)");
        } else if (isZero) {
            heroGrad.addColorStop(0, "rgba(248, 250, 252, 1)");
            heroGrad.addColorStop(1, "rgba(255, 255, 255, 1)");
        } else {
            heroGrad.addColorStop(0, "rgba(236, 253, 245, 1)");
            heroGrad.addColorStop(1, "rgba(255, 255, 255, 1)");
        }
    }

    ctx.fillStyle = heroGrad;
    ctx.strokeStyle = isLoss
        ? "rgba(239, 68, 68, 0.35)"
        : isZero
        ? "rgba(148, 163, 184, 0.35)"
        : "rgba(16, 185, 129, 0.35)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 50, heroY, width - 100, heroHeight, 22, true, true);

    // Hero Caption & Status Pill
    ctx.textAlign = "left";
    ctx.fillStyle = isLoss ? "#ef4444" : isZero ? "#64748b" : "#10b981";
    ctx.font = "800 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(
        isLoss ? "● TOTAL AMOUNT OWED" : isZero ? "● BALANCE SETTLED" : "● TOTAL AMOUNT DUE",
        80,
        heroY + 42
    );

    // Big Amount Figure
    ctx.fillStyle = isLoss ? "#ef4444" : isZero ? (isDark ? "#94a3b8" : "#64748b") : "#10b981";
    ctx.font = "900 52px 'Plus Jakarta Sans', sans-serif";
    const amountStr = `₹ ${Math.abs(currentAmount).toLocaleString("en-IN")}`;
    ctx.fillText(amountStr, 78, heroY + 104);

    // Status Tag Pill (Right side)
    const statusText = isLoss ? "YOU OWE" : isZero ? "SETTLED" : "PENDING PAYMENT";
    ctx.font = "800 11px 'Plus Jakarta Sans', sans-serif";
    const statusWidth = ctx.measureText(statusText).width + 24;
    const pillX = width - 80 - statusWidth;
    const pillY = heroY + 68;

    ctx.fillStyle = isLoss
        ? "rgba(239, 68, 68, 0.18)"
        : isZero
        ? "rgba(148, 163, 184, 0.18)"
        : "rgba(16, 185, 129, 0.18)";
    roundRect(ctx, pillX, pillY, statusWidth, 32, 16, true, false);

    ctx.textAlign = "center";
    ctx.fillStyle = isLoss ? "#ef4444" : isZero ? "#64748b" : "#10b981";
    ctx.fillText(statusText, pillX + statusWidth / 2, pillY + 20);

    // 5. ITEMIZED RECENT LEDGER TRANSACTIONS
    const ledgerY = 435;
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
    ctx.font = "800 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Recent Shared Ledger Activity", 54, ledgerY);

    ctx.textAlign = "right";
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "600 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Total Entries: ${history.length}`, width - 54, ledgerY);

    // Transaction rows container
    const listTop = ledgerY + 18;
    const displayTxns = history.slice(0, 4);

    if (displayTxns.length === 0) {
        ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.5)" : "#ffffff";
        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(226, 232, 240, 0.8)";
        roundRect(ctx, 50, listTop, width - 100, 120, 16, true, true);

        ctx.textAlign = "center";
        ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
        ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("No transactions recorded yet in ledger.", width / 2, listTop + 65);
    } else {
        displayTxns.forEach((txn, idx) => {
            const rowY = listTop + idx * 68;
            const isRowLoss = Number(txn.amount) < 0;
            const amt = Number(txn.amount) || 0;
            const d = txn.date ? new Date(txn.date) : new Date();
            const dateStr = !isNaN(d.getTime())
                ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : "Recent";

            // Row Card Background
            ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.65)" : "#ffffff";
            ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(226, 232, 240, 0.8)";
            ctx.lineWidth = 1;
            roundRect(ctx, 50, rowY, width - 100, 58, 14, true, true);

            // Date Badge
            ctx.fillStyle = isDark ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.08)";
            roundRect(ctx, 64, rowY + 12, 68, 34, 8, true, false);

            ctx.textAlign = "center";
            ctx.fillStyle = isDark ? "#818cf8" : "#4f46e5";
            ctx.font = "800 12px 'Plus Jakarta Sans', sans-serif";
            ctx.fillText(dateStr, 98, rowY + 33);

            // Description / Note
            ctx.textAlign = "left";
            ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
            ctx.font = "700 14px 'Plus Jakarta Sans', sans-serif";
            const noteText = txn.description || "General Shared Expense";
            const truncatedNote = noteText.length > 34 ? noteText.slice(0, 32) + "..." : noteText;
            ctx.fillText(truncatedNote, 148, rowY + 34);

            // Amount
            ctx.textAlign = "right";
            ctx.fillStyle = isRowLoss ? "#ef4444" : "#10b981";
            ctx.font = "800 16px 'Plus Jakarta Sans', sans-serif";
            ctx.fillText(`${isRowLoss ? "-" : "+"}₹${Math.abs(amt).toLocaleString("en-IN")}`, width - 72, rowY + 35);
        });
    }

    // 6. TOTALS SUMMARY FOOTER BAR
    const summaryY = 765;
    ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(241, 245, 249, 0.9)";
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)";
    roundRect(ctx, 50, summaryY, width - 100, 80, 16, true, true);

    const colW = (width - 100) / 3;

    // Col 1: Total Received
    ctx.textAlign = "center";
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "700 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("TOTAL RECEIVED", 50 + colW * 0.5, summaryY + 30);
    ctx.fillStyle = "#10b981";
    ctx.font = "800 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`+₹${totalGiven.toLocaleString("en-IN")}`, 50 + colW * 0.5, summaryY + 56);

    // Col 2: Total Paid
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "700 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("TOTAL PAID", 50 + colW * 1.5, summaryY + 30);
    ctx.fillStyle = "#ef4444";
    ctx.font = "800 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`-₹${totalTaken.toLocaleString("en-IN")}`, 50 + colW * 1.5, summaryY + 56);

    // Col 3: Net Ledger Status
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "700 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("NET BALANCE", 50 + colW * 2.5, summaryY + 30);
    ctx.fillStyle = isLoss ? "#ef4444" : isZero ? (isDark ? "#94a3b8" : "#64748b") : "#10b981";
    ctx.font = "800 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(
        `${isLoss ? "-" : isZero ? "" : "+"}₹${Math.abs(currentAmount).toLocaleString("en-IN")}`,
        50 + colW * 2.5,
        summaryY + 56
    );

    // 7. EXECUTIVE TRUST SEAL & WATERMARK
    const footerY = 880;
    ctx.textAlign = "center";
    ctx.fillStyle = isDark ? "#818cf8" : "#4f46e5";
    ctx.font = "700 13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("🔒 Kharchee Verified Digital Statement", width / 2, footerY);

    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "500 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Smart Split & Expense Tracking • kharchee.vercel.app", width / 2, footerY + 22);

    ctx.fillStyle = isDark ? "#475569" : "#cbd5e1";
    ctx.font = "500 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Please settle via your preferred payment app (GPay / PhonePe / Paytm / Bank)", width / 2, footerY + 44);
}

/**
 * Convert Canvas to PNG Blob
 */
export function getReceiptCardBlob(canvas) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, "image/png", 1.0);
    });
}

/**
 * 1-Tap Direct Download
 */
export function downloadReceiptCard(canvas, friendName = "Friend") {
    if (!canvas) return;
    const safeName = friendName.replace(/[^a-zA-Z0-9]/g, "_");
    const link = document.createElement("a");
    link.download = `Kharchee_Receipt_${safeName}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
