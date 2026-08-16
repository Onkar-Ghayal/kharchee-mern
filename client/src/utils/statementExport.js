/**
 * Kharchee - Friend Transaction Statement Generator (PDF & CSV Export)
 */

export function exportToCSV(friend) {
    if (!friend || !friend.history || friend.history.length === 0) return;

    const headers = ["Index", "Date", "Time", "Type", "Description", "Amount (INR)"];
    const rows = friend.history.map((h, i) => {
        const d = new Date(h.date);
        const dateStr = d.toLocaleDateString("en-IN");
        const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        const typeStr = h.type || (h.amount < 0 ? "Debit" : "Credit");
        const descStr = `"${(h.description || "N/A").replace(/"/g, '""')}"`;
        const amtStr = (h.amount < 0 ? `-${Math.abs(h.amount)}` : `+${h.amount}`);

        return [i + 1, dateStr, timeStr, typeStr, descStr, amtStr].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const safeName = (friend.name || "friend").replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("download", `Kharchee_Statement_${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportToPDF(friend, userName = "User") {
    if (!friend) return;

    const printWindow = window.open("", "_blank", "width=850,height=1000");
    if (!printWindow) {
        alert("Please allow popups to download/print the statement PDF");
        return;
    }

    const history = friend.history || [];
    const isLoss = friend.currentAmount < 0;
    const isZero = friend.currentAmount === 0;

    let totalGiven = 0;
    let totalTaken = 0;

    history.forEach((h) => {
        if (h.amount > 0) totalGiven += h.amount;
        else totalTaken += Math.abs(h.amount);
    });

    const rowsHtml = history.length > 0
        ? history.map((h, index) => {
            const d = new Date(h.date);
            const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
            const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
            const isNegative = h.amount < 0;

            return `
                <tr>
                    <td style="text-align: center; color: #64748b;">${index + 1}</td>
                    <td>
                        <div style="font-weight: 600; color: #1e293b;">${dateStr}</div>
                        <div style="font-size: 11px; color: #94a3b8;">${timeStr}</div>
                    </td>
                    <td style="color: #334155;">${h.description || "Direct Transaction"}</td>
                    <td style="text-align: center;">
                        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; ${h.type === 'payment' ? 'background: #e0e7ff; color: #4338ca;' : 'background: #f1f5f9; color: #475569;'}">
                            ${h.type || (isNegative ? 'Debit' : 'Credit')}
                        </span>
                    </td>
                    <td style="text-align: right; font-weight: 800; font-size: 14px; color: ${isNegative ? '#ef4444' : '#10b981'};">
                        ${isNegative ? '-' : '+'}₹${Math.abs(h.amount).toLocaleString('en-IN')}
                    </td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #94a3b8;">No transaction history found</td></tr>`;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Kharchee Statement - ${friend.name}</title>
            <meta charset="utf-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
                body { padding: 40px; background: #ffffff; color: #0f172a; font-size: 13px; line-height: 1.5; }
                
                .header-table { width: 100%; margin-bottom: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                .logo-title { font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.03em; }
                .statement-badge { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                
                .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
                .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px 18px; }
                .meta-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
                .meta-val { font-size: 14px; font-weight: 700; color: #0f172a; }
                .meta-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
                
                .summary-banner { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
                .sum-box { border-radius: 10px; padding: 14px 16px; border: 1px solid #e2e8f0; background: #ffffff; }
                .sum-box.net-box { background: ${isLoss ? '#fef2f2' : isZero ? '#f8fafc' : '#f0fdf4'}; border-color: ${isLoss ? '#fecaca' : isZero ? '#e2e8f0' : '#bbf7d0'}; }
                .sum-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
                .sum-val { font-size: 18px; font-weight: 800; }
                .sum-val.green { color: #10b981; }
                .sum-val.red { color: #ef4444; }
                
                table.txn-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
                table.txn-table th { background: #f1f5f9; padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 1.5px solid #cbd5e1; }
                table.txn-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
                table.txn-table tr:nth-child(even) td { background: #fafbfc; }
                
                .footer { border-top: 1px solid #e2e8f0; padding-top: 18px; display: flex; justify-content: space-between; align-items: center; color: #94a3b8; font-size: 11px; }
                
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td>
                        <div class="logo-title">KHARCHEE</div>
                        <div class="statement-badge">Individual Friend Statement</div>
                    </td>
                    <td style="text-align: right;">
                        <div style="font-weight: 700; color: #0f172a;">Generated On: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
                        <div style="font-size: 12px; color: #64748b;">Time: ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                </tr>
            </table>

            <div class="meta-grid">
                <div class="meta-card">
                    <div class="meta-label">Account Holder</div>
                    <div class="meta-val">${userName}</div>
                    <div class="meta-sub">Kharchee Smart Expense Ledger</div>
                </div>
                <div class="meta-card">
                    <div class="meta-label">Friend / Contact</div>
                    <div class="meta-val">${friend.name}</div>
                    <div class="meta-sub">${friend.mobile ? `+91 ${friend.mobile}` : 'No phone attached'}${friend.upiId ? ` • ${friend.upiId}` : ''}</div>
                </div>
            </div>

            <div class="summary-banner">
                <div class="sum-box">
                    <div class="sum-title">Total You Will Get</div>
                    <div class="sum-val green">+₹${totalGiven.toLocaleString("en-IN")}</div>
                </div>
                <div class="sum-box">
                    <div class="sum-title">Total You Owe</div>
                    <div class="sum-val red">-₹${totalTaken.toLocaleString("en-IN")}</div>
                </div>
                <div class="sum-box net-box">
                    <div class="sum-title">Net Balance Status</div>
                    <div class="sum-val ${isLoss ? 'red' : isZero ? '' : 'green'}">
                        ${isLoss ? 'You Owe ' : isZero ? 'Settled ' : 'You Will Get '}₹${Math.abs(friend.currentAmount).toLocaleString("en-IN")}
                    </div>
                </div>
            </div>

            <table class="txn-table">
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;">#</th>
                        <th style="width: 140px; text-align: left;">Date & Time</th>
                        <th style="text-align: left;">Description / Note</th>
                        <th style="width: 110px; text-align: center;">Type</th>
                        <th style="width: 120px; text-align: right;">Amount (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="footer">
                <div>Kharchee Expense Management & Split Ledger System</div>
                <div>Page 1 of 1</div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
