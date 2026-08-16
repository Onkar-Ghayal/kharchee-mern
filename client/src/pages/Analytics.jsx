import { useEffect, useRef, useState, useMemo } from "react";
import Chart from "chart.js/auto";
import Header from "../components/Header";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import "../styles/analytics.css";

function formatCurrency(num) {
    if (isNaN(num)) return "₹0";
    return "₹" + Number(num).toLocaleString("en-IN");
}

export default function Analytics() {
    const [allFriends, setAllFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("all"); // "7days" | "30days" | "12months" | "all"

    const { showToast } = useToast();

    // Chart Canvas References
    const timelineCanvasRef = useRef(null);
    const donutCanvasRef = useRef(null);
    const friendsCanvasRef = useRef(null);
    const volumeCanvasRef = useRef(null);

    // Chart Instances
    const timelineChartRef = useRef(null);
    const donutChartRef = useRef(null);
    const friendsChartRef = useRef(null);
    const volumeChartRef = useRef(null);

    // Fetch friend data
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await api.get("/friends");
                setAllFriends(res.data || []);
            } catch {
                showToast("Failed to load analytics data", "error");
            } finally {
                setLoading(false);
            }
        })();
    }, [showToast]);

    // Compute Filtered Metrics
    const metrics = useMemo(() => {
        let totalGiven = 0;
        let totalTaken = 0;
        let totalTransactions = 0;
        let settlementCount = 0;
        let billsPaidCount = 0;
        let totalBillsPaidAmount = 0;
        let billsSplitCount = 0;
        let totalBillsSplitAmount = 0;

        const now = new Date();
        const cutoffDays =
            timeframe === "7days"
                ? 7
                : timeframe === "30days"
                ? 30
                : timeframe === "12months"
                ? 365
                : Infinity;

        // Friend aggregates for horizontal bar chart
        const friendBalances = {};

        // Timeline buckets
        let timelineLabels = [];
        let lentData = [];
        let borrowedData = [];

        if (timeframe === "7days") {
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                timelineLabels.push(`${days[d.getDay()]} (${d.getDate()}/${d.getMonth() + 1})`);
            }
            lentData = new Array(7).fill(0);
            borrowedData = new Array(7).fill(0);
        } else if (timeframe === "30days") {
            for (let i = 29; i >= 0; i -= 3) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                timelineLabels.push(`${d.getDate()}/${d.getMonth() + 1}`);
            }
            lentData = new Array(timelineLabels.length).fill(0);
            borrowedData = new Array(timelineLabels.length).fill(0);
        } else if (timeframe === "12months" || timeframe === "all") {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            timelineLabels = [...months];
            lentData = new Array(12).fill(0);
            borrowedData = new Array(12).fill(0);
        }

        allFriends.forEach((friend) => {
            let friendSum = 0;

            (friend.history || []).forEach((h) => {
                const txDate = new Date(h.date || friend.updatedAt);
                const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);

                if (diffDays > cutoffDays) return;

                totalTransactions += 1;
                const amount = Number(h.amount) || 0;
                friendSum += amount;

                if (h.type === "settlement") {
                    settlementCount += 1;
                }

                // Track Bills Paid (UPI payments & settlements)
                const isPayment = h.type === "payment" || h.type === "settlement" || (h.description && /paid via|payment|settle/i.test(h.description));
                if (isPayment) {
                    billsPaidCount += 1;
                    totalBillsPaidAmount += Math.abs(amount);
                }

                // Track Group Bills Split
                const isSplit = h.description && /split/i.test(h.description);
                if (isSplit) {
                    billsSplitCount += 1;
                    totalBillsSplitAmount += Math.abs(amount);
                }

                if (amount > 0) {
                    totalGiven += amount;
                } else if (amount < 0) {
                    totalTaken += Math.abs(amount);
                }

                // Bucket timeline
                if (timeframe === "7days") {
                    const dayIdx = 6 - Math.floor(diffDays);
                    if (dayIdx >= 0 && dayIdx < 7) {
                        if (amount > 0) lentData[dayIdx] += amount;
                        else borrowedData[dayIdx] += Math.abs(amount);
                    }
                } else if (timeframe === "30days") {
                    const bucketIdx = Math.min(
                        timelineLabels.length - 1,
                        Math.max(0, Math.floor((30 - diffDays) / 3))
                    );
                    if (amount > 0) lentData[bucketIdx] += amount;
                    else borrowedData[bucketIdx] += Math.abs(amount);
                } else {
                    const monthIdx = txDate.getMonth();
                    if (amount > 0) lentData[monthIdx] += amount;
                    else borrowedData[monthIdx] += Math.abs(amount);
                }
            });

            if (friendSum !== 0) {
                friendBalances[friend.name] = friendSum;
            }
        });

        // Top friends sorted by balance magnitude
        const sortedFriends = Object.entries(friendBalances)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .slice(0, 6);

        const netBalance = totalGiven - totalTaken;
        const settlementRate =
            totalTransactions > 0 ? Math.round((settlementCount / totalTransactions) * 100) : 0;

        return {
            totalGiven,
            totalTaken,
            netBalance,
            totalTransactions,
            settlementRate,
            billsPaidCount,
            totalBillsPaidAmount,
            billsSplitCount,
            totalBillsSplitAmount,
            timelineLabels,
            lentData,
            borrowedData,
            sortedFriends
        };
    }, [allFriends, timeframe]);

    // Render Charts on Metrics Change
    useEffect(() => {
        if (loading) return;

        const isDarkMode = document.body.classList.contains("dark-mode");
        const textColor = isDarkMode ? "#cbd5e1" : "#475569";
        const gridColor = isDarkMode ? "rgba(51, 65, 85, 0.4)" : "rgba(226, 232, 240, 0.8)";

        // 1. CASH FLOW TIMELINE CHART
        if (timelineCanvasRef.current) {
            if (timelineChartRef.current) timelineChartRef.current.destroy();
            timelineChartRef.current = new Chart(timelineCanvasRef.current, {
                type: "line",
                data: {
                    labels: metrics.timelineLabels,
                    datasets: [
                        {
                            label: "You Will Get",
                            data: metrics.lentData,
                            borderColor: "#10b981",
                            backgroundColor: "rgba(16, 185, 129, 0.12)",
                            fill: true,
                            tension: 0.35,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: "You Owe",
                            data: metrics.borrowedData,
                            borderColor: "#ef4444",
                            backgroundColor: "rgba(239, 68, 68, 0.12)",
                            fill: true,
                            tension: 0.35,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "top", labels: { color: textColor, font: { weight: "600" } } }
                    },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor } }
                    }
                }
            });
        }

        // 2. RATIO DONUT CHART
        if (donutCanvasRef.current) {
            if (donutChartRef.current) donutChartRef.current.destroy();
            const hasData = metrics.totalGiven > 0 || metrics.totalTaken > 0;
            donutChartRef.current = new Chart(donutCanvasRef.current, {
                type: "doughnut",
                data: {
                    labels: ["You Will Get", "You Owe"],
                    datasets: [
                        {
                            data: hasData ? [metrics.totalGiven, metrics.totalTaken] : [1, 1],
                            backgroundColor: hasData ? ["#10b981", "#ef4444"] : ["#94a3b8", "#cbd5e1"],
                            borderWidth: 2,
                            borderColor: isDarkMode ? "#1e293b" : "#ffffff"
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "68%",
                    plugins: {
                        legend: { position: "bottom", labels: { color: textColor } }
                    }
                }
            });
        }

        // 3. TOP FRIENDS HORIZONTAL BAR
        if (friendsCanvasRef.current) {
            if (friendsChartRef.current) friendsChartRef.current.destroy();
            const friendLabels = metrics.sortedFriends.map((f) => f[0]);
            const friendValues = metrics.sortedFriends.map((f) => f[1]);
            const bgColors = friendValues.map((v) => (v >= 0 ? "#10b981" : "#ef4444"));

            friendsChartRef.current = new Chart(friendsCanvasRef.current, {
                type: "bar",
                data: {
                    labels: friendLabels.length > 0 ? friendLabels : ["No active friend data"],
                    datasets: [
                        {
                            label: "Net Balance (₹)",
                            data: friendValues.length > 0 ? friendValues : [0],
                            backgroundColor: bgColors,
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor } }
                    }
                }
            });
        }

        // 4. NET CASH FLOW BARS
        if (volumeCanvasRef.current) {
            if (volumeChartRef.current) volumeChartRef.current.destroy();
            const netFlow = metrics.lentData.map((lent, i) => lent - (metrics.borrowedData[i] || 0));

            volumeChartRef.current = new Chart(volumeCanvasRef.current, {
                type: "bar",
                data: {
                    labels: metrics.timelineLabels,
                    datasets: [
                        {
                            label: "Net Flow",
                            data: netFlow,
                            backgroundColor: netFlow.map((v) => (v >= 0 ? "#6366f1" : "#f59e0b")),
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor } }
                    }
                }
            });
        }
    }, [metrics, loading]);

    // CSV Export Handler
    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Friend Name,Amount (INR),Type,Description,Date\n";

        allFriends.forEach((friend) => {
            (friend.history || []).forEach((h) => {
                const date = new Date(h.date).toISOString().split("T")[0];
                const desc = (h.description || "").replace(/,/g, " ");
                csvContent += `"${friend.name}",${h.amount},"${h.type}","${desc}","${date}"\n`;
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `kharchee_analytics_${timeframe}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("CSV report downloaded successfully!", "success");
    };

    // Dynamic Financial Summary Advice
    const insightText = useMemo(() => {
        const { netBalance, totalGiven, totalTaken, billsPaidCount, billsSplitCount } = metrics;
        if (totalGiven === 0 && totalTaken === 0 && billsPaidCount === 0 && billsSplitCount === 0) {
            return "No financial activity recorded in this period. Add friends, split bills, and record transactions from your dashboard to see live insights.";
        }

        let extraNote = "";
        if (billsSplitCount > 0 || billsPaidCount > 0) {
            extraNote = ` You have split ${billsSplitCount} group ${billsSplitCount === 1 ? "bill" : "bills"} and completed ${billsPaidCount} ${billsPaidCount === 1 ? "payment" : "payments"}.`;
        }

        if (netBalance > 0) {
            return `You are in a positive financial position with +${formatCurrency(
                netBalance
            )} net balance. Friends currently owe you more than you owe them.${extraNote}`;
        }
        if (netBalance < 0) {
            return `You have a net outstanding dues of -${formatCurrency(
                Math.abs(netBalance)
            )}. Consider settling balances with your friends to stay clear.${extraNote}`;
        }
        return `Your lending and borrowing are perfectly balanced at ₹0 net difference.${extraNote}`;
    }, [metrics]);

    return (
        <div className="analytics-page-wrapper">
            <Header variant="back" />

            <main className="analytics-container">
                {/* Header Row */}
                <div className="analytics-header-row">
                    <div>
                        <h1 className="analytics-title">Financial Analytics & Insights</h1>
                        <p className="analytics-subtitle">Track cashflow velocity, friend balances, and settlement rates</p>
                    </div>

                    <div className="analytics-actions-group">
                        {/* Timeframe Selector */}
                        <div className="timeframe-tabs">
                            <button
                                className={`timeframe-tab ${timeframe === "7days" ? "active" : ""}`}
                                onClick={() => setTimeframe("7days")}
                            >
                                7 Days
                            </button>
                            <button
                                className={`timeframe-tab ${timeframe === "30days" ? "active" : ""}`}
                                onClick={() => setTimeframe("30days")}
                            >
                                30 Days
                            </button>
                            <button
                                className={`timeframe-tab ${timeframe === "12months" ? "active" : ""}`}
                                onClick={() => setTimeframe("12months")}
                            >
                                12 Months
                            </button>
                            <button
                                className={`timeframe-tab ${timeframe === "all" ? "active" : ""}`}
                                onClick={() => setTimeframe("all")}
                            >
                                All Time
                            </button>
                        </div>

                        {/* Export Button */}
                        <button className="btn-export-csv" onClick={handleExportCSV}>
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="kpi-grid">
                    <div className="kpi-card lent">
                        <div className="kpi-icon-pill">↗</div>
                        <span className="kpi-label">Total You Will Get</span>
                        <h3 className="kpi-value text-success">{formatCurrency(metrics.totalGiven)}</h3>
                    </div>

                    <div className="kpi-card borrowed">
                        <div className="kpi-icon-pill">↘</div>
                        <span className="kpi-label">Total You Owe</span>
                        <h3 className="kpi-value text-danger">{formatCurrency(metrics.totalTaken)}</h3>
                    </div>

                    <div className="kpi-card net">
                        <div className="kpi-icon-pill">⇄</div>
                        <span className="kpi-label">Net Balance</span>
                        <h3
                            className={`kpi-value ${
                                metrics.netBalance >= 0 ? "text-success" : "text-danger"
                            }`}
                        >
                            {metrics.netBalance >= 0 ? "+" : "-"}
                            {formatCurrency(Math.abs(metrics.netBalance))}
                        </h3>
                    </div>

                    <div className="kpi-card paid">
                        <div className="kpi-icon-pill">💳</div>
                        <span className="kpi-label">Bills Paid</span>
                        <h3 className="kpi-value">{metrics.billsPaidCount}</h3>
                        <span className="kpi-sub">Total {formatCurrency(metrics.totalBillsPaidAmount)}</span>
                    </div>

                    <div className="kpi-card split">
                        <div className="kpi-icon-pill">⚡</div>
                        <span className="kpi-label">Bills Split</span>
                        <h3 className="kpi-value">{metrics.billsSplitCount}</h3>
                        <span className="kpi-sub">Total {formatCurrency(metrics.totalBillsSplitAmount)}</span>
                    </div>

                    <div className="kpi-card stat">
                        <div className="kpi-icon-pill">📝</div>
                        <span className="kpi-label">Total Transactions</span>
                        <h3 className="kpi-value">{metrics.totalTransactions}</h3>
                        <span className="kpi-sub">{metrics.settlementRate}% Settled</span>
                    </div>
                </div>

                {/* AI / Smart Financial Insight Card */}
                <div className="insight-card">
                    <div className="insight-card-header">
                        <span className="insight-badge">Financial Insight</span>
                        <span className="insight-period">Mode: {timeframe.toUpperCase()}</span>
                    </div>
                    <p className="insight-body">{insightText}</p>
                </div>

                {/* Visual Charts Grid */}
                <div className="charts-grid-layout">
                    {/* Chart 1: Cash Flow Timeline */}
                    <div className="chart-panel large">
                        <div className="panel-header">
                            <h3>Cash Flow Velocity (Lent vs Borrowed)</h3>
                            <span className="panel-hint">Trends over selected period</span>
                        </div>
                        <div className="chart-canvas-wrapper">
                            <canvas ref={timelineCanvasRef}></canvas>
                        </div>
                    </div>

                    {/* Chart 2: Lending Ratio */}
                    <div className="chart-panel">
                        <div className="panel-header">
                            <h3>Lending vs Borrowing Ratio</h3>
                            <span className="panel-hint">Volume proportion</span>
                        </div>
                        <div className="chart-canvas-wrapper donut-wrap">
                            <canvas ref={donutCanvasRef}></canvas>
                        </div>
                    </div>

                    {/* Chart 3: Top Friends Balances */}
                    <div className="chart-panel">
                        <div className="panel-header">
                            <h3>Top Friend Balances</h3>
                            <span className="panel-hint">Highest standing debts</span>
                        </div>
                        <div className="chart-canvas-wrapper">
                            <canvas ref={friendsCanvasRef}></canvas>
                        </div>
                    </div>

                    {/* Chart 4: Net Flow Bars */}
                    <div className="chart-panel large">
                        <div className="panel-header">
                            <h3>Periodic Net Flow</h3>
                            <span className="panel-hint">Positive vs Negative Balance Distribution</span>
                        </div>
                        <div className="chart-canvas-wrapper">
                            <canvas ref={volumeCanvasRef}></canvas>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
