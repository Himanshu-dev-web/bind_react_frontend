import React, { useState, useEffect } from "react";
import { Lock, User, Calendar, ReceiptText, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { apiClient } from "../api/client.js";

interface LoginPageProps {
  onLoginSuccess: (user: { username: string; isAdmin: boolean }, year: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [financialYears, setFinancialYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("2026-27");
  const [username, setUsername] = useState<string>("admin");
  const [password, setPassword] = useState<string>("a");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    try {
      const years = await apiClient.getFinancialYears();
      setFinancialYears(years);
      if (years.includes("2026-27")) {
        setSelectedYear("2026-27");
      } else if (years.length > 0) {
        setSelectedYear(years[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          year: selectedYear
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "Invalid username or password");
        return;
      }

      onLoginSuccess(data.user, selectedYear);
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-sky-400 shadow-xl shadow-primary-500/30 mb-4">
          <ReceiptText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Modern Billing System
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Book Binding, Printing, Publication & Invoicing Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Financial Year Selector (matching frmPassword.cboyrs) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-400" />
                Financial Year / Database
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
              >
                {financialYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Financial Year {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary-400" />
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. 1 or admin)"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary-400" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (e.g. 1 or a)"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            {/* Default Credentials Hint */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Legacy Default Credentials:</div>
              <div className="flex justify-between">
                <span>Admin: <strong className="text-primary-400 font-mono">admin</strong> / password: <strong className="text-primary-400 font-mono">a</strong></span>
                <span>User: <strong className="text-primary-400 font-mono">1</strong> / password: <strong className="text-primary-400 font-mono">1</strong></span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-lg shadow-primary-600/30 transition-all disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Login to Billing System"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

