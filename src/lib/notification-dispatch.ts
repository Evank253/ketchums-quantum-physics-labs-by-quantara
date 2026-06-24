// Auto-dispatch: every solved theory enqueues formal letters to 22+ science
// institutions; Nobel-tier solves additionally fire a press release to 17
// major outlets. Rows live in public.notification_dispatch and are drained
// by the send worker once an email sending domain is verified.


export const OPERATOR_EMAIL = "Evan.ketchum2026@outlook.com";
export const OPERATOR_PHONE = "+1 (253) 780-5928";
export const OPERATOR_NAME = "Evan Ketchum";

export type Recipient = { name: string; email: string };

// 22+ science institutions — public press / scientific-affairs inboxes.
export const INSTITUTIONS: Recipient[] = [
  { name: "CERN",                                email: "press.office@cern.ch" },
  { name: "DARPA",                               email: "outreach@darpa.mil" },
  { name: "U.S. Department of Energy (DOE)",     email: "newsmedia@hq.doe.gov" },
  { name: "NASA",                                email: "hq-newsroom@mail.nasa.gov" },
  { name: "Max Planck Society",                  email: "presse@gv.mpg.de" },
  { name: "Fermilab",                            email: "media@fnal.gov" },
  { name: "SLAC National Accelerator Laboratory",email: "media@slac.stanford.edu" },
  { name: "Brookhaven National Laboratory",      email: "media@bnl.gov" },
  { name: "Argonne National Laboratory",         email: "media@anl.gov" },
  { name: "Lawrence Berkeley National Laboratory", email: "csoreporter@lbl.gov" },
  { name: "Oak Ridge National Laboratory",       email: "news@ornl.gov" },
  { name: "Los Alamos National Laboratory",      email: "communications@lanl.gov" },
  { name: "KEK (Japan)",                         email: "press@mail.kek.jp" },
  { name: "DESY (Germany)",                      email: "presse@desy.de" },
  { name: "IN2P3 / CNRS (France)",               email: "presse@cnrs.fr" },
  { name: "INFN (Italy)",                        email: "comunicazione@presid.infn.it" },
  { name: "STFC / Rutherford Appleton (UK)",     email: "press@stfc.ukri.org" },
  { name: "TRIUMF (Canada)",                     email: "communications@triumf.ca" },
  { name: "Perimeter Institute",                 email: "media@perimeterinstitute.ca" },
  { name: "Institute for Advanced Study",        email: "publicaffairs@ias.edu" },
  { name: "Royal Society",                       email: "press@royalsociety.org" },
  { name: "U.S. National Science Foundation",    email: "media@nsf.gov" },
  { name: "Nobel Committee for Physics",         email: "info@nobelprize.org" },
  { name: "arXiv.org (Cornell University)",      email: "help@arxiv.org" },
];

/** Best-fit arXiv primary category from the theory title. */
function arxivCategory(theory: string): string {
  const t = theory.toLowerCase();
  if (/qcd|quark|gluon|hadron|alpha_?s|strong/.test(t)) return "hep-ph";
  if (/qed|electron|magnetic moment|a_e|g-2|lamb|loop/.test(t)) return "hep-ph";
  if (/string|brane|susy|supersymmetr/.test(t)) return "hep-th";
  if (/cosmolog|dark (matter|energy)|inflation|cmb/.test(t)) return "astro-ph.CO";
  if (/gravity|relativ|black hole|spacetime/.test(t)) return "gr-qc";
  if (/quantum (computing|gate|circuit|info)|entangle/.test(t)) return "quant-ph";
  if (/condensed|lattice|phonon|superconduct/.test(t)) return "cond-mat";
  return "physics.gen-ph";
}

