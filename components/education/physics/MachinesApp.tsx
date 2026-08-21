"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Compass,
  DraftingCompass,
  Gauge,
  LibraryBig,
  Play,
  Search,
  Sparkles,
  Wrench,
  X,
  Building2,
} from "lucide-react";
import { MachineViewer } from "@/components/education/physics/MachineViewer";
import { LearningModal, type ModalType } from "@/components/education/physics/LearningModal";
import {
  MA_COMPARE,
  machineById,
  machines,
  type MachineId,
} from "@/lib/education/machines-data";
import type { HudState } from "@/lib/education/three/assemblies";
import { sound } from "@/lib/education/audio";

function defaultParams(id: MachineId): Record<string, number> {
  const machine = machineById[id];
  return Object.fromEntries(machine.controls.map((c) => [c.key, c.defaultValue]));
}

export function MachinesApp() {
  const [machineId, setMachineId] = useState<MachineId>("inclined-plane");
  const [params, setParams] = useState(() => defaultParams("inclined-plane"));
  const [autoRotate, setAutoRotate] = useState(true);
  const [vectorsOn, setVectorsOn] = useState(true);
  const [compare, setCompare] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [query, setQuery] = useState("");
  const [mobileLibrary, setMobileLibrary] = useState(false);
  const [hud, setHud] = useState<HudState | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const machine = machineById[machineId];
  const filtered = useMemo(
    () =>
      machines.filter((item) =>
        `${item.name} ${item.system} ${item.formula}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(
      contentRef.current.querySelectorAll("[data-reveal]"),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.48, stagger: 0.035, ease: "power2.out", overwrite: true },
    );
  }, [machineId]);

  const selectMachine = (id: MachineId) => {
    sound.playClick(640, 0.04);
    setMachineId(id);
    setParams(defaultParams(id));
    setMobileLibrary(false);
    setCompare(false);
    setHud(null);
  };

  const updateParam = (key: string, value: number) => {
    sound.playSliderTick();
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const openModal = (m: ModalType) => {
    sound.playClick(750, 0.04);
    setModal(m);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => selectMachine("inclined-plane")}
          aria-label="Mechanica Lab home"
        >
          <strong>
            Mechanica Lab<sup>⚙</sup>
          </strong>
          <em>Work, energy & simple machines</em>
        </button>

        <nav className="main-nav" aria-label="Primary navigation">
          <button type="button" className="active">
            <Compass size={17} /> Explore
          </button>
          <button type="button" onClick={() => openModal("lesson")}>
            <BookOpen size={17} /> Lessons
          </button>
          <button type="button" onClick={() => openModal("quiz")}>
            <CircleHelp size={17} /> Quiz
          </button>
        </nav>

        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search machines…"
            aria-label="Search machines"
          />
        </label>

        <button className="profile" type="button" aria-label="Open learner profile">
          <span>CB</span>
          <ChevronDown size={15} />
        </button>
        <button
          className="mobile-library-trigger"
          type="button"
          onClick={() => setMobileLibrary(true)}
          aria-label="Open machine library"
        >
          <LibraryBig size={20} />
        </button>
      </header>

      <div className="workspace">
        <aside className={`organ-library ${mobileLibrary ? "open" : ""}`}>
          <div className="panel-heading">
            <span>Machine library</span>
            <button
              aria-label="Close library"
              className="mobile-close"
              type="button"
              onClick={() => setMobileLibrary(false)}
            >
              <X size={17} />
            </button>
          </div>
          <div className="organ-list">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`organ-item ${machineId === item.id ? "active" : ""}`}
                onClick={() => selectMachine(item.id)}
              >
                <span className="organ-glyph" style={{ color: item.accent }}>
                  {item.icon}
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.system}</small>
                </span>
                {machineId === item.id && <Gauge className="favorite" size={14} />}
              </button>
            ))}
          </div>
          <button className="view-all" type="button" onClick={() => setQuery("")}>
            View all machines <ArrowRight size={14} />
          </button>
        </aside>

        <MachineViewer
          machine={machine}
          params={params}
          autoRotate={autoRotate}
          onAutoRotate={setAutoRotate}
          vectorsOn={vectorsOn}
          onVectorsOn={setVectorsOn}
          compare={compare}
          onCompare={() => {
            sound.playClick(600, 0.03);
            setCompare((c) => !c);
          }}
          onHud={setHud}
          onParamsChange={setParams}
        />

        <aside className="info-panel" ref={contentRef}>
          <div className="info-kicker" data-reveal>
            <Wrench size={13} /> The {machine.name}
          </div>
          <div className="info-title-row" data-reveal>
            <div>
              <h1>{machine.name}</h1>
              <em>{machine.poetic}</em>
            </div>
            <span className="specimen-stamp" style={{ color: machine.accent }}>
              {machine.icon}
            </span>
          </div>
          <p className="description" data-reveal>
            {machine.description}
          </p>
          <div className="rule" />

          <div className="hud-card" data-reveal>
            <div className="hud-head">
              <DraftingCompass size={15} /> Live readout
            </div>
            <div className="hud-ma">
              <span>MA</span>
              <strong>{hud ? hud.ma.toFixed(2) : "—"}</strong>
            </div>
            <dl className="hud-lines">
              {(hud?.lines ?? [{ label: "Waiting for assembly", value: "…" }]).map((line) => (
                <div key={line.label}>
                  <dt>{line.label}</dt>
                  <dd>{line.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="controls-card" data-reveal>
            <div className="hud-head">Parameters</div>
            {machine.controls.map((control) => (
              <label key={control.key} className="param-row">
                <span>
                  {control.label}
                  <b>
                    {params[control.key]}
                    {control.unit}
                  </b>
                </span>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={params[control.key] ?? control.defaultValue}
                  onChange={(e) => updateParam(control.key, Number(e.target.value))}
                />
              </label>
            ))}
          </div>

          <dl className="key-facts" data-reveal>
            <div>
              <dt>Formula</dt>
              <dd>{machine.formula}</dd>
            </div>
            <div>
              <dt>CBSE focus</dt>
              <dd>{machine.cbseFocus}</dd>
            </div>
          </dl>

          <div className="medical-note" data-reveal>
            <Gauge size={16} />
            <p>
              <b>Mechanical advantage</b>
              {machine.maNote}
            </p>
          </div>
          <div className="fun-note" data-reveal>
            <Sparkles size={15} />
            <p>
              <b>Did you know</b>
              {machine.funFact}
            </p>
          </div>

          <button className="lesson-button" data-reveal type="button" onClick={() => openModal("lesson")}>
            View lesson <ArrowRight size={16} />
          </button>
          <div className="action-grid" data-reveal>
            <button type="button" onClick={() => openModal("work")}>
              <Play size={15} /> Work & energy
            </button>
            <button type="button" onClick={() => openModal("quiz")}>
              <CircleHelp size={15} /> Quiz
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick(600, 0.03);
                setCompare((c) => !c);
              }}
              className={compare ? "active" : ""}
            >
              <DraftingCompass size={15} /> Compare
            </button>
          </div>
        </aside>
      </div>

      {compare && (
        <section className="compare-strip" aria-label="Mechanical advantage comparison">
          {MA_COMPARE.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`compare-organ ${item.id === machineId ? "active" : ""}`}
              onClick={() => selectMachine(item.id as MachineId)}
            >
              <span style={{ color: item.accent }}>{machineById[item.id as MachineId].icon}</span>
              <span>Comparing</span>
              <strong>{item.name}</strong>
              <small>{item.formula}</small>
              {item.id === machineId && hud && (
                <em className="compare-ma">MA {hud.ma.toFixed(2)}</em>
              )}
            </button>
          ))}
        </section>
      )}

      {/* Real World Applications Section */}
      <section className="real-world-strip" aria-label="Real world machinery applications">
        <div className="strip-heading">
          <Building2 size={16} />
          <span>Real-world applications of {machine.name}</span>
        </div>
        <div className="real-world-grid">
          {machine.realWorld.map((rw) => (
            <article key={rw.title} className="real-world-card">
              <span className="rw-tag">{rw.tag}</span>
              <h4>{rw.title}</h4>
              <p>{rw.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="learning-cards" aria-label={`${machine.name} learning resources`}>
        <article className="curiosity-card">
          <em>Concept</em>
          <h3>How this machine saves effort</h3>
          <p>{machine.maNote}</p>
          <button type="button" onClick={() => openModal("lesson")}>
            Explore lesson <ArrowRight size={14} />
          </button>
        </article>
        <article className="curiosity-card">
          <em>Compare</em>
          <h3>MA across machines</h3>
          <p>Ramp, pulley strands, and gear teeth all trade distance or speed for force.</p>
          <button type="button" onClick={() => setCompare(true)}>
            Open comparison <ArrowRight size={14} />
          </button>
        </article>
        <article className="curiosity-card function-card">
          <em>Work</em>
          <h3>See work & energy</h3>
          <p>{machine.workLink}</p>
          <button type="button" onClick={() => openModal("work")}>
            Play idea <ArrowRight size={14} />
          </button>
        </article>
        <article className="curiosity-card system-card">
          <em>Exam tip</em>
          <h3>Common misconception</h3>
          <p>{machine.misconception}</p>
          <button type="button" onClick={() => openModal("system")}>
            See the system <ArrowRight size={14} />
          </button>
        </article>
      </section>

      {modal && <LearningModal type={modal} machine={machine} onClose={() => setModal(null)} />}
      {mobileLibrary && (
        <button
          className="drawer-backdrop"
          aria-label="Close library"
          type="button"
          onClick={() => setMobileLibrary(false)}
        />
      )}
    </main>
  );
}
