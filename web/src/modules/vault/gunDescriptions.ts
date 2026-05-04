/**
 * Static gun description blurbs.
 * Key format: "make|model" (lowercase, partial match)
 * Fall back to type-based descriptions for unknowns.
 */

const descriptions: Array<{ make: string; model: string; blurb: string }> = [
  // ── Glocks ──────────────────────────────────────────────────────────────────
  { make: 'glock', model: 'g17',   blurb: 'Developed in 1982 to win the Austrian army contract, the Glock 17 introduced polymer-frame pistols to mainstream military and law enforcement worldwide — today the most widely fielded service pistol on the planet.' },
  { make: 'glock', model: 'g19',   blurb: 'Glock\'s compact variant of the 17, developed in 1988 at the request of Austrian special forces needing a concealable service weapon — it became the best-selling centerfire pistol in U.S. history.' },
  { make: 'glock', model: 'g26',   blurb: 'The subcompact "Baby Glock" was designed in 1994 as a deep-concealment backup for law enforcement, offering full 9mm capability in the smallest Glock package available.' },
  { make: 'glock', model: 'g43',   blurb: 'Released in 2015, the single-stack G43 was Glock\'s answer to the exploding demand for slim 9mm carry pistols, competing directly with the Ruger LC9 and S&W Shield.' },
  { make: 'glock', model: 'g45',   blurb: 'Introduced in 2018, the G45 combines a full-size G17 frame with the compact G19 slide — a crossover design purpose-built for law enforcement patrol use.' },
  { make: 'glock', model: 'g20',   blurb: 'Chambered in 10mm Auto, the G20 was developed in the 1990s as a powerful outdoorsman\'s sidearm — capable of stopping large bears and widely carried in Alaska\'s wilderness.' },
  { make: 'glock', model: 'g21',   blurb: 'Glock\'s .45 ACP offering, the G21 was designed in the early 1990s to give American law enforcement a familiar caliber in the proven Glock platform during the transition away from revolvers.' },
  { make: 'glock', model: 'g34',   blurb: 'Glock\'s competition-optimized 9mm with a longer barrel and slide for improved sight radius, the G34 dominates USPSA Production and IDPA SSP divisions worldwide.' },
  { make: 'glock', model: 'g48',   blurb: 'The G48 pairs a slim single-stack 9mm slide with a standard-length grip, filling the gap between the tiny G43 and the full-size G19 for concealed carriers wanting more capacity.' },
  { make: 'glock', model: 'g',     blurb: 'Developed by Gaston Glock with no prior firearms experience, Glock pistols revolutionized the industry with their lightweight polymer frames and consistent trigger — now trusted by over 65% of U.S. law enforcement agencies.' },

  // ── SIG Sauer ────────────────────────────────────────────────────────────────
  { make: 'sig', model: 'p320',   blurb: 'The P320 won the U.S. Army\'s XM17 Modular Handgun System competition in 2017, becoming the M17/M18 — its fully modular design lets one serialized fire control unit work in multiple frame sizes and calibers.' },
  { make: 'sig', model: 'p365',   blurb: 'Launched in 2018, the P365 stunned the industry by fitting 10+1 rounds of 9mm in a micro-compact package, reshaping the concealed carry market and winning numerous "Gun of the Year" awards.' },
  { make: 'sig', model: 'p226',   blurb: 'The P226 narrowly lost the U.S. Army handgun trials to the Beretta M9 in 1985, then was immediately adopted by the Navy SEALs who preferred its all-metal construction — it remains the SEAL\'s iconic sidearm.' },
  { make: 'sig', model: 'p229',   blurb: 'Built on the P228 platform, the P229 was the first SIG designed and manufactured entirely in the U.S., and has been the standard issue pistol of the U.S. Secret Service since 1998.' },
  { make: 'sig', model: 'p938',   blurb: 'A micro-compact 1911-style pistol chambered in 9mm, the P938 brings the familiar SA trigger of a 1911 to deep concealment carry.' },
  { make: 'sig', model: 'p',      blurb: 'SIG Sauer pistols are German-Swiss engineered service arms renowned for precision manufacturing and exceptional out-of-box accuracy, adopted by military and law enforcement forces across over 100 countries.' },

  // ── 1911s ─────────────────────────────────────────────────────────────────
  { make: '', model: '1911',     blurb: 'Designed by John Browning and adopted by the U.S. Army in 1911, this .45 ACP pistol served American forces through both World Wars, Korea, and Vietnam — widely considered the most influential pistol design in history.' },
  { make: '', model: '2011',     blurb: 'A modern evolution of the 1911, the 2011 replaces the single-stack frame with a double-stack for greater capacity while retaining the 1911\'s legendary single-action trigger — the dominant platform in open competitive shooting.' },
  { make: 'colt', model: '',     blurb: 'Colt\'s Manufacturing Company produced the original 1911 government-contract pistol and is the historic source of the design that armed the United States military for over seven decades.' },
  { make: 'kimber', model: '',   blurb: 'Kimber became America\'s largest producer of 1911 pistols in the 1990s by offering tighter tolerances and premium features from the factory — their Custom series brought match-grade accuracy to production guns.' },

  // ── Beretta ───────────────────────────────────────────────────────────────
  { make: 'beretta', model: '92', blurb: 'Adopted as the U.S. military\'s M9 in 1985, the Beretta 92 replaced the 1911 after 74 years of service — its open-slide design and 15-round magazine represented a generational shift in military sidearms.' },
  { make: 'beretta', model: '',   blurb: 'The world\'s oldest firearms manufacturer, Beretta has been producing weapons since 1526 and supplies military, law enforcement, and sporting shooters across more than 100 countries.' },

  // ── Ruger ─────────────────────────────────────────────────────────────────
  { make: 'ruger', model: 'lcr',  blurb: 'The LCR (Lightweight Compact Revolver) pioneered the use of polymer and aluminum alloys in a revolver chassis, making it among the lightest .38 Special snub-nose revolvers available — designed specifically for concealed carry.' },
  { make: 'ruger', model: 'lcp',  blurb: 'Introduced in 2008 during the pocket pistol boom, the LCP (Lightweight Compact Pistol) in .380 ACP became one of the best-selling handguns in U.S. history, popularizing pocket carry for millions of Americans.' },
  { make: 'ruger', model: '',     blurb: 'Founded by William B. Ruger in 1949, Ruger has grown to become America\'s largest domestic firearms manufacturer, building everything from rimfire pistols to precision hunting rifles entirely in the U.S.' },

  // ── Smith & Wesson ────────────────────────────────────────────────────────
  { make: 'smith', model: 'shield', blurb: 'The M&P Shield, launched in 2012, became the top-selling pistol in the U.S. within its first year — its thin single-stack profile hit the sweet spot between pocket guns and service pistols for everyday carry.' },
  { make: 's&w', model: 'shield',   blurb: 'The M&P Shield, launched in 2012, became the top-selling pistol in the U.S. within its first year — its thin single-stack profile hit the sweet spot for everyday carry.' },
  { make: 'smith', model: '686',    blurb: 'S&W\'s stainless L-frame .357 Magnum revolver, the 686 was designed in 1980 to handle a full diet of magnum loads without the stress cracks that plagued the lighter K-frames — a favorite of IPSC revolver competitors.' },
  { make: 'smith', model: '',       blurb: 'Smith & Wesson, founded in 1852, is America\'s oldest major handgun manufacturer and pioneered the self-contained metallic cartridge revolver — their revolvers defined American law enforcement for over a century.' },

  // ── Colt (revolvers) ──────────────────────────────────────────────────────
  { make: 'colt', model: 'python',  blurb: 'The Colt Python, introduced in 1955, is widely considered the finest production revolver ever made — its hand-fitted action, exceptional accuracy, and lustrous Royal Blue finish made it the gold standard of double-action revolvers.' },

  // ── AR-platform ───────────────────────────────────────────────────────────
  { make: '', model: 'ar-15',   blurb: 'Designed by Eugene Stoner in the late 1950s, the AR-15\'s aluminum and polymer construction cut weight in half compared to the M1 Garand — the military version, the M16, became America\'s service rifle in Vietnam and remains so today.' },
  { make: '', model: 'ar15',    blurb: 'Designed by Eugene Stoner in the late 1950s, the AR-15\'s aluminum and polymer construction cut weight in half compared to the M1 Garand — the military version, the M16, became America\'s service rifle in Vietnam and remains so today.' },
  { make: '', model: 'ar-10',   blurb: 'The AR-10 was the original Stoner design, chambered in .308 Winchester — it was passed over by the Army in 1958 in favor of a scaled-down .223 variant, but the platform lives on as the go-to semi-auto precision rifle in larger calibers.' },
  { make: 'daniel defense', model: '', blurb: 'Daniel Defense builds some of the most precision-fitted AR-platform rifles in the industry, supplying U.S. Special Operations forces and winning multiple military contracts alongside their civilian product line.' },

  // ── AK platform ──────────────────────────────────────────────────────────
  { make: '', model: 'ak',      blurb: 'Mikhail Kalashnikov\'s 1947 design was built for one purpose: absolute reliability in the mud, cold, and sand of Soviet battlefields. Over 100 million have been produced — more than any other firearm in history.' },
  { make: '', model: 'draco',   blurb: 'The Draco is a Romanian pistol-configuration AK variant with a short barrel, popular among U.S. collectors as a compact range toy and a legally unregulated way to own an AK-pattern firearm without an SBR stamp.' },

  // ── Precision / Bolt ──────────────────────────────────────────────────────
  { make: 'remington', model: '700', blurb: 'The Remington 700, introduced in 1962, became the foundation of the U.S. Marine Corps M40 and Army M24 sniper rifles. Its three-ring-lug bolt action is considered the benchmark of American bolt-action accuracy.' },
  { make: 'tikka', model: '',        blurb: 'Finnish-made by Sako, Tikka rifles offer match-grade accuracy at production-rifle prices — the T3 and T3x have won more "best value precision rifle" awards than any other platform in the past decade.' },
  { make: 'bergara', model: '',      blurb: 'Spanish precision barrel manufacturer Bergara entered the complete rifle market with guns that deliver sub-MOA guarantees straight from the factory, disrupting the expensive custom precision rifle market.' },
  { make: 'savage', model: '',       blurb: 'Savage Arms\' AccuTrigger, introduced in 2003, brought user-adjustable crisp triggers to production rifles — a feature previously reserved for custom guns — and triggered a revolution in factory rifle performance.' },

  // ── Shotguns ──────────────────────────────────────────────────────────────
  { make: 'mossberg', model: '500',  blurb: 'The Mossberg 500, introduced in 1961, is the best-selling pump shotgun in U.S. history and the only shotgun to pass all U.S. military specifications — favored for its ambidextrous top-mounted safety and affordability.' },
  { make: 'mossberg', model: '590',  blurb: 'The Mossberg 590 is the military-specification variant of the 500, featuring a heavier barrel, metal trigger group, and bayonet lug — the only pump shotgun approved for U.S. military service.' },
  { make: '', model: 'remington 870', blurb: 'The Remington 870, in production since 1950, is the best-selling shotgun of all time with over 11 million made — used by U.S. military, law enforcement, hunters, and competitive shooters across every discipline.' },
  { make: 'benelli', model: '',      blurb: 'Italian manufacturer Benelli\'s inertia-driven system revolutionized semi-automatic shotguns by replacing the gas system with a simpler, lighter, and more reliable inertia bolt — adopted by U.S. military special operations and hunters worldwide.' },

  // ── Military Surplus ─────────────────────────────────────────────────────
  { make: '', model: 'mosin',   blurb: 'Adopted by the Russian Empire in 1891, the Mosin-Nagant is one of the most produced bolt-action rifles in history with over 37 million made — it served Soviet forces through both World Wars and dozens of subsequent conflicts.' },
  { make: '', model: 'garand',  blurb: 'General George Patton called the M1 Garand "the greatest battle implement ever devised" — the first semi-automatic rifle issued as standard infantry equipment, it gave American GIs a decisive rate-of-fire advantage in WWII.' },
  { make: '', model: 'enfield', blurb: 'The Lee-Enfield\'s 10-round magazine and smooth bolt action allowed British soldiers to produce "mad minute" fire rates of 15 aimed rounds per minute — its buttery bolt manipulation remains unmatched in service rifle history.' },
  { make: '', model: 'mauser',  blurb: 'The Mauser 98 action, adopted by the German military in 1898, set the mechanical standard for controlled-round-feed bolt actions — virtually every modern bolt-action hunting rifle traces its lineage directly to Paul Mauser\'s design.' },

  // ── Canik ─────────────────────────────────────────────────────────────────
  { make: 'canik', model: 'tp9', blurb: 'Made by Turkish manufacturer Canik, the TP9 series delivers Walther-licensed ergonomics and consistent triggers at a fraction of the competition\'s price, making it one of the best values in the striker-fired pistol market.' },

  // ── H&K ───────────────────────────────────────────────────────────────────
  { make: 'heckler', model: 'vp9', blurb: 'The VP9 brought H&K\'s legendary mechanical quality to the striker-fired category in 2014 — its adjustable grip and exceptional ergonomics make it a favorite of European military and police forces.' },
  { make: 'h&k', model: '',        blurb: 'Heckler & Koch was founded in 1949 from the ruins of Mauser\'s factory and builds some of the most mechanically reliable firearms in the world, supplying elite military and law enforcement units across 100+ countries.' },
  { make: 'hk', model: '',         blurb: 'Heckler & Koch was founded in 1949 from the ruins of Mauser\'s factory and builds some of the most mechanically reliable firearms in the world, supplying elite military and law enforcement units across 100+ countries.' },

  // ── FN ─────────────────────────────────────────────────────────────────────
  { make: 'fn', model: '509',    blurb: 'The FN 509 was developed from FN\'s entry in the U.S. Army\'s Modular Handgun System trials — it lost to the SIG P320 but became a commercial success as a rugged duty pistol with excellent ergonomics.' },
  { make: 'fn', model: 'scar',   blurb: 'The FN SCAR (Special Operations Forces Combat Assault Rifle) was developed at the request of U.S. SOCOM in 2004 — used by the 75th Ranger Regiment, Navy SEALs, and Delta Force, it\'s one of the most advanced combat rifles deployed today.' },
  { make: 'fn', model: '',       blurb: 'Fabrique Nationale d\'Armes de Guerre, founded in 1889, manufactures firearms for 40+ militaries worldwide including the U.S. M249 SAW, M240 GPMG, and the civilian FAL and SCAR — arguably the world\'s most important defense contractor.' },

  // ── Springfield ────────────────────────────────────────────────────────────
  { make: 'springfield', model: 'hellcat', blurb: 'Introduced in 2019, the Hellcat held the record for highest capacity in its size class — 11+1 rounds of 9mm from a micro-compact — until competitors caught up, but it remains a benchmark for carry pistol capacity.' },
  { make: 'springfield', model: 'xd',      blurb: 'The XD series (originally the HS2000, designed in Croatia) was Springfield Armory\'s entry into the polymer striker-fired market, notable for its grip safety and becoming a major seller in American law enforcement.' },

  // ── Taurus ────────────────────────────────────────────────────────────────
  { make: 'taurus', model: '',    blurb: 'Brazilian manufacturer Taurus has carved out a significant U.S. market share by offering affordable pistols and revolvers — the Judge revolver, capable of firing .410 shotshells, is one of its best-known unique designs.' },

  // ── Walther ───────────────────────────────────────────────────────────────
  { make: 'walther', model: 'ppq', blurb: 'The Walther PPQ\'s trigger was widely praised as the best factory striker trigger available when it launched in 2011 — its 5.6-pound pull with short reset influenced a generation of pistol trigger design.' },
  { make: 'walther', model: 'pdp', blurb: 'Walther\'s Performance Duty Pistol was designed in partnership with law enforcement trainers, incorporating an optics-ready slide and redesigned ergonomics — it\'s become a go-to duty and competition pistol.' },

  // ── Henry ─────────────────────────────────────────────────────────────────
  { make: 'henry', model: '',    blurb: 'Henry Repeating Arms, headquartered in Wisconsin, builds American-made lever-action rifles in the tradition of Benjamin Tyler Henry\'s 1860 design — the original Henry rifle gave Union soldiers a 16-shot advantage over Confederate single-shots in the Civil War.' },

  // ── Marlin ────────────────────────────────────────────────────────────────
  { make: 'marlin', model: '',   blurb: 'Marlin\'s Model 336 and 1894 lever-action rifles have been the most popular deer hunting rifles in the American woods for over a century — their side ejection made them the first lever guns compatible with top-mounted scopes.' },
];

