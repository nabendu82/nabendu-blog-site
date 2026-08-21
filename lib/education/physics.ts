/** Pure CBSE Class 7–9 simple-machine helpers. Units: kg, N, degrees, teeth. */

export const G = 9.8;

export function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export type InclinedResult = {
  weight: number;
  normal: number;
  parallel: number;
  friction: number;
  effort: number;
  maIdeal: number;
  maActual: number;
  lengthOverHeight: number;
};

/** Ideal MA of an inclined plane = L/H = 1/sin(θ). */
export function inclinedPlaneIdealMA(angleDeg: number) {
  const sin = Math.sin(degToRad(clamp(angleDeg, 1, 89)));
  return 1 / sin;
}

export function inclinedPlaneForces(
  massKg: number,
  angleDeg: number,
  mu = 0,
): InclinedResult {
  const theta = degToRad(clamp(angleDeg, 1, 89));
  const weight = massKg * G;
  const parallel = weight * Math.sin(theta);
  const normal = weight * Math.cos(theta);
  const friction = mu * normal;
  const effort = parallel + friction;
  const maIdeal = 1 / Math.sin(theta);
  const maActual = effort > 0 ? weight / effort : maIdeal;
  return {
    weight,
    normal,
    parallel,
    friction,
    effort,
    maIdeal,
    maActual,
    lengthOverHeight: maIdeal,
  };
}

/** Block-and-tackle: ideal MA ≈ number of supporting rope strands. */
export function pulleyIdealMA(strands: number) {
  return Math.max(1, Math.round(strands));
}

export function pulleyEffort(loadN: number, strands: number, efficiency = 1) {
  const ma = pulleyIdealMA(strands);
  const idealEffort = loadN / ma;
  return idealEffort / clamp(efficiency, 0.1, 1);
}

export type GearResult = {
  ratio: number;
  ma: number;
  driverAngle: number;
  drivenAngle: number;
  speedFactor: number;
  torqueFactor: number;
};

/**
 * Gear train: MA ≈ driven teeth / driver teeth.
 * Speed of driven = speed of driver × (driverTeeth / drivenTeeth).
 */
export function gearTrain(
  driverTeeth: number,
  drivenTeeth: number,
  driverAngleRad: number,
): GearResult {
  const nd = Math.max(8, Math.round(driverTeeth));
  const nn = Math.max(8, Math.round(drivenTeeth));
  const ratio = nn / nd;
  return {
    ratio,
    ma: ratio,
    driverAngle: driverAngleRad,
    drivenAngle: -driverAngleRad * (nd / nn),
    speedFactor: nd / nn,
    torqueFactor: ratio,
  };
}

export function workDone(forceN: number, distanceM: number) {
  return forceN * distanceM;
}

export type LeverResult = {
  maIdeal: number;
  effort: number;
  load: number;
  effortArm: number;
  loadArm: number;
};

/** Class I lever: MA = effort arm / load arm (ideal). */
export function leverForces(loadN: number, effortArm: number, loadArm: number): LeverResult {
  const ea = Math.max(0.1, effortArm);
  const la = Math.max(0.1, loadArm);
  const maIdeal = ea / la;
  return {
    maIdeal,
    effort: loadN / maIdeal,
    load: loadN,
    effortArm: ea,
    loadArm: la,
  };
}

export type WheelAxleResult = {
  maIdeal: number;
  effort: number;
  load: number;
  wheelR: number;
  axleR: number;
};

/** Wheel and axle: MA = R_wheel / R_axle (ideal). */
export function wheelAxleForces(loadN: number, wheelR: number, axleR: number): WheelAxleResult {
  const R = Math.max(0.15, wheelR);
  const r = Math.max(0.05, Math.min(axleR, R * 0.85));
  const maIdeal = R / r;
  return {
    maIdeal,
    effort: loadN / maIdeal,
    load: loadN,
    wheelR: R,
    axleR: r,
  };
}

export type ScrewResult = {
  maIdeal: number;
  effort: number;
  load: number;
  pitch: number;
  circumference: number;
};

/** Screw: MA ≈ 2πR / pitch (ideal), pitch in same length units as radius. */
export function screwForces(loadN: number, handleR: number, pitch: number): ScrewResult {
  const R = Math.max(0.1, handleR);
  const p = Math.max(0.02, pitch);
  const circumference = 2 * Math.PI * R;
  const maIdeal = circumference / p;
  return {
    maIdeal,
    effort: loadN / maIdeal,
    load: loadN,
    pitch: p,
    circumference,
  };
}

export function formatN(value: number, digits = 1) {
  return `${value.toFixed(digits)} N`;
}

export function formatMA(value: number) {
  return value.toFixed(2);
}
