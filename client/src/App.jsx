import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import api from "./api/axios";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";

export default function App() {
    useEffect(() => {
        // Immediate non-blocking background wake-up for Render backend
        api.get("/health").catch(() => {});

        // Keep-alive heartbeat every 4 minutes while browser tab is open
        const interval = setInterval(() => {
            api.get("/health").catch(() => {});
        }, 4 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <AuthProvider>
            <ThemeProvider>
                <ToastProvider>
                    <Routes>
                        <Route path="/" element={<Home />} />

                        <Route
                            path="/login"
                            element={
                                <PublicOnlyRoute>
                                    <Login />
                                </PublicOnlyRoute>
                            }
                        />

                        <Route
                            path="/register"
                            element={
                                <PublicOnlyRoute>
                                    <Register />
                                </PublicOnlyRoute>
                            }
                        />

                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/analytics"
                            element={
                                <ProtectedRoute>
                                    <Analytics />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </ToastProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
