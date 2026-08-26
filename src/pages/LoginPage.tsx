import React, { useState } from "react";
import { Lock, User, ReceiptText, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (
    user: {
      username: string;
      isAdmin: boolean;
      companyCode: string;
      databaseKey: string;
      companyName: string;
      selectedYear: string;
    },
    availableYears: any[],
    defaultYear: string
  ) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>("admin1");
  const [password, setPassword] = useState<string>("1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "Invalid username or password");
        return;
      }

      // Persist auth tokens and session
      if (data.token) {
        localStorage.setItem("billing_token", data.token);
      }
      if (data.user?.databaseKey) {
        localStorage.setItem("billing_database_key", data.user.databaseKey);
      }
      if (data.user?.companyCode) {
        localStorage.setItem("billing_company", data.user.companyCode);
      }
      if (data.defaultFinancialYear) {
        localStorage.setItem("billing_year", data.defaultFinancialYear);
      }

      onLoginSuccess(data.user, data.availableFinancialYears || [], data.defaultFinancialYear || "2026-27");
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend service");
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
          Billing Enterprise System
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Database-per-Tenant PostgreSQL Cloud Isolation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all"
                  placeholder="Enter username (admin1 or admin2)"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Zero configuration required — your tenant database and financial year are resolved automatically upon login.</span>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <div className="text-center text-xs text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">Quick Test Logins:</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-left">
                <div
                  onClick={() => {
                    setUsername("admin1");
                    setPassword("1");
                  }}
                  className="p-2 bg-slate-900/50 hover:bg-slate-700/50 cursor-pointer rounded-lg border border-slate-700/50 transition-colors"
                >
                  <p className="text-primary-400 font-semibold">admin1 / 1</p>
                  <p className="text-[10px] text-slate-400">Company A (M.A. Book)</p>
                </div>
                <div
                  onClick={() => {
                    setUsername("admin2");
                    setPassword("2");
                  }}
                  className="p-2 bg-slate-900/50 hover:bg-slate-700/50 cursor-pointer rounded-lg border border-slate-700/50 transition-colors"
                >
                  <p className="text-sky-400 font-semibold">admin2 / 2</p>
                  <p className="text-[10px] text-slate-400">Company B (Ilyas Book)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
