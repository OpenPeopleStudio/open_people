/**
 * Inline explainers for the <Term> component. Three lines each, under 40
 * words per line: what it is, why it matters here, where it shows up.
 * No numbers here that are not already on the desk.
 */
export type GlossaryEntry = {
  term: string;
  what: string;
  why: string;
  where?: { href: string; label: string };
};

const GLOSSARY_DATA = {
  dcia: {
    term: "DCIA",
    what: "The Definitive Cooperation and Implementation Agreement signed 17 August 2026 by NL Hydro, Hydro-Québec and CF(L)Co.",
    why: "It is a framework for writing later contracts. It does not itself lock any power, price or customer.",
    where: { href: "/tracker#dcia", label: "Tracker · Cooperation paper signed" },
  },
  "material-terms": {
    term: "Material Terms",
    what: "Schedule B of the DCIA: the agreed skeleton the later contracts are supposed to be drafted from.",
    why: "Most of what the public knows about volumes, prices and options comes from here, and it is not yet a signed contract.",
    where: { href: "/tracker#binding-window", label: "Tracker · Binding contracts still unsigned" },
  },
  ppa: {
    term: "PPA",
    what: "Power-purchase agreement: the binding contract that says who buys how much power, for how long, at what price.",
    why: "Until the PPAs are executed, every megawatt on this desk is announcement language, not an obligation.",
    where: { href: "/tracker#binding-window", label: "Tracker · Binding contracts still unsigned" },
  },
  "definitive-agreements": {
    term: "Definitive Agreements",
    what: "The set of binding contracts (PPAs and related agreements) the DCIA says the parties will try to sign by year-end 2026.",
    why: "This is the paper that will actually decide in-province use, recall and price. It has not been made public.",
    where: { href: "/tracker#binding-window", label: "Tracker · Binding contracts still unsigned" },
  },
  framework: {
    term: "framework",
    what: "A paper that sets out how later contracts will be written, without being those contracts.",
    why: "The House voted on a framework. Voters have not seen the binding text the framework points to.",
    where: { href: "/tracker#house-return", label: "Tracker · Back to the House" },
  },
  "firm-power": {
    term: "firm power",
    what: "Electricity a supplier commits to deliver continuously, not just when the wind blows or the reservoir is full.",
    why: "Mines, towns and any industrial load need firm power. Churchill Falls is one of the largest firm blocks in the country.",
  },
  mw: {
    term: "MW",
    what: "Megawatt: a rate of power. A large mine draws on the order of a hundred megawatts continuously.",
    why: "Capacity figures on this desk are in MW. A megawatt on a slide is not a megawatt on a signed contract.",
  },
  twh: {
    term: "TWh",
    what: "Terawatt-hour: energy over time. One thousand megawatts running all year is about 8.76 TWh.",
    why: "Annual energy tells you how much actually flows, not just what a plant could deliver at peak.",
  },
  "cents-per-kwh": {
    term: "¢/kWh",
    what: "Cents per kilowatt-hour: the unit household and industrial bills are priced in.",
    why: "Two ¢ figures can measure different things — a starting price versus a fifty-year average. This desk labels which is which.",
    where: { href: "/costs#contested", label: "Costs · Two public prices" },
  },
  mill: {
    term: "mill",
    what: "One-tenth of a cent. The 1969 contract renewal prices Hydro-Québec's purchases at two mills per kWh.",
    why: "Two mills is 0.2¢: the number behind decades of grievance, and not a rate anyone here can buy power at today.",
    where: { href: "/costs#heritage-mills", label: "Costs · Heritage export" },
  },
  "availability-contract": {
    term: "availability contract",
    what: "A contract that pays for the plant being available to deliver, with fixed target payments, rather than for each unit of energy.",
    why: "Hydro-Québec's new Churchill Falls contract is described this way. That is why the paper posts dollars, not cents.",
    where: { href: "/costs#dcia-hq-payments", label: "Costs · DCIA HQ payments" },
  },
  "take-or-pay": {
    term: "take-or-pay",
    what: "A contract where the buyer pays for the agreed volume whether or not it takes the energy.",
    why: "NL Hydro's own new Churchill Falls contract is described as take-or-pay: unused retained power is still paid for.",
    where: { href: "/tracker#unused-retain", label: "Tracker · Unused retain already has a buyer" },
  },
  "annex-b": {
    term: "Annex B",
    what: "The DCIA's preliminary year-by-year table of capacity and energy by project and party.",
    why: "It is the only public schedule of who gets what, when. It is marked preliminary and subject to studies.",
    where: { href: "/tracker#gull-island", label: "Tracker · Gull Island size is still a range" },
  },
  "annex-d": {
    term: "Annex D",
    what: "The DCIA's table of yearly target payments Hydro-Québec makes for existing Churchill Falls volumes, in billions of dollars.",
    why: "It is a dollar table, not a cents column. Nobody has published how to turn it into an industrial rate.",
    where: { href: "/costs#cents-bridge", label: "Costs · Annex D → voter ¢: unknown" },
  },
  "annex-f": {
    term: "Annex F",
    what: "The DCIA's inflation mechanism: payments adjust with Canadian CPI inside a deadband around a target rate.",
    why: "It means export payments follow inflation, not the market. That is a different machine from the mine tariff.",
    where: { href: "/tracker#cpi-vs-market", label: "Tracker · Inflation path is not a market path" },
  },
  "cpi-deadband": {
    term: "CPI deadband",
    what: "A band around a target inflation rate inside which payments do not adjust; outside it, they do.",
    why: "It caps how much export payments move with inflation. Small print, large money over fifty years.",
    where: { href: "/tracker#cpi-vs-market", label: "Tracker · Inflation path is not a market path" },
  },
  recapture: {
    term: "recapture",
    what: "NL Hydro's right to take back volumes previously sold to Hydro-Québec, for domestic load, on notice.",
    why: "The notice is three years in the Material Terms. Whether it survives into the signed text is one of the open checks.",
    where: { href: "/engage", label: "Engage · Seven checks" },
  },
  "synthetic-export": {
    term: "synthetic export",
    what: "Selling retained power to Hydro-Québec at a price built from neighbouring market prices, as if it had been exported there.",
    why: "It is one of the ways unused retained power can flow west. Capped in MW and on three years' notice.",
    where: { href: "/costs#synthetic-export", label: "Costs · Unused-retain options" },
  },
  "domestic-load": {
    term: "domestic load",
    what: "The Material Terms say NL Hydro's retained entitlements will only serve its domestic load, or be sold under Section 4.",
    why: "The contract meaning of domestic load — mines, towns, other industry, compute — is not published. That is the whole fight.",
    where: { href: "/tracker#domestic-load", label: "Tracker · What “used here” means" },
  },
  entitlement: {
    term: "entitlement",
    what: "A party's contractual share of a plant's capacity and energy.",
    why: "Announcement language says up to 2,350 MW retained. Entitlements are what the signed text will actually say.",
  },
  spe: {
    term: "SPE",
    what: "Special-purpose entity: a company created to own one project.",
    why: "The wind project would be owned by an SPE that is not named anywhere in the public paper. This desk does not invent one.",
    where: { href: "/tracker#wind-spe", label: "Tracker · Wind company not named" },
  },
  iaac: {
    term: "IAAC",
    what: "Impact Assessment Agency of Canada, the federal environmental assessment body.",
    why: "It has said no new assessment is needed if 2026 Gull Island matches the 2012 review. The proponent has not confirmed that.",
    where: { href: "/engage", label: "Engage · Federal assessment check" },
  },
  pub: {
    term: "PUB",
    what: "Newfoundland and Labrador's Board of Commissioners of Public Utilities, the rate regulator.",
    why: "Published Labrador tariffs come from PUB orders. The DCIA's export payments do not go through the PUB.",
  },
  "lab-ind-1": {
    term: "LAB-IND-1",
    what: "NL Hydro's Labrador Industrial rate class: demand charges plus a monthly firm-energy formula.",
    why: "Mines do not pay one posted cent. Quoting a single ¢/kWh for Labrador industry is a mistake this desk refuses to make.",
    where: { href: "/costs#lab-ind-1", label: "Costs · Labrador Industrial" },
  },
  rfirm: {
    term: "RFIRM",
    what: "The Labrador industrial firm-energy rate: a weighted mix of a development block and a market block each month.",
    why: "The market block tracks a New York price index. That is why the mine rate moves with markets while export payments move with CPI.",
    where: { href: "/costs#lab-ind-1", label: "Costs · Labrador Industrial" },
  },
  "kv-lines": {
    term: "230 kV / 735 kV",
    what: "Transmission voltage classes. Higher voltage carries more power over long distances.",
    why: "The existing 230 kV lines to Labrador West are at their limit. A 735 kV line is the proposed fix and has no in-service date.",
    where: { href: "/industries", label: "Industries · The corridor the mines need" },
  },
  "innu-nation": {
    term: "Innu Nation",
    what: "The governing body of the Labrador Innu (Sheshatshiu and Natuashish), on whose land the Churchill River projects sit.",
    why: "Innu Nation urged MHAs not to vote and says the paper cuts its benefits. Nothing large proceeds without that work.",
    where: { href: "/tracker#innu", label: "Tracker · Innu Nation issues still open" },
  },
  cflco: {
    term: "CF(L)Co",
    what: "Churchill Falls (Labrador) Corporation, owner of the Churchill Falls plant: NL Hydro 65.8%, Hydro-Québec 34.2%.",
    why: "It is a signatory to the DCIA. Its shareholding is why Hydro-Québec sits inside the plant, not just outside it as a buyer.",
  },
  irc: {
    term: "IRC",
    what: "The Independent Churchill River Review Committee, which reported on the 2024 MOU in spring 2026.",
    why: "It found the MOU not in the province's best long-term interest as written. The DCIA is the response to that finding.",
    where: { href: "/costs#mou-irc-path", label: "Costs · Rejected 2024 MOU path" },
  },
  mou: {
    term: "2024 MOU",
    what: "The December 2024 Memorandum of Understanding between the province and Hydro-Québec, expired 30 April 2026.",
    why: "Its cheap-front, steep-back price path is history. This desk keeps it on the table only so nobody quotes it as current.",
    where: { href: "/costs#mou-irc-path", label: "Costs · Rejected 2024 MOU path" },
  },
  gull: {
    term: "Gull Island",
    what: "A proposed new hydro plant on the lower Churchill River, described in the DCIA as roughly 2,250 or 2,700 MW.",
    why: "Its size is a range, its first power is a decade out, and Hydro-Québec holds exclusivity on it while the framework runs.",
    where: { href: "/tracker#gull-island", label: "Tracker · Gull Island size is still a range" },
  },
  retain: {
    term: "retained power",
    what: "The share of Churchill Falls and Gull Island output the province says it will keep for use in Newfoundland and Labrador.",
    why: "Public framing is up to 2,350 MW. Who gets it, year by year, at what price, is not published.",
    where: { href: "/tracker#metering", label: "Tracker · No public year-by-year meter" },
  },
  compute: {
    term: "compute",
    what: "Data-centre load for AI training or hosting.",
    why: "Not a named use in the DCIA. On this site it is a separate page and never the front door. Mining is first.",
    where: { href: "/compute", label: "Compute plan (separate page)" },
  },
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY_DATA;

export const GLOSSARY: Record<GlossaryKey, GlossaryEntry> = GLOSSARY_DATA;

export function glossaryEntry(key: GlossaryKey): GlossaryEntry {
  return GLOSSARY[key];
}
