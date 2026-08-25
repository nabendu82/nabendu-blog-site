export type MachineId =
  | "inclined-plane"
  | "pulley"
  | "gears"
  | "lever"
  | "wheel-axle"
  | "screw"
  | "wedge"
  | "wheelbarrow"
  | "tongs"
  | "atwood"
  | "hydraulic";

export type Hotspot = {
  id: string;
  label: string;
  detail: string;
  color: string;
  pos: [number, number, number];
};

export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
};

export type RealWorldExample = {
  title: string;
  description: string;
  tag: string;
};

export type Machine = {
  id: MachineId;
  name: string;
  scientificName: string;
  system: string;
  icon: string;
  accent: string;
  description: string;
  poetic: string;
  formula: string;
  maNote: string;
  cbseFocus: string;
  workLink: string;
  funFact: string;
  misconception: string;
  realWorld: RealWorldExample[];
  hotspots: Hotspot[];
  lesson: {
    title: string;
    paragraphs: string[];
    bullets: string[];
  };
  quiz: QuizQuestion[];
  controls: {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    unit: string;
    defaultValue: number;
  }[];
};

export const machines: Machine[] = [
  {
    id: "inclined-plane",
    name: "Inclined Plane",
    scientificName: "Inclined plane assembly",
    system: "Simple Machines",
    icon: "⟋",
    accent: "#c4922a",
    description:
      "A sloping surface that lets you raise a load with less effort than lifting it straight up — trading a longer path for a gentler force.",
    poetic: "The gentle climb",
    formula: "MA = L / H = 1 / sin(θ)",
    maNote: "Ideal mechanical advantage grows as the ramp gets longer (or flatter).",
    cbseFocus:
      "Class 7–9: an inclined plane is a simple machine. Effort moves along the slope; load rises vertically. Work input ≈ work output when friction is ignored.",
    workLink:
      "Work done against gravity is mgh. On a ramp you apply a smaller force over a longer distance — energy is conserved, not created.",
    funFact:
      "Ancient builders used ramps to raise stone blocks — the same MA idea you use when wheeling a suitcase up a slope instead of lifting it.",
    misconception:
      "A ramp does not reduce the work you must do against gravity; it reduces the effort force by increasing the distance.",
    realWorld: [
      { title: "Wheelchair Ramp", description: "Provides accessible slope for wheelchairs.", tag: "Architecture" },
      { title: "Truck Cargo Ramp", description: "Slide heavy boxes up into delivery vans.", tag: "Logistics" },
      { title: "Mountain Road", description: "Zig-zag paths decrease slope angle for vehicles.", tag: "Civil Eng" },
    ],
    hotspots: [
      { id: "ramp", label: "Ramp surface", detail: "Length L along which effort acts", color: "#2a7ab0", pos: [0.3, 0.4, 0.2] },
      { id: "height", label: "Height H", detail: "Vertical rise of the load", color: "#c4922a", pos: [1.3, 0.5, 0] },
      { id: "block", label: "Load block", detail: "Weight mg acting downward", color: "#3d6b4f", pos: [0.1, 0.55, 0] },
      { id: "effort", label: "Effort force", detail: "Force parallel to the ramp", color: "#b54a3c", pos: [0.7, 0.9, 0] },
    ],
    lesson: {
      title: "Inclined planes & mechanical advantage",
      paragraphs: [
        "An inclined plane is a flat surface tilted at an angle θ to the horizontal. Instead of lifting a load straight up through height H, you push it along the longer length L of the slope.",
        "If friction is neglected, work input equals work output: Effort × L = Load × H. Rearranging gives MA = Load / Effort = L / H = 1 / sin(θ).",
        "Friction increases the effort needed, so real MA is smaller than ideal MA. Efficiency = (useful work output / work input) × 100%.",
      ],
      bullets: [
        "Resolve weight into components parallel and perpendicular to the ramp.",
        "Normal force N = mg cos(θ); parallel component = mg sin(θ).",
        "Ideal MA is large for gentle slopes and approaches 1 as θ → 90°.",
      ],
    },
    quiz: [
      {
        prompt: "Ideal MA of an inclined plane equals:",
        options: ["sin(θ)", "L / H", "H / L", "mg"],
        answer: 1,
        explain: "MA = L/H = 1/sin(θ) when friction is ignored.",
      },
      {
        prompt: "A ramp reduces the effort force mainly by:",
        options: [
          "Reducing the load’s weight",
          "Increasing distance over which force acts",
          "Creating extra energy",
          "Removing gravity",
        ],
        answer: 1,
        explain: "Work ≈ force × distance; longer path → smaller force for the same work.",
      },
      {
        prompt: "Component of weight parallel to a frictionless ramp is:",
        options: ["mg cos(θ)", "mg sin(θ)", "mg tan(θ)", "mg"],
        answer: 1,
        explain: "The downslope component is mg sin(θ).",
      },
    ],
    controls: [
      { key: "angle", label: "Angle θ", min: 10, max: 55, step: 1, unit: "°", defaultValue: 30 },
      { key: "mu", label: "Friction μ", min: 0, max: 0.4, step: 0.05, unit: "", defaultValue: 0.1 },
      { key: "mass", label: "Mass", min: 1, max: 20, step: 1, unit: "kg", defaultValue: 5 },
    ],
  },
  {
    id: "pulley",
    name: "Block & Tackle",
    scientificName: "Block and tackle system",
    system: "Simple Machines",
    icon: "⌀",
    accent: "#2a7ab0",
    description:
      "A system of fixed and movable pulleys where several rope strands share the load, so each strand — and your pull — carries only a fraction of the weight.",
    poetic: "Many strands, one lift",
    formula: "MA ≈ n (supporting strands)",
    maNote: "More supporting strands → smaller effort, longer rope to pull.",
    cbseFocus:
      "Class 8–9: single fixed pulley changes direction (MA ≈ 1). Movable / block-and-tackle systems multiply force. Velocity ratio equals strand count in the ideal case.",
    workLink:
      "If you pull rope distance d with effort E, load rises by roughly d/n. Work in ≈ E·d; work out ≈ Load·(d/n).",
    funFact:
      "Shipyards and theatre fly systems still use block-and-tackle so a small crew can hoist heavy scenery or cargo.",
    misconception:
      "Adding pulleys does not invent energy — you pull more rope for the same rise, so work stays comparable (minus friction losses).",
    realWorld: [
      { title: "Construction Crane", description: "Multi-strand pulley system hoisting steel girders.", tag: "Heavy Industry" },
      { title: "Sailboat Rigging", description: "Hoists heavy sails with manageable hand tension.", tag: "Maritime" },
      { title: "Elevator Counterweight", description: "Balanced pulley loops carrying passenger cabs.", tag: "Urban Infra" },
    ],
    hotspots: [
      { id: "fixed", label: "Fixed pulley", detail: "Changes rope direction", color: "#2a7ab0", pos: [0, 1.35, 0] },
      { id: "movable", label: "Movable block", detail: "Rises with the load", color: "#c4922a", pos: [0, -0.4, 0] },
      { id: "strands", label: "Supporting strands", detail: "Share the load weight", color: "#3d6b4f", pos: [-0.2, 0.4, 0.1] },
      { id: "effort", label: "Effort end", detail: "Force you apply on the free rope", color: "#b54a3c", pos: [0.4, 0.7, 0] },
    ],
    lesson: {
      title: "Pulleys and block-and-tackle",
      paragraphs: [
        "A fixed pulley mainly changes the direction of force — ideal MA is about 1. A movable pulley moves with the load and can give MA ≈ 2.",
        "A block-and-tackle combines fixed and movable pulleys. Ideal MA equals the number of rope strands supporting the movable block.",
        "Velocity ratio (VR) is distance moved by effort / distance moved by load. For an ideal frictionless system MA = VR = n.",
      ],
      bullets: [
        "Effort E ≈ Load / n for n supporting strands (ideal).",
        "You pull a longer length of rope as n increases.",
        "Friction and rope stiffness lower real efficiency.",
      ],
    },
    quiz: [
      {
        prompt: "Ideal MA of a block-and-tackle with 4 supporting strands is:",
        options: ["1", "2", "4", "8"],
        answer: 2,
        explain: "Ideal MA equals the number of supporting strands.",
      },
      {
        prompt: "A single fixed pulley mainly:",
        options: [
          "Doubles the load",
          "Changes direction of effort",
          "Removes gravity",
          "Stores energy",
        ],
        answer: 1,
        explain: "Fixed pulleys redirect force; MA ≈ 1.",
      },
      {
        prompt: "If MA = 4 and load = 200 N, ideal effort is:",
        options: ["800 N", "200 N", "50 N", "25 N"],
        answer: 2,
        explain: "Effort = Load / MA = 200 / 4 = 50 N.",
      },
    ],
    controls: [
      { key: "strands", label: "Strands n", min: 2, max: 6, step: 2, unit: "", defaultValue: 4 },
      { key: "load", label: "Load", min: 50, max: 400, step: 10, unit: "N", defaultValue: 200 },
      { key: "efficiency", label: "Efficiency", min: 0.6, max: 1, step: 0.05, unit: "", defaultValue: 0.9 },
    ],
  },
  {
    id: "gears",
    name: "Gear Train",
    scientificName: "Gear train assembly",
    system: "Simple Machines",
    icon: "⚙",
    accent: "#3d6b4f",
    description:
      "Meshing toothed wheels that trade speed for torque. A small driver turning a larger driven gear slows the output but multiplies turning force.",
    poetic: "Teeth that talk",
    formula: "MA ≈ T_driven / T_driver",
    maNote: "More teeth on the driven gear → higher torque, lower angular speed.",
    cbseFocus:
      "Linked to wheel-and-axle / machines that change force and speed. Gear ratio = teeth driven ÷ teeth driver. Directions reverse with each mesh.",
    workLink:
      "Power is roughly conserved in an ideal mesh: high speed × low torque ↔ low speed × high torque. Work over time stays consistent aside from losses.",
    funFact:
      "Bicycle gears let you climb hills in a low gear (high MA) and race on flats in a high gear (speed over torque).",
    misconception:
      "Gears do not create energy — a higher torque output always comes with a slower rotation of that shaft.",
    realWorld: [
      { title: "Bicycle Drivetrain", description: "Chainrings and cassette sprockets trade speed vs torque.", tag: "Transport" },
      { title: "Mechanical Watch", description: "Precision gear train regulates timekeeping speed.", tag: "Horology" },
      { title: "Car Transmission", description: "Multi-gear ratios multiply torque for hill climbing.", tag: "Automotive" },
    ],
    hotspots: [
      { id: "driver", label: "Driver gear", detail: "Gear you turn (input)", color: "#c4922a", pos: [-0.6, 0.2, 0] },
      { id: "driven", label: "Driven gear", detail: "Output gear receiving torque", color: "#2a7ab0", pos: [0.7, 0.2, 0] },
      { id: "mesh", label: "Mesh point", detail: "Where teeth transfer force", color: "#3d6b4f", pos: [0.05, 0.2, 0.05] },
      { id: "ratio", label: "Gear ratio", detail: "T_driven / T_driver", color: "#b54a3c", pos: [0.7, 0.5, 0] },
    ],
    lesson: {
      title: "Gears, ratio & mechanical advantage",
      paragraphs: [
        "When two gears mesh, they rotate in opposite directions. The linear speed at the pitch circle is the same, so angular speeds are inversely proportional to the number of teeth.",
        "Gear ratio = T_driven / T_driver. Ideal MA for torque is the same ratio: a larger driven gear turns slower but can deliver greater torque.",
        "This is the same trade-off as other simple machines — you never get something for nothing; you exchange speed and force.",
      ],
      bullets: [
        "ω_driven / ω_driver = T_driver / T_driven.",
        "Torque_driven / Torque_driver ≈ T_driven / T_driver (ideal).",
        "Idler gears change direction without changing overall ratio magnitude.",
      ],
    },
    quiz: [
      {
        prompt: "Driver has 20 teeth, driven has 60. Ideal MA is about:",
        options: ["1/3", "1", "3", "60"],
        answer: 2,
        explain: "MA ≈ 60/20 = 3.",
      },
      {
        prompt: "If the driven gear is larger, its angular speed is:",
        options: ["Higher", "Lower", "Unchanged", "Zero"],
        answer: 1,
        explain: "Larger gear turns slower for the same pitch-line speed.",
      },
      {
        prompt: "Two meshing gears rotate:",
        options: [
          "In the same direction",
          "In opposite directions",
          "Only when identical",
          "Without touching",
        ],
        answer: 1,
        explain: "External mesh reverses rotation direction.",
      },
    ],
    controls: [
      { key: "driverTeeth", label: "Driver teeth", min: 12, max: 24, step: 2, unit: "", defaultValue: 16 },
      { key: "drivenTeeth", label: "Driven teeth", min: 24, max: 48, step: 2, unit: "", defaultValue: 32 },
    ],
  },
  {
    id: "lever",
    name: "Lever",
    scientificName: "Class I Lever assembly",
    system: "Simple Machines",
    icon: "⊥",
    accent: "#b54a3c",
    description:
      "A rigid bar that turns about a fulcrum. Moving the effort farther from the fulcrum multiplies force on the load.",
    poetic: "Balance of arms",
    formula: "MA = Effort arm / Load arm",
    maNote: "Longer effort arm (or shorter load arm) gives a larger mechanical advantage.",
    cbseFocus:
      "Class 7–9: levers are Class I, II, or III by fulcrum–load–effort order. Seesaw and crowbar are Class I examples.",
    workLink:
      "In an ideal lever, Effort × effort arm = Load × load arm. Work in still equals work out — you push farther when MA is high.",
    funFact:
      "Your forearm is a Class III lever: the biceps insert between elbow fulcrum and the load in your hand.",
    misconception:
      "A lever does not create energy. A high MA means you move the effort end through a larger distance.",
    realWorld: [
      { title: "Scissors & Shears", description: "Class I double lever pivoting around central rivet.", tag: "Tools" },
      { title: "Wheelbarrow", description: "Class II lever putting heavy load between wheel fulcrum and handles.", tag: "Construction" },
      { title: "Crowbar", description: "Class I lever delivering massive prying force.", tag: "Hardware" },
    ],
    hotspots: [
      { id: "fulcrum", label: "Fulcrum", detail: "Pivot point of the bar", color: "#c4922a", pos: [0, -0.2, 0] },
      { id: "load", label: "Load", detail: "Force you want to move", color: "#3d6b4f", pos: [-1.2, 0.2, 0] },
      { id: "effort", label: "Effort", detail: "Force you apply", color: "#b54a3c", pos: [1.4, 0.4, 0] },
      { id: "arms", label: "Lever arms", detail: "Distances from fulcrum", color: "#2a7ab0", pos: [0.5, 0.1, 0] },
    ],
    lesson: {
      title: "Levers & mechanical advantage",
      paragraphs: [
        "A lever is a rigid bar free to rotate about a fulcrum. Ideal MA equals the ratio of effort arm to load arm.",
        "Class I levers have the fulcrum between load and effort (seesaw, scissors). Class II have the load between fulcrum and effort (wheelbarrow). Class III have the effort between fulcrum and load (tweezers, forearm).",
        "Moment (torque) balance: Effort × d_E = Load × d_L when the lever is in equilibrium.",
      ],
      bullets: [
        "MA = d_effort / d_load for an ideal lever.",
        "Crowbars and pliers use a long effort arm for large MA.",
        "Velocity ratio equals the same arm ratio when friction is ignored.",
      ],
    },
    quiz: [
      {
        prompt: "Ideal MA of a lever is:",
        options: ["Load × Effort", "Effort arm / Load arm", "Load arm / Effort arm", "mgh"],
        answer: 1,
        explain: "MA = effort arm ÷ load arm.",
      },
      {
        prompt: "A seesaw is usually which class of lever?",
        options: ["Class I", "Class II", "Class III", "Not a lever"],
        answer: 0,
        explain: "Fulcrum sits between the two efforts/loads — Class I.",
      },
      {
        prompt: "If effort arm = 2 m and load arm = 0.5 m, MA is:",
        options: ["0.25", "1", "2", "4"],
        answer: 3,
        explain: "MA = 2 / 0.5 = 4.",
      },
    ],
    controls: [
      { key: "effortArm", label: "Effort arm", min: 0.8, max: 2.4, step: 0.1, unit: " m", defaultValue: 1.6 },
      { key: "loadArm", label: "Load arm", min: 0.4, max: 1.6, step: 0.1, unit: " m", defaultValue: 0.8 },
      { key: "load", label: "Load", min: 50, max: 400, step: 10, unit: " N", defaultValue: 200 },
    ],
  },
  {
    id: "wheel-axle",
    name: "Wheel & Axle",
    scientificName: "Wheel and axle system",
    system: "Simple Machines",
    icon: "◎",
    accent: "#6b5b95",
    description:
      "A large wheel fixed to a smaller axle. Turning the rim with a small force can lift a heavy load wound on the axle.",
    poetic: "Big circle, strong pull",
    formula: "MA = R_wheel / R_axle",
    maNote: "A larger wheel (or thinner axle) increases mechanical advantage.",
    cbseFocus:
      "Class 8–9: wheel and axle is a rotating lever. Steering wheels, windlasses, and door knobs are everyday examples.",
    workLink:
      "One turn of the wheel moves the rim through 2πR but the axle rope only 2πr — smaller force over a longer path.",
    funFact:
      "A ship’s steering wheel is a big wheel-and-axle so a helmsman can turn a heavy rudder with manageable effort.",
    misconception:
      "A bigger wheel does not invent energy; the axle turns more slowly for the same hand speed at the rim.",
    realWorld: [
      { title: "Car Steering Wheel", description: "Large diameter wheel lets driver easily pivot heavy front tires.", tag: "Automotive" },
      { title: "Water Well Winch", description: "Hand crank wheel lifting bucket filled with heavy water.", tag: "Agriculture" },
      { title: "Door Knob & Spindle", description: "Wide knob turns small internal latch spindle effortlessly.", tag: "Architecture" },
    ],
    hotspots: [
      { id: "wheel", label: "Wheel rim", detail: "Where effort acts", color: "#c4922a", pos: [0, 0, 0.35] },
      { id: "axle", label: "Axle", detail: "Smaller radius lifting the load", color: "#2a7ab0", pos: [0, 0, -0.2] },
      { id: "rope", label: "Load rope", detail: "Wound on the axle", color: "#3d6b4f", pos: [0, -0.8, -0.2] },
      { id: "handle", label: "Effort handle", detail: "Grab to turn the wheel", color: "#b54a3c", pos: [0.9, 0.9, 0.35] },
    ],
    lesson: {
      title: "Wheel and axle",
      paragraphs: [
        "A wheel and axle consists of two cylinders of different radii sharing one axis. Effort on the large wheel produces a larger force at the small axle.",
        "Ideal MA = R / r. It is like a continuous lever: the effort arm is the wheel radius and the load arm is the axle radius.",
        "If friction is present, real MA is smaller and efficiency drops below 100%.",
      ],
      bullets: [
        "MA = R_wheel / R_axle (ideal).",
        "One revolution: effort travels 2πR, load rises 2πr.",
        "Door knobs and screwdriver handles use the same idea.",
      ],
    },
    quiz: [
      {
        prompt: "Ideal MA of a wheel and axle is:",
        options: ["R + r", "R / r", "r / R", "2πR"],
        answer: 1,
        explain: "MA = wheel radius ÷ axle radius.",
      },
      {
        prompt: "If R = 40 cm and r = 10 cm, MA is:",
        options: ["0.25", "2", "4", "50"],
        answer: 2,
        explain: "40 / 10 = 4.",
      },
      {
        prompt: "A windlass is mainly a:",
        options: ["Pulley only", "Wheel and axle", "Screw", "Wedge"],
        answer: 1,
        explain: "A windlass uses a large crank/wheel on a smaller drum (axle).",
      },
    ],
    controls: [
      { key: "wheelR", label: "Wheel radius", min: 0.8, max: 1.6, step: 0.1, unit: " m", defaultValue: 1.2 },
      { key: "axleR", label: "Axle radius", min: 0.2, max: 0.6, step: 0.05, unit: " m", defaultValue: 0.3 },
      { key: "load", label: "Load", min: 50, max: 400, step: 10, unit: " N", defaultValue: 200 },
    ],
  },
  {
    id: "screw",
    name: "Screw",
    scientificName: "Screw jack mechanism",
    system: "Simple Machines",
    icon: "⌁",
    accent: "#2f6f6a",
    description:
      "An inclined plane wrapped around a cylinder. Turning the handle a full circle advances the screw by one pitch — a tiny rise for a large force.",
    poetic: "The spiral ramp",
    formula: "MA ≈ 2πR / pitch",
    maNote: "A finer pitch (or longer handle) gives a larger mechanical advantage.",
    cbseFocus:
      "Class 8–9: a screw is an inclined plane wound on a rod. Screw jacks and bottle-cap threads are standard exam examples.",
    workLink:
      "One turn: effort moves about 2πR while the load rises by the pitch. Small pitch → large MA, slow lift.",
    funFact:
      "Car jacks use a screw so a person can lift part of a vehicle with a short handle and many turns.",
    misconception:
      "A screw jack does not make work free — you turn the handle many times for a small lift, trading distance for force.",
    realWorld: [
      { title: "Car Scissor Jack", description: "Lifts tons of vehicle weight with hand wrench turns.", tag: "Automotive" },
      { title: "Bench Vice Clamp", description: "Applies immense clamping pressure on metal workpieces.", tag: "Workshop" },
      { title: "Spiral Bottle Cap", description: "Helical thread seals bottles airtight with low wrist force.", tag: "Consumer" },
    ],
    hotspots: [
      { id: "thread", label: "Screw thread", detail: "Inclined plane wrapped around", color: "#2a7ab0", pos: [0, 0.2, 0] },
      { id: "pitch", label: "Pitch", detail: "Advance per revolution", color: "#c4922a", pos: [0.2, -0.2, 0] },
      { id: "handle", label: "Handle", detail: "Effort radius R", color: "#b54a3c", pos: [0.7, -0.7, 0] },
      { id: "load", label: "Load platform", detail: "Weight being raised", color: "#3d6b4f", pos: [0, 1.1, 0] },
    ],
    lesson: {
      title: "Screws as wrapped inclined planes",
      paragraphs: [
        "A screw thread is an inclined plane wrapped around a cylinder. The pitch is the distance between consecutive threads — how far the screw advances in one full turn.",
        "Ideal MA ≈ 2πR / pitch, where R is the effort radius (handle length). Finer threads and longer handles increase MA.",
        "Friction in threads is often large, so real efficiency of screw jacks can be low — but they hold position well.",
      ],
      bullets: [
        "Pitch = axial advance per revolution.",
        "MA ≈ circumference of effort path ÷ pitch.",
        "Bottle lids and vices use the same principle.",
      ],
    },
    quiz: [
      {
        prompt: "Ideal MA of a screw is roughly:",
        options: ["pitch / 2πR", "2πR / pitch", "R / pitch", "2π × pitch"],
        answer: 1,
        explain: "MA ≈ 2πR ÷ pitch.",
      },
      {
        prompt: "Pitch of a screw means:",
        options: [
          "Handle length",
          "Thread depth only",
          "Advance in one revolution",
          "Number of turns",
        ],
        answer: 2,
        explain: "Pitch is the axial distance advanced per full turn.",
      },
      {
        prompt: "A screw is essentially a wrapped:",
        options: ["Pulley", "Lever", "Inclined plane", "Gear"],
        answer: 2,
        explain: "The thread is an inclined plane around a cylinder.",
      },
    ],
    controls: [
      { key: "handleR", label: "Handle radius", min: 0.4, max: 1.2, step: 0.1, unit: " m", defaultValue: 0.8 },
      { key: "pitch", label: "Pitch", min: 0.05, max: 0.25, step: 0.01, unit: " m", defaultValue: 0.1 },
      { key: "load", label: "Load", min: 100, max: 800, step: 20, unit: " N", defaultValue: 400 },
    ],
  },
  {
    id: "wedge",
    name: "Wedge",
    scientificName: "Splitting wedge / axe",
    system: "Simple Machines",
    icon: "▲",
    accent: "#8a5a32",
    description:
      "Two inclined planes back to back. A thin edge driven into wood converts a downward blow into a sideways split — knives, axes, and nails all use this shape.",
    poetic: "The splitting edge",
    formula: "MA = L / T",
    maNote: "A longer, thinner wedge (large L / small thickness T) needs less effort to split.",
    cbseFocus:
      "Class 6–8: the wedge is the sixth simple machine. It is an inclined plane used to separate objects. Knives, axes, nails, and ploughshares are standard examples.",
    workLink:
      "You push the wedge a long way along its slope; the wood only opens by the thickness. Work in ≈ work out — the force is multiplied, not created.",
    funFact:
      "A kitchen knife is a very thin wedge. Sharpening it reduces thickness T, which raises MA so the same hand force cuts more easily.",
    misconception:
      "A sharper wedge does not make cutting ‘free’. You still do work; the blade just concentrates force onto a smaller thickness.",
    realWorld: [
      { title: "Axe & Log", description: "Splitting firewood with a metal wedge driven by a mallet.", tag: "Tools" },
      { title: "Kitchen Knife", description: "Thin blade converts a downward cut into a sideways split of food.", tag: "Home" },
      { title: "Nail & Plough", description: "Pointed wedge tips pierce wood or soil with less effort.", tag: "Farm & Craft" },
    ],
    hotspots: [
      { id: "edge", label: "Sharp edge", detail: "Thin end that enters the wood", color: "#2a7ab0", pos: [0.1, -0.2, 0] },
      { id: "slope", label: "Slope L", detail: "Length of the inclined faces", color: "#c4922a", pos: [0.15, 0.4, 0] },
      { id: "thick", label: "Thickness T", detail: "Width of the blunt end", color: "#3d6b4f", pos: [0.35, 0.1, 0] },
      { id: "log", label: "Load / wood", detail: "Material being split", color: "#b54a3c", pos: [0.5, -0.7, 0] },
    ],
    lesson: {
      title: "Wedges as double inclined planes",
      paragraphs: [
        "A wedge is two inclined planes joined at a sharp edge. When you drive it into a log, the effort acts along the slope while the wood is forced apart sideways.",
        "Ideal MA ≈ length of the slope L divided by the thickness T of the thick end. A long thin wedge has high MA; a short fat one has low MA.",
        "Friction against the faces is large, so real efficiency is often low — but the wedge holds itself in the cut, which is useful for splitting.",
      ],
      bullets: [
        "MA = L / T (ideal).",
        "Knives, axes, nails, and chisels are wedges.",
        "Sharper (thinner) tools raise MA by reducing T.",
      ],
    },
    quiz: [
      {
        prompt: "Ideal MA of a wedge is:",
        options: ["T / L", "L / T", "L × T", "2πL / T"],
        answer: 1,
        explain: "MA equals slope length divided by thickness.",
      },
      {
        prompt: "A knife is mainly which simple machine?",
        options: ["Pulley", "Wheel and axle", "Wedge", "Screw"],
        answer: 2,
        explain: "A blade is a thin wedge.",
      },
      {
        prompt: "Making a wedge thinner (smaller T) will:",
        options: ["Lower MA", "Raise MA", "Remove friction", "Change gravity"],
        answer: 1,
        explain: "MA = L/T, so smaller T means larger MA.",
      },
    ],
    controls: [
      { key: "length", label: "Slope L", min: 0.5, max: 1.2, step: 0.05, unit: " m", defaultValue: 0.8 },
      { key: "thickness", label: "Thickness T", min: 0.1, max: 0.4, step: 0.02, unit: " m", defaultValue: 0.22 },
      { key: "load", label: "Resistance", min: 100, max: 600, step: 20, unit: " N", defaultValue: 300 },
    ],
  },
  {
    id: "wheelbarrow",
    name: "Wheelbarrow",
    scientificName: "Class II lever",
    system: "Simple Machines",
    icon: "⊏",
    accent: "#3d6b4f",
    description:
      "A Class II lever: the wheel is the fulcrum, the load sits in the tray, and you lift at the handles. The load is between fulcrum and effort, so MA is greater than 1.",
    poetic: "Load in the middle",
    formula: "MA = Effort arm / Load arm",
    maNote: "Longer handles (or a load closer to the wheel) make the barrow easier to lift.",
    cbseFocus:
      "Class 7–9: Class II levers have load between fulcrum and effort. Wheelbarrow, nutcracker, and bottle opener are the usual exam examples.",
    workLink:
      "You lift the handles through a larger arc than the tray rises. Effort × large arm = Load × small arm when the barrow is just leaving the ground.",
    funFact:
      "A wheelbarrow is both a Class II lever and a wheel-and-axle: the wheel also lets you roll the load instead of carrying it.",
    misconception:
      "The wheel does not cancel the load’s weight. You still support part of the weight at the handles — the lever just reduces that part.",
    realWorld: [
      { title: "Garden Wheelbarrow", description: "Move soil and bricks by lifting handles, not the tray.", tag: "Garden" },
      { title: "Nutcracker", description: "Class II lever crushing a nut between fulcrum and handles.", tag: "Kitchen" },
      { title: "Bottle Opener", description: "Cap is the load between the lip fulcrum and your hand.", tag: "Home" },
    ],
    hotspots: [
      { id: "wheel", label: "Wheel (fulcrum)", detail: "Pivot where the barrow turns", color: "#c4922a", pos: [-1.15, -0.85, 0] },
      { id: "tray", label: "Load in tray", detail: "Weight between wheel and handles", color: "#3d6b4f", pos: [-0.3, -0.25, 0] },
      { id: "handles", label: "Effort handles", detail: "Where you lift", color: "#b54a3c", pos: [1.1, -0.5, 0] },
      { id: "arms", label: "Lever arms", detail: "Distances from the wheel", color: "#2a7ab0", pos: [0.2, -0.55, 0] },
    ],
    lesson: {
      title: "Class II levers — wheelbarrow",
      paragraphs: [
        "In a Class II lever the load sits between the fulcrum and the effort. For a wheelbarrow the fulcrum is the wheel axle, the load is in the tray, and effort is at the handles.",
        "Ideal MA = effort arm / load arm, and this is always greater than 1 because the handles are farther from the wheel than the tray is.",
        "Compare with Class I (fulcrum in the middle, like a seesaw) and Class III (effort in the middle, like tongs).",
      ],
      bullets: [
        "Order: fulcrum — load — effort.",
        "MA > 1: you gain force, lose distance.",
        "Nutcrackers and doors (hinge + handle) are also Class II.",
      ],
    },
    quiz: [
      {
        prompt: "In a wheelbarrow the fulcrum is the:",
        options: ["Handles", "Tray", "Wheel", "Ground only"],
        answer: 2,
        explain: "The wheel axle is the pivot (fulcrum).",
      },
      {
        prompt: "A wheelbarrow is which class of lever?",
        options: ["Class I", "Class II", "Class III", "Not a lever"],
        answer: 1,
        explain: "Load lies between fulcrum and effort — Class II.",
      },
      {
        prompt: "Moving the load closer to the wheel will:",
        options: ["Lower MA", "Raise MA", "Remove the fulcrum", "Increase gravity"],
        answer: 1,
        explain: "Smaller load arm raises MA = effort arm / load arm.",
      },
    ],
    controls: [
      { key: "effortArm", label: "Handle arm", min: 0.9, max: 2.0, step: 0.1, unit: " m", defaultValue: 1.4 },
      { key: "loadArm", label: "Load arm", min: 0.3, max: 1.0, step: 0.05, unit: " m", defaultValue: 0.55 },
      { key: "load", label: "Load", min: 50, max: 400, step: 10, unit: " N", defaultValue: 250 },
    ],
  },
  {
    id: "tongs",
    name: "Tongs",
    scientificName: "Class III lever",
    system: "Simple Machines",
    icon: ">",
    accent: "#b54a3c",
    description:
      "A Class III lever: the fulcrum is at the hinge, you squeeze in the middle, and the load is at the tips. MA is less than 1 — you trade force for a larger, faster grip.",
    poetic: "Effort in the middle",
    formula: "MA = Effort arm / Load arm (< 1)",
    maNote: "Class III levers sacrifice force to move the load through a bigger distance — useful for tongs, tweezers, and your forearm.",
    cbseFocus:
      "Class 7–9: Class III has effort between fulcrum and load. Fishing rod, tweezers, tongs, and the human forearm are the textbook set.",
    workLink:
      "Your squeeze travels a short distance near the hinge; the tips travel farther. Work is still effort × small distance ≈ load × large distance.",
    funFact:
      "Your biceps and forearm are a Class III lever: the elbow is the fulcrum, the muscle inserts in the middle, and the school bag is the load in your hand.",
    misconception:
      "MA < 1 does not mean the machine is ‘useless’. It multiplies speed and range of motion, which is what you want when picking up a hot pan.",
    realWorld: [
      { title: "Kitchen Tongs", description: "Lift a hot roti off the tawa: tips move farther than your squeeze.", tag: "Kitchen" },
      { title: "Tweezers", description: "Fine Class III lever for small loads at the tips.", tag: "Tools" },
      { title: "Human Forearm", description: "Biceps insert between elbow fulcrum and the hand load.", tag: "Biology" },
    ],
    hotspots: [
      { id: "pivot", label: "Hinge (fulcrum)", detail: "Where both arms join", color: "#c4922a", pos: [-1.15, -0.35, 0] },
      { id: "grip", label: "Effort", detail: "Where you squeeze", color: "#b54a3c", pos: [-0.7, -0.25, 0] },
      { id: "tips", label: "Roti at tips", detail: "Load held between the paddles", color: "#3d6b4f", pos: [0.9, -0.2, 0] },
      { id: "arms", label: "Arm lengths", detail: "Effort arm < load arm", color: "#2a7ab0", pos: [0, -0.35, 0] },
    ],
    lesson: {
      title: "Class III levers — tongs",
      paragraphs: [
        "In a Class III lever the effort is between the fulcrum and the load. Tongs, tweezers, and a fishing rod all work this way.",
        "Ideal MA = effort arm / load arm is less than 1. You apply more force than the tips deliver, but the tips move farther and faster.",
        "This is the opposite trade-off from a wheelbarrow. Both are still levers; they just sit in different classes.",
      ],
      bullets: [
        "Order: fulcrum — effort — load.",
        "MA < 1: gain distance/speed, lose force.",
        "The forearm is a living Class III lever.",
      ],
    },
    quiz: [
      {
        prompt: "In tongs, the effort is:",
        options: ["At the tips", "At the hinge", "Between hinge and tips", "On the floor"],
        answer: 2,
        explain: "You squeeze in the middle — Class III.",
      },
      {
        prompt: "Ideal MA of a Class III lever is usually:",
        options: ["Greater than 1", "Equal to 1 only", "Less than 1", "Infinite"],
        answer: 2,
        explain: "The effort arm is shorter than the load arm, so MA < 1.",
      },
      {
        prompt: "Your forearm lifting a bag is:",
        options: ["Class I", "Class II", "Class III", "A pulley"],
        answer: 2,
        explain: "Elbow fulcrum, biceps in the middle, load in the hand.",
      },
    ],
    controls: [
      { key: "effortArm", label: "Effort arm", min: 0.25, max: 0.7, step: 0.05, unit: " m", defaultValue: 0.45 },
      { key: "loadArm", label: "Load arm", min: 0.7, max: 1.4, step: 0.05, unit: " m", defaultValue: 1.1 },
      { key: "load", label: "Grip load", min: 10, max: 80, step: 5, unit: " N", defaultValue: 40 },
    ],
  },
  {
    id: "atwood",
    name: "Atwood Machine",
    scientificName: "Connected masses over a pulley",
    system: "Force & Motion",
    icon: "⚖",
    accent: "#2a7ab0",
    description:
      "Two masses hung over a pulley. The heavier one falls, the lighter one rises, and both share the same acceleration — a Class 9 way to see Newton’s second law.",
    poetic: "Two weights, one string",
    formula: "a = g (m₂ − m₁) / (m₁ + m₂)",
    maNote: "When the masses are nearly equal, acceleration is small and easy to time — that is why Atwood used it to study motion.",
    cbseFocus:
      "Class 9: force and laws of motion. A light frictionless pulley, inextensible string, two masses. Tension is the same; acceleration is common.",
    workLink:
      "Loss in PE of the heavier mass goes into KE of both masses plus gain in PE of the lighter one. Energy is conserved if the pulley is ideal.",
    funFact:
      "George Atwood built this machine in 1784 so students could measure g with masses that fall slowly enough to time with a stopwatch.",
    misconception:
      "Tension is not equal to either weight. For two different masses, T = 2 m₁ m₂ g / (m₁ + m₂), which lies between the two weights.",
    realWorld: [
      { title: "Lift Counterweight", description: "Elevator cab and counterweight share a cable over a pulley.", tag: "Buildings" },
      { title: "Flagpole Halyard", description: "Pull one side of a rope and the flag on the other side rises.", tag: "School" },
      { title: "Gym Cable Machine", description: "Weights on one side, handle on the other, linked over pulleys.", tag: "Sport" },
    ],
    hotspots: [
      { id: "pulley", label: "Pulley", detail: "Changes direction; ideal MA ≈ 1", color: "#c4922a", pos: [0, 1.38, 0] },
      { id: "m1", label: "Mass m1", detail: "Lighter pan in the default setup", color: "#2a7ab0", pos: [-0.22, 0.2, 0] },
      { id: "m2", label: "Mass m2", detail: "Heavier pan — it descends", color: "#b54a3c", pos: [0.22, -0.1, 0] },
      { id: "string", label: "String", detail: "Same tension T on both sides", color: "#3d6b4f", pos: [0, 0.7, 0] },
    ],
    lesson: {
      title: "Atwood’s machine and Newton’s second law",
      paragraphs: [
        "Treat the two masses as a system. The net force is (m2 − m1)g if m2 > m1, and the total mass being accelerated is m1 + m2. So a = g(m2 − m1)/(m1 + m2).",
        "On each mass, write F = ma separately. For m2 going down: m2 g − T = m2 a. For m1 going up: T − m1 g = m1 a. Solving gives T = 2 m1 m2 g / (m1 + m2).",
        "If m1 = m2 the system is in equilibrium (a = 0). If the pulley has friction, real a is smaller than the ideal formula.",
      ],
      bullets: [
        "Same string ⇒ same tension (ideal).",
        "Same string ⇒ same magnitude of a.",
        "a is less than g unless one mass is zero.",
      ],
    },
    quiz: [
      {
        prompt: "If m1 = m2, the acceleration is:",
        options: ["g", "g/2", "0", "2g"],
        answer: 2,
        explain: "Equal masses: net force is zero, so a = 0.",
      },
      {
        prompt: "Ideal acceleration is:",
        options: ["g(m1+m2)/(m2−m1)", "g(m2−m1)/(m1+m2)", "m1 m2 g", "T / g"],
        answer: 1,
        explain: "a = g(m2 − m1)/(m1 + m2).",
      },
      {
        prompt: "Tension T in an ideal Atwood machine is:",
        options: ["m1 g", "m2 g", "2 m1 m2 g / (m1 + m2)", "0"],
        answer: 2,
        explain: "T lies between the two weights: 2 m1 m2 g / (m1 + m2).",
      },
    ],
    controls: [
      { key: "mass1", label: "Mass m1", min: 0.5, max: 6, step: 0.5, unit: " kg", defaultValue: 2 },
      { key: "mass2", label: "Mass m2", min: 0.5, max: 6, step: 0.5, unit: " kg", defaultValue: 3.5 },
    ],
  },
  {
    id: "hydraulic",
    name: "Hydraulic Press",
    scientificName: "Pascal’s press",
    system: "Force & Pressure",
    icon: "▣",
    accent: "#c4922a",
    description:
      "Two pistons share one oil-filled pipe. Pressure is the same throughout the liquid, so a small force on a small piston can lift a large load on a large piston.",
    poetic: "Same pressure, bigger push",
    formula: "F₂ / F₁ = A₂ / A₁",
    maNote: "MA equals the area ratio. A piston four times wider (sixteen times the area) multiplies force by 16.",
    cbseFocus:
      "Class 8: Force and Pressure — Pascal’s law. Pressure in a confined liquid is transmitted equally in all directions. Hydraulic brakes and car lifts use this.",
    workLink:
      "The small piston travels farther than the large one. F1 × s1 ≈ F2 × s2, so energy is conserved even while force is multiplied.",
    funFact:
      "A service-station car lift is a hydraulic press: the mechanic’s pump is the small piston, the platform under the car is the large one.",
    misconception:
      "The oil does not create extra energy. The small piston must move a longer distance for the large piston to rise a little.",
    realWorld: [
      { title: "Car Lift", description: "Workshop ram lifts a whole vehicle with a pump handle.", tag: "Garage" },
      { title: "Hydraulic Brakes", description: "Foot force on a small piston reaches all four wheels.", tag: "Automotive" },
      { title: "Excavator Arm", description: "Pressurised oil drives large rams to move heavy buckets.", tag: "Construction" },
    ],
    hotspots: [
      { id: "small", label: "Small piston", detail: "Effort F1 on area A1", color: "#b54a3c", pos: [-0.85, 0.1, 0] },
      { id: "large", label: "Large piston", detail: "Load F2 on area A2", color: "#3d6b4f", pos: [0.85, 0.3, 0] },
      { id: "oil", label: "Oil in glass", detail: "You can see the liquid transmit pressure", color: "#c4922a", pos: [0, -0.92, 0] },
      { id: "pipe", label: "Connecting pipe", detail: "Same pressure P = F/A", color: "#2a7ab0", pos: [0, -0.95, 0.28] },
    ],
    lesson: {
      title: "Pascal’s law and the hydraulic press",
      paragraphs: [
        "Pascal’s law: pressure applied to a confined liquid is transmitted equally in all directions. Pressure P = F / A.",
        "On the small piston, P = F1 / A1. The same P acts on the large piston, so F2 = P × A2 = F1 × (A2 / A1). Ideal MA is the area ratio.",
        "Because liquids are almost incompressible, the volume pushed in equals the volume that comes out: A1 s1 = A2 s2. The small piston moves farther.",
      ],
      bullets: [
        "P is the same in the oil.",
        "MA = A2 / A1 = (r2 / r1)².",
        "Work in ≈ work out for an ideal (leak-free) press.",
      ],
    },
    quiz: [
      {
        prompt: "Pascal’s law says pressure in a confined liquid is:",
        options: ["Larger at the top", "Transmitted equally", "Zero", "Only downward"],
        answer: 1,
        explain: "Pressure is transmitted equally in all directions.",
      },
      {
        prompt: "If A2 = 10 A1, ideal MA is:",
        options: ["1", "10", "100", "1/10"],
        answer: 1,
        explain: "MA = A2 / A1 = 10.",
      },
      {
        prompt: "Hydraulic brakes work because:",
        options: [
          "Air is easier to compress",
          "Oil transmits pressure to every slave piston",
          "Wheels create extra force",
          "Friction disappears",
        ],
        answer: 1,
        explain: "One master cylinder pressurises fluid that reaches all brake pistons.",
      },
    ],
    controls: [
      { key: "effort", label: "Effort F1", min: 20, max: 200, step: 10, unit: " N", defaultValue: 80 },
      { key: "rEffort", label: "Small radius", min: 0.08, max: 0.2, step: 0.01, unit: " m", defaultValue: 0.12 },
      { key: "rLoad", label: "Large radius", min: 0.22, max: 0.5, step: 0.02, unit: " m", defaultValue: 0.36 },
    ],
  },
];

export const machineById = Object.fromEntries(machines.map((m) => [m.id, m])) as Record<
  MachineId,
  Machine
>;

export const MA_COMPARE = machines.map((m) => ({
  id: m.id,
  name: m.name,
  formula: m.formula,
  accent: m.accent,
}));
