"use client";

import { ArrowRight, X } from "lucide-react";
import type { Machine } from "@/lib/education/machines-data";
import { useState } from "react";

export type ModalType = "lesson" | "quiz" | "work" | "system" | null;

const MODAL_ICON: Record<Exclude<ModalType, null>, string> = {
  quiz: "?",
  work: "W",
  system: "Σ",
  lesson: "✦",
};

type Props = {
  type: Exclude<ModalType, null>;
  machine: Machine;
  onClose: () => void;
};

export function LearningModal({ type, machine, onClose }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const question = machine.quiz[qIndex];

  const title =
    type === "quiz"
      ? `${machine.name} quick quiz`
      : type === "work"
        ? "Work & energy on this machine"
        : type === "system"
          ? "Simple machines family"
          : machine.lesson.title;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`learning-modal ${type === "system" ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <span className="modal-icon">{MODAL_ICON[type]}</span>
        <em>{machine.system}</em>
        <h2 id="modal-title">{title}</h2>

        {type === "quiz" && question ? (
          <div className="quiz-panel">
            <p className="quiz-prompt">{question.prompt}</p>
            <div className="quiz-options">
              {question.options.map((opt, i) => {
                const state =
                  picked === null
                    ? ""
                    : i === question.answer
                      ? "correct"
                      : picked === i
                        ? "wrong"
                        : "";
                return (
                  <button
                    key={opt}
                    type="button"
                    className={state}
                    disabled={picked !== null}
                    onClick={() => setPicked(i)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <p className="quiz-explain">
                {picked === question.answer ? "Correct. " : "Not quite. "}
                {question.explain}
              </p>
            )}
            <div className="quiz-nav">
              <button
                type="button"
                className="lesson-button"
                onClick={() => {
                  setPicked(null);
                  setQIndex((q) => (q + 1) % machine.quiz.length);
                }}
              >
                Next question <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : type === "work" ? (
          <>
            <p>{machine.workLink}</p>
            <dl className="modal-facts">
              <div>
                <dt>Formula focus</dt>
                <dd>{machine.formula}</dd>
              </div>
              <div>
                <dt>MA note</dt>
                <dd>{machine.maNote}</dd>
              </div>
              <div>
                <dt>Watch for</dt>
                <dd>{machine.misconception}</dd>
              </div>
            </dl>
            <button className="lesson-button" onClick={onClose}>
              Continue exploring <ArrowRight size={16} />
            </button>
          </>
        ) : type === "system" ? (
          <>
            <p>
              CBSE simple machines include the lever (Classes I–III), pulley, inclined plane,
              wheel and axle, wedge, and screw. Mechanica Lab also includes an Atwood machine
              (Class 9 connected masses) and a hydraulic press (Class 8 Pascal’s law) so students
              can see force trade-offs in 3D.
            </p>
            <dl className="modal-facts">
              <div>
                <dt>Mechanical advantage</dt>
                <dd>MA = Load / Effort — how much the machine multiplies force.</dd>
              </div>
              <div>
                <dt>Velocity ratio</dt>
                <dd>VR = distance moved by effort / distance moved by load.</dd>
              </div>
              <div>
                <dt>Efficiency</dt>
                <dd>η = (MA / VR) × 100% when work is lost to friction.</dd>
              </div>
            </dl>
            <button className="lesson-button" onClick={onClose}>
              Continue exploring <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            {machine.lesson.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
            <ul className="lesson-bullets">
              {machine.lesson.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <button className="lesson-button" onClick={onClose}>
              Continue exploring <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
