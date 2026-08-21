"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleDashed,
  Maximize2,
  RotateCcw,
  Search,
  Spline,
  Crosshair,
  Volume2,
  VolumeX,
  ZoomIn,
  Sparkles,
  X,
} from "lucide-react";
import type { Hotspot, Machine } from "@/lib/education/machines-data";
import type { HudState } from "@/lib/education/three/assemblies";
import type { HotspotScreenPos, MachineViewer as MachineViewerClass } from "@/lib/education/three/viewer";
import { sound } from "@/lib/education/audio";

type Props = {
  machine: Machine;
  params: Record<string, number>;
  autoRotate: boolean;
  onAutoRotate: (enabled: boolean) => void;
  vectorsOn: boolean;
  onVectorsOn: (enabled: boolean) => void;
  compare: boolean;
  onCompare: () => void;
  onHud: (hud: HudState) => void;
  onParamsChange: (params: Record<string, number>) => void;
};

export function MachineViewer({
  machine,
  params,
  autoRotate,
  onAutoRotate,
  vectorsOn,
  onVectorsOn,
  compare,
  onCompare,
  onHud,
  onParamsChange,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<MachineViewerClass | null>(null);
  const onHudRef = useRef(onHud);
  const onParamsChangeRef = useRef(onParamsChange);
  const [ready, setReady] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [hotspotPositions, setHotspotPositions] = useState<HotspotScreenPos[]>([]);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  useEffect(() => {
    onHudRef.current = onHud;
  }, [onHud]);

  useEffect(() => {
    onParamsChangeRef.current = onParamsChange;
  }, [onParamsChange]);

  useEffect(() => {
    let cancelled = false;
    let viewer: MachineViewerClass | null = null;
    const initialId = machine.id;
    const initialParams = params;

    void import("@/lib/education/three/viewer").then(({ MachineViewer: Viewer }) => {
      if (cancelled || !mountRef.current) return;
      viewer = new Viewer(mountRef.current, {
        onHud: (hud) => onHudRef.current(hud),
        onReady: () => setReady(true),
        onHotspotsScreen: (positions) => setHotspotPositions(positions),
      });
      viewerRef.current = viewer;
      viewer.setAutoRotate(autoRotate);
      viewer.setVectorsVisible(vectorsOn);
      viewer.setMachine(initialId, initialParams);
    });

    return () => {
      cancelled = true;
      viewerRef.current = null;
      viewer?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const machineIdRef = useRef(machine.id);
  useEffect(() => {
    if (machineIdRef.current === machine.id) return;
    machineIdRef.current = machine.id;
    setReady(false);
    setActiveHotspot(null);
    viewerRef.current?.setMachine(machine.id, params);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machine.id]);

  useEffect(() => {
    viewerRef.current?.setParams(params);
  }, [params]);

  useEffect(() => {
    viewerRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    viewerRef.current?.setVectorsVisible(vectorsOn);
  }, [vectorsOn]);

  const handleTool = (tool: string) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    switch (tool) {
      case "reset":
        viewer.reset();
        onParamsChangeRef.current(viewer.getParams());
        setActiveTool(null);
        break;
      case "zoom-in":
        viewer.zoom(1);
        break;
      case "zoom-out":
        viewer.zoom(-1);
        break;
      case "vectors":
        onVectorsOn(!vectorsOn);
        setActiveTool(vectorsOn ? null : "vectors");
        break;
      case "isolate":
        viewer.toggleIsolate();
        setActiveTool((t) => (t === "isolate" ? null : "isolate"));
        break;
      case "compare":
        onCompare();
        break;
      default:
        break;
    }
  };

  const toggleMute = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
  };

  const handleSelectHotspot = (h: Hotspot) => {
    sound.playHotspotChime();
    setActiveHotspot(activeHotspot?.id === h.id ? null : h);
  };

  const tools = [
    { id: "reset", label: "Reset", icon: RotateCcw },
    { id: "zoom-in", label: "Zoom in", icon: ZoomIn },
    { id: "zoom-out", label: "Zoom out", icon: Search },
    { id: "vectors", label: "Force vectors", icon: Crosshair },
    { id: "isolate", label: "Isolate", icon: CircleDashed },
    { id: "compare", label: "Compare MA", icon: Spline },
  ] as const;

  return (
    <section className="viewer-shell" aria-label={`${machine.name} interactive viewer`}>
      <div className="viewer-glow" style={{ "--machine-accent": machine.accent } as React.CSSProperties} />
      <div ref={mountRef} className="three-mount" />

      {/* Pulsing 3D Interactive Hotspot Pins Overlay */}
      <div className="hotspot-overlay">
        {machine.hotspots.map((h) => {
          const screenPos = hotspotPositions.find((sp) => sp.id === h.id);
          if (!screenPos || !screenPos.visible) return null;
          const isActive = activeHotspot?.id === h.id;

          return (
            <div
              key={h.id}
              className={`pin-wrapper-3d ${isActive ? "active" : ""}`}
              style={{
                left: `${screenPos.x}%`,
                top: `${screenPos.y}%`,
              }}
            >
              <button
                type="button"
                className="pin-button"
                onClick={() => handleSelectHotspot(h)}
                style={{ "--pin-color": h.color } as React.CSSProperties}
                aria-label={`Hotspot ${h.label}`}
                title={h.label}
              >
                <span className="pin-pulse" />
                <span className="pin-core" />
              </button>

              {isActive && (
                <div className="pin-popover">
                  <div className="popover-head">
                    <span style={{ background: h.color }} className="popover-badge" />
                    <strong>{h.label}</strong>
                    <button type="button" onClick={() => setActiveHotspot(null)}>
                      <X size={14} />
                    </button>
                  </div>
                  <p>{h.detail}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="viewer-tools" aria-label="3D viewer tools">
        {tools.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`tool-button ${
              activeTool === id || (id === "vectors" && vectorsOn) || (id === "compare" && compare)
                ? "active"
                : ""
            }`}
            onClick={() => handleTool(id)}
            aria-pressed={
              activeTool === id || (id === "vectors" && vectorsOn) || (id === "compare" && compare)
            }
            aria-label={label}
            title={label}
          >
            <Icon size={17} />
          </button>
        ))}
      </div>

      <button
        className="sound-toggle"
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute audio" : "Mute audio"}
        title={muted ? "Unmute audio" : "Mute audio"}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      <aside className="tip-note" aria-label="Viewer instructions">
        <strong><Sparkles size={12} /> Interactive 3D</strong>
        <span>Drag to orbit & operate</span>
        <span>Scroll to zoom</span>
        <span>Click 3D pins for physics details</span>
      </aside>

      {!ready && (
        <div className="model-loader" role="status" aria-live="polite">
          <div className="loader-orbit">
            <Maximize2 size={20} />
          </div>
          <p>Building assembly…</p>
        </div>
      )}

      <button
        className="auto-rotate"
        type="button"
        onClick={() => onAutoRotate(!autoRotate)}
        aria-pressed={autoRotate}
      >
        Auto rotate
        <span className={`switch ${autoRotate ? "on" : ""}`}>
          <i />
        </span>
      </button>

      <div className="view-caption">
        <span>3D ASSEMBLY · OPERATE TO SEE FORCES</span>
        <strong>{machine.scientificName}</strong>
      </div>

      <ul className="hotspot-index">
        {machine.hotspots.map((h) => (
          <li
            key={h.id}
            className={activeHotspot?.id === h.id ? "active" : ""}
            onClick={() => handleSelectHotspot(h)}
            style={{ cursor: "pointer" }}
          >
            <i style={{ background: h.color }} />
            <b>{h.label}</b>
            <span>{h.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
