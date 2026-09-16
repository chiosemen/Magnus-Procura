import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6 py-20">
      <div className="max-w-4xl text-center mb-16">
        <div className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs uppercase tracking-widest font-bold px-4 py-1.5 rounded-full mb-6">
          Anti-Opaque-Intermediary · Cohort 1
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
          MAGNUS PROCURA
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
          Accountable supplier readiness and named-buyer introduction. Connections count only after they convert.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <span className="text-4xl mb-4 block">🏢</span>
            <h2 className="text-2xl font-bold mb-2">For Operating Firms</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Five named accounts, a buyer-native risk packet, and intros counted on an open scoreboard. No readiness theater, no house-issued certificates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/apply"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl text-center text-sm transition shadow-lg shadow-blue-600/20"
            >
              Apply for Fit Review →
            </Link>
            <Link
              href="/login"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-6 rounded-xl text-center text-sm transition"
            >
              Member Sign In
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <span className="text-4xl mb-4 block">🤝</span>
            <h2 className="text-2xl font-bold mb-2">For Strategic Partners</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Referral mesh with transparent bounties paid only on kept outcomes at day 91. Track your referral stages without opaque hub lock-in.
            </p>
          </div>
          <div>
            <Link
              href="/partner/referrals"
              className="inline-block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl text-center text-sm transition border border-slate-700"
            >
              Partner Portal Access
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-20 text-center text-xs text-slate-600">
        <p className="font-semibold uppercase tracking-widest mb-2">Product Contract</p>
        <p className="max-w-xl text-slate-500">
          We do not guarantee contracts. We guarantee a measured path: five named accounts, a packet a buyer knows how to score, and named intros we count in the open.
        </p>
      </div>
    </main>
  );
}
