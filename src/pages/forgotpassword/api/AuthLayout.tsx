import type { ReactNode } from "react";
import { ShieldCheck, UsersRound } from "lucide-react";
import logo from "../../../assets/images/SaveCircle_logo.png";
import loginImage from "../../../assets/images/login.jpg";

interface Props {
  title: string;
  description: ReactNode;
  children: ReactNode;
}

// Same two-panel look as onboarding: mint brand panel on large screens, single column on phones.
export default function AuthLayout({ title, description, children }: Props) {
  return (
    <div className="auth-page min-h-screen bg-[#e9f4f0] p-0 md:p-4 lg:p-6 flex items-center justify-center">
      <section className="auth-frame w-full max-w-[1400px] min-h-screen md:min-h-[min(820px,calc(100vh-2rem))] overflow-hidden bg-white md:rounded-xl md:shadow-[0_24px_70px_rgba(10,61,49,0.14)] grid md:grid-cols-2">
        <aside className="relative hidden md:flex flex-col overflow-hidden bg-[#064d3d] px-10 py-10 lg:px-14 lg:py-12 text-white ">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_88%_35%,rgba(16,144,101,0.45),transparent_40%),linear-gradient(145deg,#064d3d_0%,#053c33_72%,#07392f_100%)]" />
          <div className="relative z-10 flex items-center gap-3">
            <img src={logo} alt="save circle logo" />
          </div>

          <div className="relative z-10 mt-10 lg:mt-14 max-w-md">
            <h1 className="text-3xl lg:text-[40px] font-bold leading-[1.08]">
              Stronger
              <br />
              Together
            </h1>
            <p className="mt-4 max-w-sm text-sm lg:text-base leading-relaxed text-white/85">
              Join trusted groups, contribute regularly, and reach your
              financial goals together.
            </p>
            <ul className="mt-7 space-y-4 text-sm font-medium">
              <li className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-[#51d8a0]" />
                Your records stay safe.
              </li>
              <li className="flex items-center gap-3">
                <UsersRound className="size-5 text-[#51d8a0]" />
                Your access, restored.
              </li>
            </ul>
          </div>

          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${loginImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#064d3d] via-transparent to-[#064d3d]/10" />
          </div>
        </aside>

        <main className="flex min-h-screen flex-col px-5 py-8 sm:px-8 lg:min-h-0 lg:justify-center lg:px-16 ">
          <div className="mx-auto mt-50 w-full max-w-md lg:mt-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <div className="mt-2 text-base leading-relaxed text-slate-600 text-[13px]">
              {description}
            </div>
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </section>
    </div>
  );
}
