import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { loginWithEmployeeCode, setAuthUser } from "../api/auth";

const BadgeIcon = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.25 4.5A2.25 2.25 0 0 1 7.5 2.25h9a2.25 2.25 0 0 1 2.25 2.25v15A2.25 2.25 0 0 1 16.5 21.75h-9a2.25 2.25 0 0 1-2.25-2.25v-15Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 17.25h7.5" />
  </svg>
)

function Login() {
  const navigate = useNavigate();
  const [employeeCode, setEmployeeCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const authUser = await loginWithEmployeeCode(employeeCode);
      setAuthUser(authUser);
      navigate(authUser.userType === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
    } catch {
      setError("Invalid employee code");
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#050408] text-white">
      <section
        className="relative flex min-h-screen items-center justify-center bg-cover bg-center px-5 py-10 sm:px-8 lg:px-14"
        style={{ backgroundImage: "url('/images/background.png')" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(111,24,255,0.16),transparent_30%),linear-gradient(90deg,rgba(0,0,0,0.08),rgba(0,0,0,0.28))]" />

        <div className="relative grid w-full max-w-[57.5rem] items-center gap-8 lg:grid-cols-[1fr_26.25rem]">
          <aside className="flex justify-center lg:justify-start relative left-[-6.5rem]">
            <div className="flex w-full max-w-[38rem] items-center justify-center lg:justify-start">
              <img
                className="w-full max-w-[28rem] object-contain drop-shadow-[0_0_1.5rem_rgba(126,47,255,0.22)] sm:max-w-[30rem]"
                src="/images/logo2.png"
                alt="Assistly"
              />
            </div>
          </aside>

          <form className="mx-auto w-full max-w-[26.25rem] rounded-2xl border border-[#6423c7] bg-black/55 px-5 py-7 shadow-[0_0_2.125rem_rgba(98,35,199,0.3)] backdrop-blur-md sm:px-8" onSubmit={handleSubmit}>
            <div className="text-center">
              <h1 className="text-xl font-bold sm:text-2xl">Employee Login</h1>
              <p className="mt-2 text-sm text-zinc-400">Enter your employee code to continue</p>
            </div>

            <div className="mt-7 space-y-5">
              <label className="block">
                <span className="mb-2.5 block text-sm font-semibold text-zinc-200">Employee Code</span>
                <span className="flex h-12 items-center gap-3 rounded-lg border border-white/14 bg-black/30 px-4 text-[#842cff] focus-within:border-[#842cff] focus-within:ring-2 focus-within:ring-[#842cff]/25">
                  <BadgeIcon />
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                    type="text"
                    placeholder="Enter employee code"
                    autoComplete="off"
                    value={employeeCode}
                    onChange={(event) => setEmployeeCode(event.target.value)}
                  />
                </span>
              </label>

              {error && <p className="text-sm font-semibold text-red-200">{error}</p>}

              <button
                className="h-12 w-full rounded-lg bg-[linear-gradient(135deg,#7228ff,#4a0ebd)] text-sm font-semibold text-white shadow-[0_0.625rem_1.875rem_rgba(92,32,214,0.28)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#8c35ff] focus:ring-offset-2 focus:ring-offset-black"
                type="submit"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Login
