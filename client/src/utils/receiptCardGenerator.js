/**
 * Kharchee - Executive Visual Receipt & Statement Card Generator
 * High-Definition Compact Fintech Card (Apple Card / Revolut / CRED Style)
 * Optimized for perfect viewport fit and crisp readability.
 */

export function drawReceiptCard(canvas, { friend, userName = "User", theme = "dark" }) {
    if (!canvas || !friend) return;

    const ctx = canvas.getContext("2d");
    // Compact, balanced 4:5 golden ratio dimensions
    const width = 680;
    const height = 820;
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
        ctx.arcTo(x, y + x, y, r);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    // 1. BACKGROUND
    if (isDark) {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#0e1322");
        bgGrad.addColorStop(0.5, "#131a2e");
        bgGrad.addColorStop(1, "#0a0e1a");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Ambient Glow Highlights
        const glow1 = ctx.createRadialGradient(100, 80, 10, 100, 80, 300);
        glow1.addColorStop(0, "rgba(99, 102, 241, 0.22)");
        glow1.addColorStop(1, "rgba(99, 102, 241, 0)");
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, width, height);

        const glow2 = ctx.createRadialGradient(580, 240, 10, 580, 240, 260);
        glow2.addColorStop(0, "rgba(16, 185, 129, 0.16)");
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

        const glow = ctx.createRadialGradient(340, 150, 10, 340, 150, 350);
        glow.addColorStop(0, "rgba(99, 102, 241, 0.08)");
        glow.addColorStop(1, "rgba(99, 102, 241, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
    }

    // Outer Card Frame
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(226, 232, 240, 1)";
    ctx.lineWidth = 2;
    roundRect(ctx, 20, 20, width - 40, height - 40, 24, false, true);

    // 2. HEADER
    // Brand Badge
    const brandGrad = ctx.createLinearGradient(42, 42, 86, 86);
    brandGrad.addColorStop(0, "#6366f1");
    brandGrad.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = brandGrad;
    roundRect(ctx, 42, 40, 44, 44, 12, true, false);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚡", 64, 71);

    // Brand Name & Tagline
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
    ctx.font = "800 22px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("KHARCHEE", 98, 62);

    ctx.fillStyle = isDark ? "#818cf8" : "#6366f1";
    ctx.font = "700 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("PAYMENT STATEMENT SLIP", 100, 78);

    // Ref & Date Badge (Top Right)
    ctx.textAlign = "right";
    ctx.fillStyle = isDark ? "#818cf8" : "#4f46e5";
    ctx.font = "800 13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(refCode, width - 42, 60);

    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`${dateFormatted} • ${timeFormatted}`, width - 42, 78);

    // 3. RECIPIENT & SENDER PARTY META ROW
    const partyY = 104;
    ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.7)" : "#ffffff";
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 42, partyY, width - 84, 68, 14, true, true);

    // Billed To (Left)
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "700 10px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("STATEMENT FOR / BILLED TO", 60, partyY + 24);

    ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
    ctx.font = "800 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(friendName, 60, partyY + 48);

    // Issued By (Right)
    ctx.textAlign = "right";
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "700 10px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("ISSUED BY", width - 60, partyY + 24);

    ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
    ctx.font = "800 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(userName, width - 60, partyY + 48);

    // 4. HERO STATEMENT AMOUNT BOX
    const heroY = 188;
    const heroHeight = 126;
    const heroGrad = ctx.createLinearGradient(42, heroY, width - 42, heroY + heroHeight);

    if (isDark) {
        if (isLoss) {
            heroGrad.addColorStop(0, "rgba(239, 68, 68, 0.16)");
            heroGrad.addColorStop(1, "rgba(239, 68, 68, 0.04)");
        } else if (isZero) {
            heroGrad.addColorStop(0, "rgba(148, 163, 184, 0.12)");
            heroGrad.addColorStop(1, "rgba(148, 163, 184, 0.04)");
        } else {
            heroGrad.addColorStop(0, "rgba(16, 185, 129, 0.18)");
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
        ? "rgba(239, 68, 68, 0.4)"
        : isZero
        ? "rgba(148, 163, 184, 0.4)"
        : "rgba(16, 185, 129, 0.4)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 42, heroY, width - 84, heroHeight, 18, true, true);

    // Hero Label
    ctx.textAlign = "left";
    ctx.fillStyle = isLoss ? "#ef4444" : isZero ? "#64748b" : "#10b981";
    ctx.font = "800 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(
        isLoss ? "● TOTAL AMOUNT OWED" : isZero ? "● BALANCE SETTLED" : "● TOTAL AMOUNT DUE",
        64,
        heroY + 32
    );

    // Big Amount Figure
    ctx.fillStyle = isLoss ? "#ef4444" : isZero ? (isDark ? "#94a3b8" : "#64748b") : "#10b981";
    ctx.font = "900 46px 'Plus Jakarta Sans', sans-serif";
    const amountStr = `₹ ${Math.abs(currentAmount).toLocaleString("en-IN")}`;
    ctx.fillText(amountStr, 62, heroY + 86);

    // Status Tag Pill (Right side)
    const statusText = isLoss ? "YOU OWE" : isZero ? "SETTLED" : "PENDING PAYMENT";
    ctx.font = "800 11px 'Plus Jakarta Sans', sans-serif";
    const statusWidth = ctx.measureText(statusText).width + 20;
    const pillX = width - 64 - statusWidth;
    const pillY = heroY + 54;

    ctx.fillStyle = isLoss
        ? "rgba(239, 68, 68, 0.18)"
        : isZero
        ? "rgba(148, 163, 184, 0.18)"
        : "rgba(16, 185, 129, 0.18)";
    roundRect(ctx, pillX, pillY, statusWidth, 30, 15, true, false);

    ctx.textAlign = "center";
    ctx.fillStyle = isLoss ? "#ef4444" : isZero ? "#64748b" : "#10b981";
    ctx.fillText(statusText, pillX + statusWidth / 2, pillY + 19);

    // 5. ITEMIZED RECENT TRANSACTIONS
    const ledgerY = 340;
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
    ctx.font = "800 15px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Recent Shared Ledger Activity", 46, ledgerY);

    ctx.textAlign = "right";
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Total Entries: ${history.length}`, width - 46, ledgerY);

    // Transaction rows container
    const listTop = ledgerY + 12;
    const displayTxns = history.slice(0, 3);

    if (displayTxns.length === 0) {
        ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.5)" : "#ffffff";
        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(226, 232, 240, 0.8)";
        roundRect(ctx, 42, listTop, width - 84, 90, 14, true, true);

        ctx.textAlign = "center";
        ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
        ctx.font = "600 13px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("No transactions recorded yet in ledger.", width / 2, listTop + 50);
    } else {
        displayTxns.forEach((txn, idx) => {
            const rowY = listTop + idx * 56;
            const isRowLoss = Number(txn.amount) < 0;
            const amt = Number(txn.amount) || 0;
            const d = txn.date ? new Date(txn.date) : new Date();
            const dateStr = !isNaN(d.getTime())
                ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : "Recent";

            // Row Card Background
            ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.65)" : "#ffffff";
            ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(226, 232, 240, 0.8)";
            ctx.lineWidth = 1;
            roundRect(ctx, 42, rowY, width - 84, 48, 12, true, true);

            // Date Badge
            ctx.fillStyle = isDark ? "rgba(99, 102, 241, 0.14)" : "rgba(99, 102, 241, 0.08)";
            roundRect(ctx, 54, rowY + 9, 62, 30, 8, true, false);

            ctx.textAlign = "center";
            ctx.fillStyle = isDark ? "#818cf8" : "#4f46e5";
            ctx.font = "800 11px 'Plus Jakarta Sans', sans-serif";
            ctx.fillText(dateStr, 85, rowY + 28);

            // Description / Note
            ctx.textAlign = "left";
            ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
            ctx.font = "700 13px 'Plus Jakarta Sans', sans-serif";
            const noteText = txn.description || "General Shared Expense";
            const truncatedNote = noteText.length > 30 ? noteText.slice(0, 28) + "..." : noteText;
            ctx.fillText(truncatedNote, 126, rowY + 30);

            // Amount
            ctx.textAlign = "right";
            ctx.fillStyle = isRowLoss ? "#ef4444" : "#10b981";
            ctx.font = "800 15px 'Plus Jakarta Sans', sans-serif";
            ctx.fillText(`${isRowLoss ? "-" : "+"}₹${Math.abs(amt).toLocaleString("en-IN")}`, width - 58, rowY + 30);
        });
    }

    // 6. TOTALS SUMMARY FOOTER BAR
    const summaryY = displayTxns.length === 0 ? listTop + 104 : listTop + displayTxns.length * 56 + 12;
    ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(241, 245, 249, 0.9)";
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)";
    roundRect(ctx, 42, summaryY, width - 84, 68, 14, true, true);

    const colW = (width - 84) / 3;

    // Col 1: Total Received
    ctx.textAlign = "center";
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "700 10px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("TOTAL RECEIVED", 42 + colW * 0.5, summaryY + 24);
    ctx.fillStyle = "#10b981";
    ctx.font = "800 15px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`+₹${totalGiven.toLocaleString("en-IN")}`, 42 + colW * 0.5, summaryY + 48);

    // Col 2: Total Paid
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "700 10px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("TOTAL PAID", 42 + colW * 1.5, summaryY + 24);
    ctx.fillStyle = "#ef4444";
    ctx.font = "800 15px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`-₹${totalTaken.toLocaleString("en-IN")}`, 42 + colW * 1.5, summaryY + 48);

    // Col 3: Net Ledger Status
    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "700 10px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("NET BALANCE", 42 + colW * 2.5, summaryY + 24);
    ctx.fillStyle = isLoss ? "#ef4444" : isZero ? (isDark ? "#94a3b8" : "#64748b") : "#10b981";
    ctx.font = "800 15px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(
        `${isLoss ? "-" : isZero ? "" : "+"}₹${Math.abs(currentAmount).toLocaleString("en-IN")}`,
        42 + colW * 2.5,
        summaryY + 48
    );

    // 7. EXECUTIVE TRUST SEAL
    const footerY = summaryY + 96;
    ctx.textAlign = "center";
    ctx.fillStyle = isDark ? "#818cf8" : "#4f46e5";
    ctx.font = "800 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("🔒 Kharchee Verified Digital Statement", width / 2, footerY);

    ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
    ctx.font = "500 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Smart Split & Expense Tracking • kharchee.vercel.app", width / 2, footerY + 18);
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
