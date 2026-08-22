import { HeroSpline } from "@/components/hero-spline";
import { CurrentFocus } from "@/components/current-focus";

export default function Home() {
  return (
    <div className="container max-w-6xl py-6 md:py-10">
      <HeroSpline />
      <CurrentFocus />
    </div>
  );
}