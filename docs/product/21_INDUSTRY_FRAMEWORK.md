# Industry Framework

**Status:** Strategic product vision  
**Audience:** Product, founders, partners — not an engineering implementation guide  
**Related:** [20_AI_WORKFORCE.md](./20_AI_WORKFORCE.md), [17_PLATFORM_PRINCIPLES.md](./17_PLATFORM_PRINCIPLES.md), [01_PRODUCT_STRATEGY.md](./01_PRODUCT_STRATEGY.md)

---

# Purpose

Define how Chasum will support **many industries from a single platform** without creating separate products.

Chasum should become one configurable **AI Business Operating System** — not dozens of disconnected industry applications that diverge in code, UX, and data models.

GVM Baby World Ultrasound is our first deep design partner. The framework exists so ultrasound excellence does not trap us in a single vertical. The same core should eventually serve clinics, shops, studios, and field service teams through configuration.

---

# Core Principle

## Build Once. Configure Everywhere.

The same platform should support (and grow to support):

- Medical  
- Automotive  
- Beauty & Spa  
- Fitness  
- Barbershops  
- Dental  
- Veterinary  
- Pet Grooming  
- Home Services  
- Cleaning  
- Contractors  
- Professional Services  
- Legal  
- Accounting  
- Education  
- Photography  
- Hospitality  
- Rental Businesses  
- Future industries  

**We do not ship a new product for each industry.**  
We ship one platform, then enable industry fit through business type, modules, templates, terminology, and AI configuration.

---

# Architecture Principles

Industry differences should be **configuration**, not forks.

| Principle | Meaning |
|-----------|---------|
| **Never duplicate major modules** | One calendar, one client model, one staff model — extended, not copied |
| **Avoid industry-specific forks** | No `chasum-medical` codebase or divergent release trains |
| **Use configurable modules** | Optional capabilities attach to the core without rewriting it |
| **Use feature flags** | Roll out industry packs and capabilities safely by plan and tenant |
| **Use permissions** | Roles and entitlements control who can see and change what |
| **Use business types** | A first-class label that selects defaults, packs, and AI context |
| **Use service categories** | Catalog structure that fits each industry’s offerings |
| **Use workflows** | Configurable journeys (intake → visit → follow-up) instead of hard-coded industry paths |

If a request requires a permanent fork of Dashboard, Calendar, or Appointments, challenge it. Prefer extension points.

---

# Core Platform

Every business — regardless of industry — should share the same core modules.

| Core module | Role in the OS |
|-------------|----------------|
| **Dashboard** | Business health and daily focus |
| **Calendar** | Time and capacity |
| **Appointments** | The unit of scheduled work |
| **Customers** | Shared client records (Clients in the UI) |
| **Staff** | Human providers and schedules |
| **Services** | What the business sells |
| **Locations** | Physical (or virtual) sites |
| **Payments** | Deposits, invoices, and collections (as monetization ships) |
| **Reports** | Operational and financial summaries |
| **AI Workforce** | Named AI employees ([20_AI_WORKFORCE.md](./20_AI_WORKFORCE.md)) |
| **Automation** | Waitlists, recurring rules, triggers |
| **Marketing** | Outreach and rebooking (owner-approved) |
| **Inventory** | Consumables and retail (where enabled) |
| **Documents** | Forms, consents, attachments |
| **Notifications** | Email, SMS, in-app |
| **Settings** | Profile, hours, policies, branding |
| **Analytics** | Trends, conversion, utilization |

Industries differ in **which optional modules are on**, which templates load, and how AI speaks — not in whether they get a different calendar.

---

# Industry Modules

Optional modules sit on top of the core. They are packs of forms, fields, workflows, and UI surfaces — not separate applications.

## Medical

- Patient intake  
- Consent forms  
- Medical questionnaires  
- Treatment notes  
- HIPAA-ready architecture (controls, audit, retention policies as product requirements)

## Automotive

- Vehicle profiles  
- VIN  
- Insurance claims  
- Repair stages  
- Photo documentation  

## Beauty

- Memberships  
- Packages  
- Retail products  
- Before/After gallery  

## Fitness

- Classes  
- Memberships  
- Recurring bookings  
- Trainer programs  

## Contractors

