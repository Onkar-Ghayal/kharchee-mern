import { Link } from "react-router-dom";
import Header from "../components/Header";
import "../styles/home.css";

export default function Home() {
    return (
        <div className="home-wrapper">
            <Header variant="public" />

            {/* ================= HERO SECTION ================= */}
            <section className="hero-section">
                <div className="hero-glow-sphere"></div>
                <div className="hero-glow-sphere secondary"></div>

                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        Smart Money Tracking for Everyday Life
                    </div>

                    <h1 className="hero-title">
                        Track Money with Friends. <br />
                        <span className="hero-gradient-text">Without Confusion.</span>
                    </h1>

                    <p className="hero-description">
                        kharchee helps you easily track money you give or take from friends,
                        with history, descriptions, and clarity — all in one place.
                    </p>

                    <div className="hero-cta-group">
                        <Link to="/register" className="btn-primary-cta">
                            Get Started Free
                        </Link>
                        <a href="#how-it-works" className="btn-secondary-cta">
                            How It Works
                        </a>
                    </div>
                </div>

                {/* Hero Interactive CSS Mockup Banner */}
                <div className="hero-mockup-wrapper">
                    <div className="hero-mockup-card">
                        <div className="mockup-header-bar">
                            <div className="mockup-dots">
                                <span className="dot red"></span>
                                <span className="dot yellow"></span>
                                <span className="dot green"></span>
                            </div>
                            <span className="mockup-tag">kharchee Live Preview</span>
                        </div>
                        <div className="hero-mockup-body">
                            <div className="mockup-summary-mini">
                                <div className="mini-stat">
                                    <span className="mini-label">You Will Get</span>
                                    <span className="mini-val green">+₹ 2,450</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-label">You Owe</span>
                                    <span className="mini-val red">-₹ 600</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-label">Net Balance</span>
                                    <span className="mini-val purple">+₹ 1,850</span>
                                </div>
                            </div>

                            <div className="mockup-friends-mini">
                                <div className="mini-friend-row">
                                    <div className="mini-friend-avatar">R</div>
                                    <div className="mini-friend-details">
                                        <strong>Rahul Sharma</strong>
                                        <small>Dinner & Cab share</small>
                                    </div>
                                    <span className="mini-badge-green">You will get ₹850</span>
                                </div>
                                <div className="mini-friend-row">
                                    <div className="mini-friend-avatar orange">A</div>
                                    <div className="mini-friend-details">
                                        <strong>Amit Verma</strong>
                                        <small>Movie ticket</small>
                                    </div>
                                    <span className="mini-badge-red">You owe ₹300</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= TRUST STRIP ================= */}
            <section className="trust-strip">
                <div className="trust-container">
                    <span className="trust-item"><span className="check-mark">✔</span> Simple & Fast</span>
                    <span className="trust-divider">•</span>
                    <span className="trust-item"><span className="check-mark">✔</span> Secure & Private</span>
                    <span className="trust-divider">•</span>
                    <span className="trust-item"><span className="check-mark">✔</span> Built for Students & Daily Use</span>
                </div>
            </section>

            {/* ================= WHY KHARCHEE ================= */}
            <section className="about-section" id="about">
                <div className="section-container">
                    <div className="about-card">
                        <div className="about-badge">Why kharchee?</div>
                        <h2 className="section-title">Never Forget a Shared Expense Again</h2>
                        <p className="about-text">
                            We all lend and borrow money with friends — for tea, travel, food, or emergencies.
                            kharchee is built to remove confusion, awkward reminders, and forgotten payments.
                            Every transaction is saved with timestamps, amounts, and optional descriptions so you always stay clear.
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= HOW IT WORKS ================= */}
            <section className="how-it-works-section" id="how-it-works">
                <div className="section-container">
                    <div className="section-header">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">Three simple steps to keep your financial ledger clear</p>
                    </div>

                    <div className="steps-container">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <h3>Add a Friend</h3>
                            <p>Add friends you frequently exchange money with in just one tap.</p>
                        </div>

                        <div className="step-connector"></div>

                        <div className="step-card">
                            <div className="step-number">2</div>
                            <h3>Record Transactions</h3>
                            <p>Track who you will get money from and who you owe with notes for food, travel, or bills.</p>
                        </div>

                        <div className="step-connector"></div>

                        <div className="step-card">
                            <div className="step-number">3</div>
                            <h3>View History & Settle</h3>
                            <p>See your complete transaction timeline anytime and settle up in one click.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= APP PREVIEW (CSS MOCKUPS) ================= */}
            <section className="preview-section" id="preview">
                <div className="section-container">
                    <div className="section-header">
                        <h2 className="section-title">App Preview</h2>
                        <p className="section-subtitle">Clean, intuitive, and designed for lightning speed</p>
                    </div>

                    <div className="preview-grid">
                        {/* Preview 1: Dashboard Friend Card */}
                        <div className="preview-mockup-card">
                            <div className="mockup-header-bar">
                                <div className="mockup-dots">
                                    <span className="dot red"></span>
                                    <span className="dot yellow"></span>
                                    <span className="dot green"></span>
                                </div>
                                <span className="mockup-tag">Dashboard</span>
                            </div>
                            <div className="mockup-inner-content">
                                <div className="demo-friend-card">
                                    <div className="demo-card-top">
                                        <div className="demo-avatar">R</div>
                                        <div>
                                            <div className="demo-friend-name">Rahul Sharma</div>
                                            <div className="demo-status positive">You will get: +₹850</div>
                                        </div>
                                    </div>
                                    <div className="demo-actions-row">
                                        <span className="demo-btn-sm primary">+ Add Amount</span>
                                        <span className="demo-btn-sm">Settle</span>
                                        <span className="demo-btn-sm">History</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mockup-caption-box">
                                <h4>Clean Friend Balances</h4>
                                <p>Instant visibility of who owes what with clean color-coded badges.</p>
                            </div>
                        </div>

                        {/* Preview 2: Add Transaction */}
                        <div className="preview-mockup-card">
                            <div className="mockup-header-bar">
                                <div className="mockup-dots">
                                    <span className="dot red"></span>
                                    <span className="dot yellow"></span>
                                    <span className="dot green"></span>
                                </div>
                                <span className="mockup-tag">Record Entry</span>
                            </div>
                            <div className="mockup-inner-content">
                                <div className="demo-form-mockup">
                                    <div className="demo-input-box">Amount: ₹ 350</div>
                                    <div className="demo-type-pill-group">
                                        <span className="demo-pill active-gain">You Will Get</span>
                                        <span className="demo-pill">You Owe</span>
                                    </div>
                                    <div className="demo-input-box">Note: Dinner & Snacks</div>
                                    <div className="demo-submit-btn">Save Entry</div>
                                </div>
                            </div>
                            <div className="mockup-caption-box">
                                <h4>Easy Transactions</h4>
                                <p>Record lending or borrowing with custom notes in seconds.</p>
                            </div>
                        </div>

                        {/* Preview 3: History Timeline */}
                        <div className="preview-mockup-card">
                            <div className="mockup-header-bar">
                                <div className="mockup-dots">
                                    <span className="dot red"></span>
                                    <span className="dot yellow"></span>
                                    <span className="dot green"></span>
                                </div>
                                <span className="mockup-tag">History Log</span>
                            </div>
                            <div className="mockup-inner-content">
                                <div className="demo-history-list">
                                    <div className="demo-history-item">
                                        <div className="demo-history-left">
                                            <span className="demo-history-title">Chai & Coffee</span>
                                            <span className="demo-history-date">Today, 2:30 PM</span>
                                        </div>
                                        <span className="demo-history-amount green">+₹80</span>
                                    </div>
                                    <div className="demo-history-item">
                                        <div className="demo-history-left">
                                            <span className="demo-history-title">Cab Share</span>
                                            <span className="demo-history-date">Yesterday, 9:15 PM</span>
                                        </div>
                                        <span className="demo-history-amount red">-₹150</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mockup-caption-box">
                                <h4>Complete History Log</h4>
                                <p>Detailed timestamps and breakdown for every single rupee exchanged.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= KEY FEATURES ================= */}
            <section className="features-section" id="features">
                <div className="section-container">
                    <div className="section-header">
                        <h2 className="section-title">Key Features</h2>
                        <p className="section-subtitle">Everything you need to manage your personal shared finances</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-box">
                            <div className="feature-icon-badge">📊</div>
                            <h3>Smart Balance Tracking</h3>
                            <p>Instant real-time calculation of total you will get, total you owe, and net standing balances.</p>
                        </div>
                        <div className="feature-box">
                            <div className="feature-icon-badge">📝</div>
                            <h3>Optional Descriptions</h3>
                            <p>Add descriptive notes for every payment so you always remember what the money was for.</p>
                        </div>
                        <div className="feature-box">
                            <div className="feature-icon-badge">📈</div>
                            <h3>Smart Analytics</h3>
                            <p>Visual multi-period charts (weekly, monthly, yearly) and cashflow insights with Chart.js.</p>
                        </div>
                        <div className="feature-box">
                            <div className="feature-icon-badge">📜</div>
                            <h3>Complete Transaction History</h3>
                            <p>Full audit ledger for every friend with timestamps, filter options, and CSV exports.</p>
                        </div>
                        <div className="feature-box">
                            <div className="feature-icon-badge">🔒</div>
                            <h3>Secure & Private</h3>
                            <p>Your financial records are protected with industry-standard bcrypt encryption and JWT security.</p>
                        </div>
                        <div className="feature-box">
                            <div className="feature-icon-badge">⚡</div>
                            <h3>Fast & Lightweight</h3>
                            <p>Zero bloat, instant page loading, and responsive fluid layout across phones, tablets, and desktops.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= CTA BANNER ================= */}
            <section className="cta-banner-section">
                <div className="section-container">
                    <div className="cta-banner-card">
                        <h2>Start Tracking with Friends Today</h2>
                        <p>Join thousands who keep their everyday expenses simple, clear, and organized.</p>
                        <Link to="/register" className="btn-white-cta">
                            Create Free Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="app-footer">
                <div className="section-container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="footer-brand-title">
                                <img src="/assets/images/logo.png" alt="kharchee logo" className="brand-logo-img" />
                                <h3>kharchee</h3>
                            </div>
                            <p>Smart money tracking for everyday life. Built for students, roommates, and daily shared expenses.</p>
                        </div>

                        <div className="footer-col">
                            <h4>Navigation</h4>
                            <ul>
                                <li><a href="#about">About kharchee</a></li>
                                <li><a href="#how-it-works">How It Works</a></li>
                                <li><a href="#features">Key Features</a></li>
                            </ul>
                        </div>

                        <div className="footer-col">
                            <h4>Connect</h4>
                            <ul>
                                <li>
                                    <a href="https://www.instagram.com/kharchee.in/" target="_blank" rel="noreferrer">
                                        Instagram
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>© 2026 kharchee. All rights reserved.</p>
                        <p>Designed for clarity & speed.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
