"use client";
import { useAuth } from "@/shared/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.user) {
      const role = auth.user.role.toLowerCase();
      if (role === "student") {
        router.replace("/student/dashboard");
      } else {
        router.replace("/curator/dashboard");
      }
    }
  }, [auth.user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    try {
      setLoading(true);
      await auth.login(email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black selection:bg-indigo-500/30">
      {/* Abstract Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]" />

      {/* Glassmorphism Card */}
      <div className="relative w-full max-w-md p-1">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/5 rounded-3xl blur-sm" />
        <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10">

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-zinc-400 text-sm mt-3">
              Enter your credentials to continue your journey
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider ml-1">Email</label>
              <input
                type="email"
                required
                className="w-full bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider ml-1">Password</label>
              <input
                type="password"
                required
                className="w-full bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="relative bg-zinc-900/0 group-hover:bg-white/5 transition-colors rounded-xl h-full px-6 py-3.5">
                <span className="font-semibold text-white tracking-wide">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </span>
              </div>
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
              <p className="text-xs text-red-200 text-center font-medium">
                {error}
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-500">
              Don't have an account?{" "}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
