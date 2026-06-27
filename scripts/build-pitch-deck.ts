import { mkdirSync, writeFileSync } from "node:fs";
import PDFDocument from "pdfkit";

const OUT = "/mnt/documents/Quantara_Investor_Pitch_Deck.pdf";
mkdirSync("/mnt/documents", { recursive: true });

const doc = new PDFDocument({ size: "LETTER", layout: "landscape", margin: 60 });
doc.pipe(require("node:fs").createWriteStream(OUT));

const ACCENT = "#7dd3fc";
const BG = "#0b1020";
const FG = "#e2e8f0";

function slide({ kicker, title, body, bullets }: {
  kicker?: string; title: string; body?: string; bullets?: string[];
}, idx: number, total: number) {
  if (idx > 0) doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG);
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(10)
    .text(kicker ?? `SLIDE ${idx + 1}`.toUpperCase(), 60, 50, { characterSpacing: 4 });
  doc.fillColor(FG).font("Helvetica-Bold").fontSize(32)
    .text(title, 60, 90, { width: doc.page.width - 120 });
  let y = doc.y + 20;
  if (body) {
    doc.font("Helvetica").fontSize(14).fillColor(FG)
      .text(body, 60, y, { width: doc.page.width - 120, lineGap: 4 });
    y = doc.y + 16;
  }
  if (bullets?.length) {
    doc.font("Helvetica").fontSize(13).fillColor(FG);
    for (const b of bullets) {
      doc.circle(72, y + 7, 3).fill(ACCENT);
      doc.fillColor(FG).text(b, 90, y, { width: doc.page.width - 150, lineGap: 3 });
      y = doc.y + 10;
    }
  }
  doc.fillColor("#475569").font("Helvetica").fontSize(9)
    .text(`Quantara · ${idx + 1} / ${total}`, 60, doc.page.height - 40);
}

const slides = [
  { kicker: "INVESTOR DECK · 2025", title: "Quantara",
    body: "Verifiable quantum + QED compute, served from the browser. Cold-compute governor, on-chain provenance, monetized in USDC and credits." },
  { kicker: "PROBLEM", title: "Frontier physics is unauditable",
    bullets: [
      "QED predictions cost millions of CPU-hours, lock results to a few labs",
      "Researchers cannot verify, fork, or cite a run",
      "No clean path from theoretical formula → reproducible compute → citation"] },
  { kicker: "SOLUTION", title: "Auditable compute primitives",
    bullets: [
      "Symbolic + numeric formula lab — every theoretical equation, evaluable",
      "Quantum simulator with unitarity + Born-rule self-checks",
      "Run cards: every solve gets a permanent, citable URL"] },
  { kicker: "PRODUCT", title: "What ships today",
    bullets: [
      "/formulas — theoretical math solve box (QM, QED, QCD, GR, EM, …)",
      "/quantum-demo — explainer, benchmark, measurement, conservation",
      "/compare — CODATA vs. computed deltas",
      "/run-card/$id — public provenance & citation export"] },
  { kicker: "TECHNOLOGY", title: "Edge-native architecture",
    bullets: [
      "TanStack Start on Cloudflare; sub-100ms cold start",
      "Supabase Postgres + RLS, realtime, pg_cron, pgmq",
      "Nexus Auto-Healer agent quarantines failing surfaces every 15m",
      "Cold-compute governor sheds DPR/FX under live load"] },
  { kicker: "SECURITY", title: "SOC-style operations from day one",
    bullets: [
      "Audit triggers on every sensitive table",
      "Weekly CI dependency audit + CodeQL, Dependabot grouped PRs",
      "Wiz findings synced into /admin/security",
      "Documented override audit; structured 401s on every ledger call"] },
  { kicker: "MARKET", title: "Who pays",
    bullets: [
      "Independent researchers + grad labs needing reproducible compute",
      "Crypto-native science DAOs funding verifiable physics",
      "EdTech: physics curricula needing live, auditable demos",
      "TAM expanding with every onchain science treasury"] },
  { kicker: "BUSINESS MODEL", title: "Dual-rail monetization",
    bullets: [
      "Trial: 5 free simulation runs at signup",
      "Credits: 1 credit per run, top-ups in USDC (Base Pay) or card (Stripe)",
      "Subscription tiers: Researcher / Lab / Institution",
      "DAT token: onchain settlement + revenue share for compute providers"] },
  { kicker: "TRACTION", title: "Built, instrumented, monitored",
    bullets: [
      "Public chat + feedback wired to cold-compute load shedding",
      "Email + cron health dashboards live",
      "Run-card provenance shipped, USDC checkout shipped",
      "Security operations center live with autonomous healer"] },
  { kicker: "ROADMAP", title: "Next 4 quarters",
    bullets: [
      "Q1: GPU back-end for circuits > 18 qubits",
      "Q2: Marketplace for verified solvers (revenue share)",
      "Q3: Onchain DAT staking + slashing for bad runs",
      "Q4: Federated benchmark consortium"] },
  { kicker: "ASK", title: "Raising $3M seed",
    body: "Capital deploys against compute credits, two physics engineers, and security/compliance for SOC2 readiness. Targeting 18-month runway to a Series A driven by credit ARR + onchain settlement volume." },
  { kicker: "CONTACT", title: "Let's build verifiable physics",
    body: "Architecture diagram + technical appendix included in the data room." },
];

slides.forEach((s, i) => slide(s, i, slides.length));
doc.end();
console.log("wrote", OUT);
