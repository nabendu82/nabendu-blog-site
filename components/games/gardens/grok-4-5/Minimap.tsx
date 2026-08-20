"use client";

import { useEffect, useRef } from "react";
import type { JungleLayout } from "./maze";

type MinimapProps = {
  maze: JungleLayout;
  player: { x: number; z: number; yaw: number };
  size?: number;
};

/**
 * Atmospheric Indian Monsoon Jungle Minimap (top-right overlay).
 * Shows only the forest boundary, the pond, the exit gateway, and the player.
 * No paths shown — the player must explore to find the correct route.
 */
export function Minimap({ maze, player, size = 175 }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = 6;
    const map = size - pad * 2;
    const toMap = (x: number, z: number) => ({
      mx: pad + ((x + maze.gardenHalf) / (maze.gardenHalf * 2)) * map,
      my: pad + ((z + maze.gardenHalf) / (maze.gardenHalf * 2)) * map,
    });

    // Background & Outer Boundary Ring
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(12, 20, 15, 0.88)";
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Jungle Boundary Disc (Deep Loam & Rainforest Green)
    const center = toMap(0, 0);
    const radiusMap = (maze.gardenHalf / (maze.gardenHalf * 2)) * map;
    ctx.fillStyle = "#162b1b";
    ctx.beginPath();
    ctx.arc(center.mx, center.my, radiusMap, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(80, 140, 90, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 1. Organic Freshwater Pond
    if (maze.pond) {
      const pondCenter = toMap(maze.pond.centerX, maze.pond.centerZ);
      const pr = (maze.pond.radius / (maze.gardenHalf * 2)) * map;

      ctx.fillStyle = "#00897b";
      ctx.beginPath();
      ctx.arc(pondCenter.mx, pondCenter.my, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4db6ac";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Lily pads on Pond
      ctx.fillStyle = "#1b5e20";
      maze.pond.lilyPads.forEach((lp) => {
        const pt = toMap(lp.x, lp.z);
        ctx.beginPath();
        ctx.arc(pt.mx, pt.my, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 3. Ancient Stone Temple Gateway (Bright Cyan Exit Beacon) — Only landmark shown
    const exitPt = toMap(maze.stoneGatewayPos[0], maze.stoneGatewayPos[2]);
    ctx.fillStyle = "#00e676";
    ctx.beginPath();
    ctx.arc(exitPt.mx, exitPt.my, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#64ffda";
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // 7. Player Marker Arrow & Sight Field
    const pl = toMap(player.x, player.z);
    ctx.save();
    ctx.translate(pl.mx, pl.my);
    ctx.rotate(player.yaw);

    // Sight Field Cone
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 14, -Math.PI / 3 - Math.PI / 2, Math.PI / 3 - Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    // Player Arrow
    ctx.fillStyle = "#69f0ae";
    ctx.beginPath();
    ctx.moveTo(0, -6.5);
    ctx.lineTo(4, 4.5);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-4, 4.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Header Label
    ctx.fillStyle = "rgba(240, 255, 240, 0.9)";
    ctx.font = "bold 9px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("MONSOON JUNGLE · EXIT", pad + 4, pad + 10);
  }, [maze, player, size]);

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-xl shadow-2xl backdrop-blur-md">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: "block" }}
        aria-label="Jungle Minimap"
      />
    </div>
  );
}