- Projects  
- Quotes  
- Site visits  
- Invoices  
- Photo progress  

## Future industries

Future verticals (dental, veterinary, hospitality, legal, education, etc.) should **plug into the same platform** via Industry Packs: modules + templates + AI config + terminology — not new products.

Elective ultrasound (GVM) is an early specialization of wellness / medical-adjacent services: prep instructions, emotional journey, package upsells — delivered through core Services, Clients, and AI configuration first.

---

# Configuration Strategy

Industries are enabled and shaped through layered configuration:

### Business Type

A tenant-level type (e.g., Beauty & Spa, Automotive, Home Services) that selects sensible defaults: module pack, service category presets, AI tone, and onboarding checklist.

### Feature Flags

Progressive enablement of modules and capabilities by plan, beta cohort, or individual business — without branching the codebase.

### Permissions

Who may view PHI-like notes, edit prices, approve AI sends, manage locations, or install marketplace packs.

### Module Registry

A catalog of installable / assignable modules (core always on; industry and marketplace modules optional). The registry is the source of truth for “what this business has.”

### Templates

Starter services, hours, reminder copy, forms, and automation recipes for a business type — editable after install.

### AI configuration

Industry knowledge packs for each AI employee: FAQs Emma may use, capacity concepts Alex understands, KPIs Maya reports, offer patterns Ethan suggests — grounded in real tenant data.

### Forms

Configurable intake, consent, and follow-up forms without custom development per vertical.

### Custom fields

Extensible attributes on clients, appointments, vehicles, projects, etc., within governed schemas.

### Terminology

UI labels adapt (“Client” vs “Patient” vs “Member”; “Appointment” vs “Visit” vs “Job”) while the underlying entities stay shared.

---

# AI Adaptation

The **AI Workforce stays the same** (Emma, Alex, Maya, Olivia, Leo, Ethan, and future roles).  
Their **knowledge and workflows change** by industry.

| AI employee | Industry adaptation examples |
|-------------|------------------------------|
| **Emma — Receptionist** | Spa: ambiance, packages, rebooking. Auto shop: wait times, vehicle drop-off, insurance FAQs. Always uses configured answers only. |
| **Alex — Scheduler** | Automotive: repair bays and technician skills. Medical: treatment rooms and provider credentials. Fitness: class capacity and trainers. |
| **Maya — Business Advisor** | Different KPIs by business type (utilization vs. membership churn vs. job completion rate). |
| **Olivia — Marketing** | Campaigns tied to industry catalogs (seasonal spa packages vs. seasonal maintenance). |
| **Leo — Customer Success** | Prep and reminder content from real services (ultrasound hydration vs. paint-cure wait times). |
| **Ethan — Revenue Coach** | Upsells from the real catalog (add-on imaging vs. parts & labor packages). |

Cross-industry rule: AI never invents capacity, prices, or clinical claims. Configuration and the system of record remain the source of truth ([19_AI_PRINCIPLES.md](./19_AI_PRINCIPLES.md), [20_AI_WORKFORCE.md](./20_AI_WORKFORCE.md)).

---

# Marketplace Vision

Long-term, businesses (and partners) should install capabilities from a **Marketplace** rather than waiting for custom builds:

| Marketplace item | Purpose |
|------------------|---------|
| **Industry Packs** | Curated module + template + AI config bundles |
| **Forms** | Intake, consent, questionnaires |
| **Automation templates** | Waitlist, rebooking, review requests |
| **Reports** | Vertical KPI packs |
| **AI skills** | Extra tools for named AI employees (still policy-bound) |
| **Integrations** | Calendars, payments, SMS, accounting, vertical tools |
| **Themes** | Brand-safe presentation for booking and dashboard accents |
| **Extensions** | Partner-built modules that register into the Module Registry |

Marketplace items must respect permissions, plans, and data-boundary rules. They extend the OS; they do not fork it.

---

# Long-Term Vision

Chasum should become **one platform** capable of operating almost any service business through **configuration rather than custom development**.

The goal is not to become the best software for one industry.

**The goal is to become the world’s leading AI Business Operating System across every service industry.**

Appointments and the first design partner prove the core. Industry Packs, the Module Registry, and an AI Workforce that adapts by configuration prove the platform. The Marketplace proves the ecosystem.
