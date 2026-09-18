import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Atom, BookOpen, FlaskConical, MousePointer2, Move3D, Sparkles } from "lucide-react";
import { LabPreview } from "@/components/education/LabPreview";

export const metadata: Metadata = {
  title: "Interactive Education Labs | Nabendu",
  description: "Explore hands-on 3D Physics and Chemistry labs for CBSE Classes 6–9. Move models, try experiments and discover the science behind them.",
  alternates: { canonical: "/education" },
};

const labs = [
  {
    subject: "Physics", name: "Mechanica Lab", kind: "physics" as const, icon: Atom,
    headline: "Put ideas in motion.",
    description: "Why does a ramp make lifting easier? How does a pulley change a force? Get hands-on with the machines behind everyday science.",
    features: ["Explore movable 3D machines", "Change loads, angles and other controls", "See force vectors and live measurements"],
    tags: ["Forces & motion", "Simple machines", "Energy"],
    accent: "text-sky-700 dark:text-sky-300", badge: "bg-sky-100 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200",
    border: "hover:border-sky-400 dark:hover:border-sky-500/70", button: "bg-sky-700 hover:bg-sky-800 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950",
  },
  {
    subject: "Chemistry", name: "Elementa Lab", kind: "chemistry" as const, icon: FlaskConical,
    headline: "Make the invisible visible.",
    description: "Look inside matter, explore mixtures and meet the atoms that make up our world. Turn a textbook question into your next experiment.",
    features: ["Try nine interactive experiments", "Move glassware, atoms and molecules in 3D", "Check your understanding with quizzes and notes"],
    tags: ["Matter & mixtures", "Atoms & molecules", "Reactions"],
    accent: "text-violet-700 dark:text-violet-300", badge: "bg-violet-100 text-violet-800 dark:bg-violet-400/10 dark:text-violet-200",
    border: "hover:border-violet-400 dark:hover:border-violet-500/70", button: "bg-violet-700 hover:bg-violet-800 dark:bg-violet-500 dark:hover:bg-violet-400",
  },
];

export default function EducationPage() {
  return (
    <div className="container max-w-6xl space-y-10 py-8 lg:space-y-14 lg:py-14">
      <section className="relative isolate overflow-hidden rounded-3xl border border-slate-700 bg-[#0c1729] text-white shadow-xl">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_20%,#155e7555,transparent_50%),radial-gradient(ellipse_at_10%_100%,#6d28d944,transparent_60%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(#ffffff05_1px,transparent_1px),linear-gradient(90deg,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:p-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1.5 text-xs font-semibold text-sky-200"><Sparkles size={14} /> A playground for curious minds</p>
            <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Small experiments.<br /><span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">Big discoveries.</span></h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300">Science makes more sense when you can explore it. Step into a 3D lab, move things around and see what happens next.</p>
            <a href="#labs" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300">Find your lab <ArrowRight size={17} /></a>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><BookOpen size={14} /> CBSE Classes 6–9 · Right in your browser</p>
          </div>
          <div aria-hidden="true" className="relative mx-auto hidden w-full max-w-sm sm:block">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-2xl backdrop-blur-sm">
              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300"><span>The discovery desk</span><span className="text-cyan-300">01 / 02</span></div>
              <LabPreview kind="chemistry" hero />
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-300"><span>Observe. Change. Understand.</span><Atom size={20} className="text-cyan-300" /></div>
            </div>
          </div>
        </div>
        <div className="relative grid grid-cols-1 gap-4 border-t border-white/10 bg-black/15 px-7 py-5 text-sm text-slate-200 sm:grid-cols-3 sm:px-10 lg:px-12">
          {[{ icon: Move3D, text: "Explore in three dimensions" }, { icon: MousePointer2, text: "Learn by changing things" }, { icon: BookOpen, text: "Connect it to the classroom" }].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3"><Icon size={18} className="shrink-0 text-sky-300" />{text}</div>)}
        </div>
      </section>
      <section id="labs" className="scroll-mt-24" aria-labelledby="labs-heading">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Choose your next discovery</p><h2 id="labs-heading" className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Two subjects. Endless questions.</h2></div>
          <span className="text-sm text-slate-500 dark:text-slate-400">No downloads. Just curiosity.</span>
        </div>
        <div className="grid gap-7 lg:grid-cols-2">
          {labs.map((lab) => <article key={lab.kind} className={`group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 ${lab.border}`}>
            <div className={`relative border-b border-slate-200 px-6 pt-5 dark:border-white/10 ${lab.kind === "physics" ? "bg-sky-50 dark:bg-sky-950/40" : "bg-violet-50 dark:bg-violet-950/30"}`}>
              <div className="flex items-center justify-between"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${lab.badge}`}><lab.icon size={14} />{lab.name}</span><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">3D learning lab</span></div>
              <LabPreview kind={lab.kind} />
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${lab.accent}`}>{lab.subject}</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{lab.headline}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{lab.description}</p>
              <div className="my-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
                <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${lab.accent}`}>Inside the lab</p>
                <ul className="space-y-3">{lab.features.map((feature) => <li key={feature} className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-200"><ArrowRight size={15} className={`mt-0.5 shrink-0 ${lab.accent}`} />{feature}</li>)}</ul>
              </div>
              <div className="mb-6 flex flex-wrap gap-2">{lab.tags.map((tag) => <span key={tag} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">{tag}</span>)}</div>
              <Link href={`/education/${lab.kind}`} className={`mt-auto inline-flex items-center justify-between rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current ${lab.button}`}>Explore {lab.subject}<ArrowRight size={18} className="transition-transform motion-safe:group-hover:translate-x-1" /></Link>
            </div>
          </article>)}
        </div>
      </section>
      <section aria-label="How to explore" className="grid gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50 sm:grid-cols-3 sm:p-8">
        {[["01", "Ask a question", "Pick a concept that makes you wonder."], ["02", "Try something", "Move a model or change a control. Notice what changes."], ["03", "Make the connection", "Use the explanations to understand what you observed."]].map(([number, title, text]) => <div key={number}><span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300">{number} /</span><h2 className="mt-2 font-bold text-slate-900 dark:text-white">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{text}</p></div>)}
      </section>
    </div>
  );
}