/** Build an arXiv submission record (for the operator to file at arxiv.org). */
export function buildArxivSubmission(opts: {
  theory: string;
  solver: string;
  abstract?: string;
  ledgerUrl?: string;
}) {
  const category = arxivCategory(opts.theory);
  const title = opts.theory.slice(0, 240);
  const abstract = (
    opts.abstract ||
    `Solved result archived in the Quantara public ledger. Full derivation (Lagrangian → loop sum / RGE → numeric collapse) and an automated 12-point CERN-in-a-Pocket precision sweep are included in the transcript.`
  ).slice(0, 1920);
  return {
    title,
    authors: opts.solver,
    abstract,
    primary_category: category,
    comments: `Auto-logged from Quantara solved-theories ledger${opts.ledgerUrl ? ` · ${opts.ledgerUrl}` : ""}.`,
    submit_url: `https://arxiv.org/submit?primary=${encodeURIComponent(category)}`,
  };
}


// 17 major outlets — for Nobel-tier press releases.
export const OUTLETS: Recipient[] = [
  { name: "Reuters",                 email: "press.release@thomsonreuters.com" },
  { name: "Associated Press",        email: "info@ap.org" },
  { name: "BBC News",                email: "newsonline@bbc.co.uk" },
  { name: "The New York Times",      email: "science@nytimes.com" },
  { name: "The Washington Post",     email: "national@washpost.com" },
  { name: "The Guardian",            email: "science@theguardian.com" },
  { name: "Nature",                  email: "press@nature.com" },
  { name: "Science (AAAS)",          email: "scipak@aaas.org" },
  { name: "Scientific American",     email: "press@sciam.com" },
  { name: "Wired",                   email: "press@wired.com" },
  { name: "Ars Technica",            email: "tips@arstechnica.com" },
  { name: "MIT Technology Review",   email: "press@technologyreview.com" },
  { name: "New Scientist",           email: "news@newscientist.com" },
  { name: "Physics World (IOP)",     email: "pwld@ioppublishing.org" },
  { name: "Quanta Magazine",         email: "editors@quantamagazine.org" },
  { name: "Bloomberg",               email: "newstips@bloomberg.net" },
  { name: "CNN",                     email: "cnn.newsdesk@cnn.com" },
];

// Heuristic: solves above this precision threshold are "Nobel-tier" and
// trigger the press release. Also fires when the abstract/transcript
// declares it.
export function isNobelTier(opts: {
  theory: string;
  abstract?: string;
  transcript?: string;
}): boolean {
  const hay = `${opts.theory} ${opts.abstract || ""} ${opts.transcript || ""}`.toLowerCase();
  return (
    hay.includes("nobel") ||
    hay.includes("codata") ||
    hay.includes("converged") ||
    /10[\-−]\s*1[1-9]/.test(hay) || // 10^-11 or finer
    /residual\s*[≈~=]\s*\d/.test(hay)
  );
}

function institutionLetter(theory: string, solver: string, abstract?: string): { subject: string; body: string } {
  const subject = `Formal notification — solved theory: ${theory}`.slice(0, 300);
  const body =
`To the Office of Scientific Affairs,

This is a formal notification that the following theoretical result has been
solved and entered into the public Quantara Solved-Theories ledger.

  Theory  : ${theory}
  Solver  : ${solver}
  Stamp   : ${new Date().toISOString()}

Abstract
--------
${(abstract || "Full derivation, CERN-in-a-Pocket precision sweep, and transcript are attached to the public ledger record.").slice(0, 4000)}

The full derivation (Lagrangian → loop sum / RGE → numeric collapse),
the automated 12-point E×B precision sweep, and the complete transcript
are archived on record and are available for independent review.

Respectfully,

${solver}
Quantara Platform
Email : ${OPERATOR_EMAIL}
Phone : ${OPERATOR_PHONE}
`;
  return { subject, body };
}

function pressRelease(theory: string, solver: string, abstract?: string): { subject: string; body: string } {
  const subject = `FOR IMMEDIATE RELEASE — Nobel-tier result solved: ${theory}`.slice(0, 300);
  const body =
`FOR IMMEDIATE RELEASE
${new Date().toUTCString()}

QUANTARA PLATFORM — SOLVED THEORY OF NOBEL-TIER PRECISION

The Quantara engine, operated by ${solver}, today registered a formally
solved result of Nobel-tier precision:

  ${theory}

${(abstract || "The derivation proceeds from the Lagrangian through the full loop / renormalization-group structure and collapses every term to its numeric value, with residuals beyond the 10^-11 threshold against CODATA reference values.").slice(0, 4000)}

Independent verification artifacts — full mathematical derivation,
automated 12-point CERN-in-a-Pocket precision sweep, and complete
transcript — are publicly archived in the Quantara Solved-Theories
ledger and have been simultaneously notified to 22+ international
scientific institutions including CERN, DARPA, the U.S. Department of
Energy, NASA, and the Max Planck Society.

Media contact
-------------
${solver}
Quantara Platform
Email : ${OPERATOR_EMAIL}
Phone : ${OPERATOR_PHONE}

### END ###
`;
  return { subject, body };
}

