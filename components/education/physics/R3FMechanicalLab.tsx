"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, CameraControls, Bounds } from "@react-three/drei";
import { EffectComposer, Bloom, SSAO, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/* React 19 JSX element wrapper helpers */
const BloomEffect = (props: any): any => React.createElement(Bloom as any, props);
const SSAOEffect = (props: any): any => React.createElement(SSAO as any, props);
const VignetteEffect = (props: any): any => React.createElement(Vignette as any, props);

/**
 * 1. Per-Machine Default Camera Positions, Target LookAt Coordinates, & Distance Limits
 */
export type MachineCameraPreset = {
  position: [number, number, number];
  target: [number, number, number];
  minDistance: number;
  maxDistance: number;
};

export const MACHINE_CAMERA_PRESETS: Record<string, MachineCameraPreset> = {
  "inclined-plane": {
    position: [2.0, 1.4, 4.2],
    target: [0, -0.2, 0],
    minDistance: 1.8,
    maxDistance: 6.5,
  },
  pulley: {
    position: [2.0, 0.6, 4.4],
    target: [0, 0.35, 0],
    minDistance: 1.8,
    maxDistance: 6.8,
  },
  gears: {
    position: [0.8, 1.3, 2.2],
    target: [0.05, 0.1, 0],
    minDistance: 1.1,
    maxDistance: 4.5,
  },
  lever: {
    position: [1.1, 1.0, 2.6],
    target: [0, 0, 0],
    minDistance: 1.3,
    maxDistance: 4.8,
  },
  "wheel-axle": {
    position: [1.3, 1.1, 2.9],
    target: [0, 0, 0],
    minDistance: 1.3,
    maxDistance: 5.0,
  },
  screw: {
    position: [1.8, 1.2, 4.2],
    target: [0, -0.2, 0],
    minDistance: 1.6,
    maxDistance: 6.5,
  },
};

/**
 * 2. Animated Camera Transitions (CameraControls.setLookAt with 0.8s smooth transition)
 */
function SmoothCameraFocus({ machineId }: { machineId: string }) {
  const cameraControlsRef = useRef<CameraControls>(null);

  useEffect(() => {
    const preset = MACHINE_CAMERA_PRESETS[machineId] || MACHINE_CAMERA_PRESETS["inclined-plane"];
    if (cameraControlsRef.current) {
      // Smoothly animate camera position and lookAt target over 0.8s
      cameraControlsRef.current.setLookAt(
        preset.position[0],
        preset.position[1],
        preset.position[2],
        preset.target[0],
        preset.target[1],
        preset.target[2],
        true, // Enable smooth transition
      );
      // Update min/max zoom distance bounds per machine
      cameraControlsRef.current.minDistance = preset.minDistance;
      cameraControlsRef.current.maxDistance = preset.maxDistance;
    }
  }, [machineId]);

  return (
    <CameraControls
      ref={cameraControlsRef}
      smoothTime={0.8}
      draggingSmoothTime={0.1}
    />
  );
}

/**
 * Glowing 3D Hotspot Pin Mesh
 */
function HotspotPin({ color = "#3b82f6" }: { color?: string }) {
  const pinRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pinRef.current) {
      const s = 1 + Math.sin(t * 4) * 0.15;
      pinRef.current.scale.set(s, s, s);
    }
    if (outerRingRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.2;
      outerRingRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      <mesh ref={pinRef}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.007, 12, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Floating CAD Callout Component (<Html occlude="blending" distanceFactor={10}> + SVG Leader Line)
 */
function CADCalloutLabel({
  position,
  label,
  value,
  color = "#3b82f6",
}: {
  position: [number, number, number];
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <group position={position}>
      <HotspotPin color={color} />
      <Html
        center
        distanceFactor={10}
        occlude="blending"
        style={{
          pointerEvents: "none",
          transition: "opacity 0.25s ease-out, transform 0.15s ease-out",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `1px solid ${color}80`,
            borderRadius: "8px",
            padding: "5px 12px",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxShadow: `0 4px 16px ${color}40`,
            transform: "translate(32px, -20px)",
          }}
        >
          <svg
            style={{
              position: "absolute",
              right: "100%",
              top: "50%",
              transform: "translateY(-50%)",
              width: "32px",
              height: "24px",
              overflow: "visible",
            }}
          >
            <line
              x1="0"
              y1="12"
              x2="32"
              y2="12"
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={0.6}
            />
            <circle cx="0" cy="12" r="3" fill={color} />
          </svg>

          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
          <span>{label}</span>
          <strong style={{ color }}>{value}</strong>
        </div>
      </Html>
    </group>
  );
}

/**
 * Brushed Metal Ramp Surface Mesh
 */
function BrushedMetalRamp() {
  return (
    <mesh castShadow receiveShadow position={[1.6, 0, 0]}>
      <boxGeometry args={[3.2, 0.1, 1.15]} />
      <meshPhysicalMaterial
        color="#94a3b8"
        metalness={0.8}
        roughness={0.2}
        clearcoat={0.3}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
}

/**
 * Matte Industrial Load Block Mesh
 */
function MatteLoadBlock() {
  return (
    <mesh castShadow receiveShadow position={[1.2, 0.23, 0]}>
      <boxGeometry args={[0.42, 0.36, 0.42]} />
      <meshStandardMaterial
        color="#3f7a58"
        metalness={0.1}
        roughness={0.6}
      />
    </mesh>
  );
}

/**
 * Dynamic Glowing Force Vector Indicator Cone
 */
function GlowingForceVector({ length }: { length: number }) {
  const scaledLength = Math.max(0.2, Math.min(1.2, length * 0.02));
  return (
    <mesh position={[1.2, 0.3 + scaledLength / 2, 0]}>
      <coneGeometry args={[0.08, scaledLength, 16]} />
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#0284c7"
        emissiveIntensity={2.0}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Semi-Reflective Base Plane
 */
function SemiReflectiveBasePlane() {
  return (
    <mesh receiveShadow position={[0, -1.15, 0]}>
      <boxGeometry args={[4.6, 0.1, 2.4]} />
      <meshPhysicalMaterial
        color="#dce4ec"
        roughness={0.12}
        metalness={0.1}
        transmission={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/**
 * Complete R3F Mechanical Lab Component with Machine Selection & Smooth Camera Auto-Focus
 */
export function R3FMechanicalLab() {
  // Machine Selection State
  const [activeMachineId, setActiveMachineId] = useState<string>("inclined-plane");

  // Real-time parameters
  const [angle, setAngle] = useState(30);
  const [mu, setMu] = useState(0.1);
  const [mass, setMass] = useState(5);

  // Real-time Physics Calculations
  const physics = useMemo(() => {
    const g = 9.81;
    const weight = mass * g;
    const rad = (angle * Math.PI) / 180;
    const normal = weight * Math.cos(rad);
    const downslope = weight * Math.sin(rad);
    const friction = mu * normal;
    const effort = downslope + friction;
    const idealMA = 1 / Math.sin(rad);
    const actualMA = weight / effort;
    const height = Math.sin(rad) * 3.2;

    return {
      weight,
      normal,
      friction,
      effort,
      idealMA,
      actualMA,
      height,
      rad,
    };
  }, [angle, mu, mass]);

  const machineList = [
    { id: "inclined-plane", label: "Inclined Plane" },
    { id: "pulley", label: "Block & Tackle" },
    { id: "gears", label: "Gear Train" },
    { id: "lever", label: "Class I Lever" },
    { id: "wheel-axle", label: "Wheel & Axle" },
    { id: "screw", label: "Screw Jack" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: "16px",
        width: "100%",
        height: "620px",
        background: "#0f172a",
        borderRadius: "20px",
        padding: "16px",
        boxSizing: "border-box",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* 3D Viewport Canvas */}
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "14px", overflow: "hidden" }}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [2.2, 1.6, 4.8], fov: 42 }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
        >
          {/* Studio Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0001}
          />
          <Environment preset="city" />

          {/* 3. Bounds/Auto-Fit Fallback Integration */}
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.2}>
              <group position={[-1.3, -0.4, 0]} rotation={[0, 0, physics.rad]}>
                <BrushedMetalRamp />
                <MatteLoadBlock />
                <GlowingForceVector length={physics.effort} />

                {/* Real-Time Floating 3D CAD Callout Labels */}
                <CADCalloutLabel
                  position={[1.2, 0.48, 0]}
                  label="Normal N"
                  value={`${physics.normal.toFixed(1)} N`}
                  color="#38bdf8"
                />
                <CADCalloutLabel
                  position={[1.2, 0.85, 0]}
                  label="Effort force"
                  value={`${physics.effort.toFixed(1)} N`}
                  color="#ef4444"
                />
                <CADCalloutLabel
                  position={[0.8, 0.15, 0]}
                  label="Friction"
                  value={`${physics.friction.toFixed(1)} N`}
                  color="#f59e0b"
                />
                <CADCalloutLabel
                  position={[3.2, 0.4, 0]}
                  label="Height H"
                  value={`${physics.height.toFixed(2)} m`}
                  color="#10b981"
                />
              </group>

              <SemiReflectiveBasePlane />
            </Bounds>
          </Suspense>

          {/* 2. Camera Controls with Smooth Animated Camera Transitions */}
          <SmoothCameraFocus machineId={activeMachineId} />

          {/* Tuned Post-Processing Pipeline */}
          <EffectComposer enableNormalPass={false} multisampling={0}>
            {[
              <BloomEffect
                key="bloom"
                intensity={1.2}
                luminanceThreshold={0.85}
                luminanceSmoothing={0.9}
                mipmapBlur
              />,
              <SSAOEffect
                key="ssao"
                blendFunction={BlendFunction.MULTIPLY}
                samples={21}
                radius={0.05}
                intensity={12}
                luminanceInfluence={0.6}
                color={new THREE.Color(0x000000)}
              />,
              <VignetteEffect key="vignette" eskil={false} offset={0.1} darkness={0.5} />,
            ] as any}
          </EffectComposer>
        </Canvas>
      </div>

      {/* Sidebar Controls Panel */}
      <aside
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "20px",
          background: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(12px)",
          borderRadius: "14px",
          color: "#f8fafc",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#38bdf8" }}>
          Machine Presets
        </h3>

        {/* Machine Library Selector Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {machineList.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMachineId(m.id)}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: activeMachineId === m.id ? "#38bdf8" : "rgba(255,255,255,0.1)",
                background: activeMachineId === m.id ? "rgba(56,189,248,0.15)" : "rgba(15,23,42,0.4)",
                color: activeMachineId === m.id ? "#38bdf8" : "#94a3b8",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
          <h4 style={{ margin: 0, fontSize: "13px", color: "#e2e8f0" }}>Parameters</h4>

          {/* Angle Slider */}
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Ramp Angle θ</span>
              <strong>{angle}°</strong>
            </div>
            <input
              type="range"
              min={10}
              max={55}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              style={{ cursor: "pointer", accentColor: "#38bdf8" }}
            />
          </label>

          {/* Friction Slider */}
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Friction μ</span>
              <strong>{mu}</strong>
            </div>
            <input
              type="range"
              min={0}
              max={0.4}
              step={0.05}
              value={mu}
              onChange={(e) => setMu(Number(e.target.value))}
              style={{ cursor: "pointer", accentColor: "#f59e0b" }}
            />
          </label>

          {/* Mass Slider */}
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Load Mass</span>
              <strong>{mass} kg</strong>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              style={{ cursor: "pointer", accentColor: "#10b981" }}
            />
          </label>
        </div>

        {/* Live MA Readout Card */}
        <div
          style={{
            marginTop: "auto",
            padding: "14px",
            borderRadius: "10px",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
          }}
        >
          <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", marginBottom: "4px" }}>
            Mechanical Advantage
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "#38bdf8" }}>
            MA {physics.actualMA.toFixed(2)}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Ideal MA: {physics.idealMA.toFixed(2)}
          </div>
        </div>
      </aside>
    </div>
  );
}
