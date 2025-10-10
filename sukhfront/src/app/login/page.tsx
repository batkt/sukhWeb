"use client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import uilchilgee, { decodeToken, DecodedToken } from "../../../lib/uilchilgee";
import { createSession } from "@/lib/auth";

interface LoginResponse {
  token: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  // const messages = [
  //   "coffee+energy drink pls!",
  //   "миний coffee ?",
  //   "energy drink?",
  //   "uguhgu yu te tgvel 81 0015 00 1205327905",
  //   "websiteaas gar ***** **!!!",
  // ];
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!email || !password) {
  //     toast.error("И-мэйл болон нууц үгээ оруулна уу");
  //     return;
  //   }

  //   const currentClick = clickCount + 1;
  //   setClickCount(currentClick);

  //   if (currentClick <= messages.length) {
  //     toast(messages[currentClick - 1]);
  //   }

  //   if (currentClick === 5) {
  //     router.push("/khynalt");
  //     return;
  //   }

  //   if (currentClick === 1) {
  //     try {
  //       setLoading(true);
  //       const axiosInstance = uilchilgee();

  //       const response = await axiosInstance.post("/ajiltanNevtrey", {
  //         nevtrekhNer: email,
  //         nuutsUg: password,
  //       });

  //       if (response.data?.success && response.data?.token) {
  //         const decoded = decodeToken(response.data.token);
  //         await createSession(response.data.token, decoded);
  //       } else {
  //         toast.error("Нэвтрэхэд алдаа гарлаа");
  //       }
  //     } catch (error: any) {
  //       const msg =
  //         error?.response?.data?.aldaa ||
  //         error?.message ||
  //         "Нэвтрэхэд алдаа гарлаа";
  //       toast.error(msg);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("И-мэйл болон нууц үгээ оруулна уу");
      return;
    }

    try {
      setLoading(true);
      const axiosInstance = uilchilgee();

      const response = await axiosInstance.post("/ajiltanNevtrey", {
        nevtrekhNer: email,
        nuutsUg: password,
      });

      if (response.data?.success && response.data?.token) {
        const decoded = decodeToken(response.data.token);
        await createSession(response.data.token, decoded);

        toast.success("Тавтай морил!");
        router.push("/khynalt");
      } else {
        toast.error("Нэвтрэхэд алдаа гарлаа");
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.aldaa ||
        error?.message ||
        "Нэвтрэхэд алдаа гарлаа";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-card">
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-transparent backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-2xl p-8  transition-all duration-500">
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
                className="w-full h-14 rounded-2xl border border-border/50 bg-transparent px-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm transition-all"
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
                className="w-full h-14 rounded-2xl border border-border/50 bg-transparent px-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-lg
              hover:from-primary/90 hover:to-primary/70 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/40
              transition-all duration-300 ease-in-out disabled:opacity-60 flex items-center justify-center gap-2"
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
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                  ></path>
                </svg>
              )}
              {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
            </button>
          </form>

          {/* <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/signup")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300
               focus:outline-none focus:underline"
            >
              Бүртгэлгүй юу?{" "}
              <span
                className="text-primary font-semibold relative after:content-[''] after:block after:w-0 after:h-[2px] after:bg-primary
                       after:transition-all after:duration-300 hover:after:w-full"
              >
                Бүртгүүлэх
              </span>
            </button>
          </div> */}
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
