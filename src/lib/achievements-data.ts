// Pure achievement catalog — safe to import from both browser and server bundles.
// No localStorage / supabase / DOM imports here.

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  tier: "bronze" | "silver" | "gold" | "mythic";
  reward: number; // $DAT
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_credit",  title: "First Credit",        desc: "Earn your first $DAT.",                  tier: "bronze", reward: 5    },
  { id: "dat_100",       title: "Centurion",           desc: "Accumulate 100 $DAT.",                   tier: "bronze", reward: 25   },
  { id: "dat_1k",        title: "Kilo-DAT",            desc: "Accumulate 1,000 $DAT.",                 tier: "silver", reward: 150  },
  { id: "dat_10k",       title: "Sovereign Wallet",    desc: "Accumulate 10,000 $DAT.",                tier: "gold",   reward: 750  },
  { id: "dat_100k",      title: "DAT Singularity",     desc: "Accumulate 100,000 $DAT.",               tier: "mythic", reward: 5000 },
  { id: "cern_runner",   title: "Hadron Initiate",     desc: "Complete a CERN run.",                   tier: "bronze", reward: 15   },
  { id: "cern_master",   title: "Beamline Architect",  desc: "Complete 10 CERN runs.",                 tier: "silver", reward: 80   },
  { id: "cern_legend",   title: "Collision Cartographer", desc: "Complete 50 CERN runs.",              tier: "gold",   reward: 400  },
  { id: "quantum_lab",   title: "Wavefunction Tamer",  desc: "Measure a quantum circuit.",             tier: "bronze", reward: 20   },
  { id: "entangler",     title: "Entangler",           desc: "Place a CNOT gate.",                     tier: "silver", reward: 50   },
  { id: "gate_smith",    title: "Gate Smith",          desc: "Place 25 quantum gates.",                tier: "silver", reward: 100  },
  { id: "ledger_50",     title: "Memory Keeper",       desc: "Record 50 ledger entries.",              tier: "silver", reward: 50   },
  { id: "ledger_500",    title: "Archivist",           desc: "Record 500 ledger entries.",             tier: "gold",   reward: 300  },
  { id: "city_dawn",     title: "Horizon Dawn",        desc: "Grow the horizon city to 25%.",          tier: "bronze", reward: 25   },
  { id: "city_meridian", title: "Meridian Skyline",    desc: "Grow the horizon city to 50%.",          tier: "silver", reward: 100  },
  { id: "city_apex",     title: "Aurora Apex",         desc: "Grow the horizon city to 100%.",         tier: "mythic", reward: 1000 },
];