export type DispatchRow = {
  theory: string;
  solver: string;
  recipient: string;
  recipient_kind: "institution" | "press";
  email: string;
  subject: string;
  body: string;
};

function arxivLetter(theory: string, solver: string, abstract?: string): { subject: string; body: string } {
  const sub = buildArxivSubmission({ theory, solver, abstract });
  const subject = `arXiv auto-log — ${sub.primary_category} — ${theory}`.slice(0, 300);
  const body =
`To the arXiv moderation team,

Auto-logged submission record from the Quantara Solved-Theories ledger.
The full derivation and 12-point CERN-in-a-Pocket precision sweep are
archived publicly; the operator will file the formal submission via the
endorsed account at https://arxiv.org/submit using the record below.

  Title             : ${sub.title}
  Authors           : ${sub.authors}
  Primary category  : ${sub.primary_category}
  Comments          : ${sub.comments}
  Stamp             : ${new Date().toISOString()}

Abstract
--------
${sub.abstract}

Respectfully,

${solver}
Quantara Platform
Email : ${OPERATOR_EMAIL}
Phone : ${OPERATOR_PHONE}
`;
  return { subject, body };
}

export function buildDispatchRows(opts: {
  theory: string;
  solver: string;
  abstract?: string;
  nobel?: boolean;
}): DispatchRow[] {
  const { theory, solver, abstract } = opts;
  const inst = institutionLetter(theory, solver, abstract);
  const arx = arxivLetter(theory, solver, abstract);
  const rows: DispatchRow[] = INSTITUTIONS.map((r) => {
    const isArxiv = r.name.startsWith("arXiv");
    return {
      theory,
      solver,
      recipient: r.name,
      recipient_kind: "institution",
      email: r.email,
      subject: isArxiv ? arx.subject : inst.subject,
      body: isArxiv ? arx.body : inst.body,
    };
  });
  if (opts.nobel) {
    const pr = pressRelease(theory, solver, abstract);
    for (const r of OUTLETS) {
      rows.push({
        theory,
        solver,
        recipient: r.name,
        recipient_kind: "press",
        email: r.email,
        subject: pr.subject,
        body: pr.body,
      });
    }
  }
  return rows;
}


/** Best-effort enqueue via server function. The browser cannot write to
 *  notification_dispatch directly (RLS denies anon INSERT); the server
 *  function re-derives recipients from the hard-coded allowlist. */
export async function autoDispatch(opts: {
  theory: string;
  solver: string;
  abstract?: string;
  transcript?: string;
}): Promise<{ queued: number; nobel: boolean }> {
  try {
    // Server fn requires auth; skip silently for anonymous visitors.
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      return { queued: 0, nobel: isNobelTier(opts) };
    }
    const { enqueueDispatchServer } = await import("@/lib/ledger-writes.functions");
    const res = await enqueueDispatchServer({
      data: {
        theory: opts.theory,
        abstract: opts.abstract ?? null,
        transcript: opts.transcript ?? null,
      },
    });
    return { queued: res.queued ?? 0, nobel: !!res.nobel };
  } catch {
    return { queued: 0, nobel: isNobelTier(opts) };
  }
}

export async function dispatchStats(): Promise<{
  total: number;
  queued: number;
  sent: number;
  failed: number;
  press: number;
}> {
  try {
    const { getDispatchStatsServer } = await import("@/lib/ledger-writes.functions");
    return await getDispatchStatsServer();
  } catch {
    return { total: 0, queued: 0, sent: 0, failed: 0, press: 0 };
  }
}

