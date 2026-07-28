# Homepage Master Specification

**Status:** Canonical Front Door specification  
**Sprint:** Operation Chasum – World-Class Homepage · Phase 1  
**Route:** `/`  
**Related:** `/platform`, `/product-tour`, `/industries`, `/meet-summer`

---

## Mission

`/` is the public front door to Chasum. It introduces the **AI Business Operating System** category with clarity, restraint and emotional confidence.

It is **not** the Platform deep-dive. That experience lives at `/platform`.

Sell:

- understanding
- connection
- operational clarity
- confidence

Do **not** primarily sell appointment booking, CRM, AI reception, isolated modules, or autonomous staff replacement.

---

## Visitor journey

1. **Hero** — category + belief + Start with Summer  
2. **Disconnected business** — problem of fragmented software  
3. **Meet the intelligence** — Summer curiosity  
4. **Connected operating system** — one system, verified statuses  
5. **Business outcomes** — day / understanding / growth  
6. **Industries** — configurable foundation  
7. **Real-world trust** — partnerships + honest status labels  
8. **Private Alpha** — apply / walkthrough  

Emotional sequence: curiosity → understanding → trust → excitement → action.

---

## Approved copy (summary)

| Section | Key lines |
| --- | --- |
| Hero eyebrow | AI BUSINESS OPERATING SYSTEM |
| Hero H1 | Your business already works. / Now it can understand itself. |
| Core belief | Businesses don’t need more software. They need software that understands how the business works. |
| Disconnected H2 | Every business is already full of software. |
| Closing of disconnect | Understanding begins when everything works together. |
| Summer H2 | Meet the intelligence behind Chasum. |
| Platform H2 | Everything works together. |
| Outcomes eyebrow | What changes when your business understands itself? |
| Industries H2 | Every service business works differently. |
| Trust H2 | Growing through real partnerships. |
| Alpha H2 | Help shape the future of business intelligence. |

Full body copy is implemented in `components/landing/*` and must stay aligned with `PRODUCT_TRUTH_MATRIX.md`.

---

## Visual system

- Soft white / light neutral canvas
- Subtle blue / violet ambient gradients
- Strong dark navy typography
- Large confident headlines, short paragraphs
- Premium light shadows and restrained glass
- One primary message per viewport
- Real Chasum UI previews with “illustrative demo data” labelling

Avoid: dark-heavy sections, generic SaaS grids, fake stats/logos/testimonials, overloaded dashboards.

---

## Motion rules

- Hero coordinated entrance ≈ 800ms; no word-by-word animation
- Product visual: fade + 12–20px rise
- CTAs usable within ~1s
- Connected-system nodes: short stagger; lines draw in; core glow
- Respect `prefers-reduced-motion`

---

## CTA map

| Label | Destination |
| --- | --- |
| Start with Summer | `/meet-summer` |
| Apply for Private Alpha | `/apply` |
| Explore the Platform | `/platform` |
| Explore all industries | `/industries` |
| Book a Walkthrough | `/contact#walkthrough` |
| Why Private Alpha? | `/private-alpha` |

Never use “Request Early Access.”

---

## Responsive behaviour

- **Desktop:** wide left/right compositions  
- **Tablet:** preserve hierarchy; stack when needed  
- **Mobile:** impactful headline; ≥44px tap targets; simplify product visuals; no horizontal overflow  

---

## Truth constraints

- Module statuses from `PRODUCT_TRUTH_MATRIX.md` only  
- Summer = Early Access; grounded claims only  
- No EMR / regulatory compliance claims  
- No invented testimonials, logos, counts, or portraits  
- Status vocabulary: Available Today · Early Access · Coming Next · Future Vision  

---

## Industries section (homepage)

- Category tiles with restrained 16:10 photography bands (not a gallery)
- Dedicated **Legal Services** tile (not folded into Professional Services)
- Healthcare → Medical Clinics and related care businesses
- Image map: `lib/marketing/industry-visuals.ts`
- Full Industries page order + Legal content: see
  `docs/marketing/INDUSTRIES_VISUAL_SYSTEM.md`

## Deferred enhancements

- Licensed authentic photography for trust strip  
- Dedicated Education industry deep-dive content beyond tile  
- Deeper product-tour narrative scenes  
- Animated connection lines as SVG path morph  
- Homepage A/B of primary CTA order  
- Industry hash deep-links on `/industries` (V2)  

---

## Active navigation

Canonical helpers: `lib/marketing/nav-active.ts`

- Only the current route (or genuine child) may appear active  
- Pricing is active only on `/pricing`  
- Support/Contact active only on `/contact`  
- Resources parent active when a resource route is current  
