import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import "./physics.css";
import { MachinesApp } from "@/components/education/physics/MachinesApp";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const ui = IBM_Plex_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mechanica Lab — Work, Energy & Simple Machines | Nabendu Blog",
  description:
    "Interactive 3D lab for CBSE Class 6–9: simple machines, Atwood’s machine, Pascal’s hydraulic press, and live force vectors.",
};

export default function PhysicsPage() {
  return (
    <div className={`${display.variable} ${ui.variable}`}>
      <MachinesApp />
    </div>
  );
}
