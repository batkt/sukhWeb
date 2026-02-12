"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (email && password) {
      router.push("/khynalt");
    } else {
      alert("И-мэйл болон нууц үгээ оруулна уу");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gray-50">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-background to-cyan-600/20"></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%, rgba(120,119,198,0.3), rgba(255,255,255,0))]"></div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-gradient-to-r from-primary/30 to-violet-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-l from-cyan-500/30 to-primary/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 via-primary/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-20 right-1/4 w-64 h-64 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "3s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-tl from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        ></div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(to_right, #8882_1px, transparent_1px),linear-gradient(to_bottom, #8882_1px, transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%, #000_60%, transparent_100%)]"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-card/40 backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-2xl p-8 hover:scale-105 transition-all duration-500">
          <div className="flex justify-center mb-8 relative">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-2xl ring-4 ring-primary/20 transition-all">
              <span className="text-primary-foreground  text-3xl">
                AC
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full blur-xl opacity-75 animate-pulse"></div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl  mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Бүртгүүлэх
            </h1>
            <p className="text-muted-foreground text-base">
              Шинэ бүртгэл үүсгэх
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2 group">
              <label
                htmlFor="email"
                className="text-sm  group-focus-within:text-primary transition-colors"
              >
                И-мэйл хаяг
              </label>
              <input
                type="email"
                id="email"
                placeholder="aaaa@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-14 rounded-2xl border border-border/50 bg-background/50 px-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm transition-all text-theme"
              />
            </div>

            <div className="space-y-2 group">
              <label
                htmlFor="password"
                className="text-sm  group-focus-within:text-primary transition-colors"
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
                className="w-full h-14 rounded-2xl border border-border/50 bg-background/50 px-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm transition-all text-theme"
              />
            </div>

            <button
              type="submit"
              className="w-full h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white  shadow-lg
               hover:from-primary/90 hover:to-primary/70 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/40
               transition-all duration-300 ease-in-out"
            >
              Бүртгүүлэх
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-muted-foreground hover:text-primary  transition-colors duration-300
               focus:outline-none focus:underline"
            >
              Бүртгэлтэй юу?{" "}
              <span
                className="text-primary  relative after:content-[''] after:block after:w-0 after:h-[2px] after:bg-primary
                       after:transition-all after:duration-300 hover:after:w-full"
              >
                Нэвтрэх
              </span>
            </button>
          </div>
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