/** Returns a 1–2 sentence blurb for the given gun, or a type-based fallback. */
export function getGunBlurb(gun: { make: string; model: string; type: string; action: string; caliber: string }): string | null {
  const make  = gun.make.toLowerCase();
  const model = gun.model.toLowerCase();

  // Try most-specific match first (make + model), then make-only, then model-only
  for (const entry of descriptions) {
    const makeMatch  = !entry.make  || make.includes(entry.make)  || entry.make.includes(make.split(' ')[0]);
    const modelMatch = !entry.model || model.includes(entry.model) || entry.model.includes(model.split(' ')[0]);
    if (entry.make && entry.model && makeMatch && modelMatch) return entry.blurb;
  }
  for (const entry of descriptions) {
    if (entry.make && !entry.model) {
      if (make.includes(entry.make) || entry.make.includes(make.split(' ')[0])) return entry.blurb;
    }
  }
  for (const entry of descriptions) {
    if (!entry.make && entry.model) {
      if (model.includes(entry.model)) return entry.blurb;
    }
  }

  // Type-based fallback
  const t = gun.type.toLowerCase();
  const a = gun.action.toLowerCase();
  if (t === 'pistol' && a === 'revolver') return 'Revolvers trace their lineage to Samuel Colt\'s 1836 patent — six-shot reliability, no magazine to lose, and a manual of arms unchanged for nearly 200 years.';
  if (t === 'pistol') return 'Modern semi-automatic pistols trace their operating principle to John Browning\'s tilting-barrel short-recoil design, patented in 1897 — the foundation of nearly every centerfire pistol made today.';
  if (t === 'rifle' && a === 'bolt') return 'Bolt-action rifles deliver maximum accuracy from a simple, lockup-tight action with no semi-auto cycling to disturb the barrel — the preferred choice of military snipers and precision competitors worldwide.';
  if (t === 'rifle') return 'Modern sporting rifles combine light weight, modular design, and intermediate calibers to give civilian and military shooters a versatile platform adaptable to any mission or mission environment.';
  if (t === 'shotgun') return 'Shotguns remain uniquely versatile — the same platform handles home defense buckshot, hunting birdshot, and precision slugs, making them one of the most adaptable firearms a shooter can own.';

  return null;
}
