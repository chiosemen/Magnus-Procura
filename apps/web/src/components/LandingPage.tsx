import React, { useState } from 'react';

interface LandingPageProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  errorMessage: string | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSubmit, errorMessage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(username, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white grid place-items-center p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 p-8 shadow-2xl"
      >
        <h1 className="text-2xl font-black">MAGNUS PROCURA</h1>
        <p className="mt-2 text-sm text-slate-300">Authenticate to access role-scoped procurement workflows.</p>

        <label className="block mt-6 text-sm font-semibold" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />

        <label className="block mt-4 text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}

        <button
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-500 disabled:opacity-50"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default LandingPage;
