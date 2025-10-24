"use client";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { newterya } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("И-мэйл болон нууц үгээ оруулна уу");
      return;
    }

    try {
      setLoading(true);

      const success = await newterya({
        nevtrekhNer: email,
        nuutsUg: password,
      });

      if (success) {
        router.push("/khynalt");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-card">
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-transparent backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-2xl p-8 transition-all duration-500">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Нэвтрэх
            </h1>
            <p className="text-muted-foreground text-base">
              Амар СӨХ тавтай морилно уу
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2 group">
              <label
                htmlFor="email"
                className="text-sm font-medium group-focus-within:text-primary transition-colors"
              >
                Нэвтрэх нэр
              </label>
              <input
                type="text"
                id="email"
                placeholder="жишээ@gail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full h-14 rounded-2xl border border-border/50 bg-transparent px-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-theme"
              />
            </div>

            <div className="space-y-2 group">
              <label
                htmlFor="password"
                className="text-sm font-medium group-focus-within:text-primary transition-colors"
              >
                Нууц үг
              </label>
              <input
                type="password"
                id="password"
                placeholder="*******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full h-14 rounded-2xl border border-border/50 bg-transparent px-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-theme"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-lg
              hover:from-primary/90 hover:to-primary/70 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/40
              transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
            </button>
          </form>
        </div>

        <p
          className="text-center text-sm text-muted-foreground mt-8 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Zevtabs© 2025
        </p>
      </div>
    </div>
  );
}
