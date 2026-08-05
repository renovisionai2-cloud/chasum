# Healthcare Workspace Direction

**Program:** Chasum World Class Program — Chapter 1  
**Status:** Directional planning only — **not** implementation  
**Authority companions:** `docs/product/21_INDUSTRY_FRAMEWORK.md`, `docs/product/11_ENTERPRISE.md`, `docs/marketing/PRODUCT_TRUTH_MATRIX.md`

---

## Positioning

Healthcare is a **specialized future workspace**, not a requirement for every Chasum customer.

| Layer | Applies to |
|-------|------------|
| **Universal portal foundation** | All businesses — Reception, CRM, Services, Employees, Payments, Communications, Reports, Summer |
| **Healthcare workspace** | Opt-in industry pack / workspace for clinics and regulated care settings |
| **Compliance-gated features** | Anything involving PHI, clinical documentation, consent, retention, BAA, EMR integration |

**GVM Baby World** today is an elective ultrasound **service business** on the universal foundation (Services, Clients, Appointments, commerce). Enterprise guidance: **no clinical records in v1**.

Public marketing must not claim EMR, HIPAA certification, or regulatory compliance until true.

---

## High-level healthcare capabilities (future)

| Capability | Description | Gate |
|------------|-------------|------|
| Patient intake | Digital intake before visit | Privacy review |
| Consent forms | Capture + version + audit | Legal + privacy |
| Medical history | Structured history | PHI controls |
| Clinical questionnaires | Configurable forms | Privacy |
| Practitioner notes | Visit notes | Role ACL + audit |
| Charting | Clinical documentation UI | Compliance |
| Secure document storage | Encrypted attachments | Security + retention |
| Referrals | Outbound/inbound referral packets | Privacy |
| Care / treatment plans | Longitudinal plans | Privacy |
| Role-restricted clinical access | Clinician vs front-desk scopes | RBAC |
| Audit history | Who viewed/changed clinical data | Security |
| Privacy controls | Access policies, export limits | Compliance |
| Retention controls | Retention schedules, legal hold | Legal |
| EMR integrations | HL7/FHIR/vendor bridges | Architecture + vendor |
| Jane-inspired scheduling | Practitioner calendars, waitlists, intakes | Healthcare IA |
| GVM Baby World workflows | Elective ultrasound ops on universal + optional clinical pack later | Partner-led |

---

## Separation rules

1. **Universal features** must never require clinical schemas.
2. **Healthcare workspace** mounts as an industry configuration / module — not a fork of the entire product.
3. **PHI** never mixed into generic notes, notifications, or AI prompts without explicit clinical context + policy.
4. **Summer** must not invent clinical advice (Bible + AI identity rules).
5. **Jane-like** patterns inform healthcare scheduling UX only inside the healthcare workspace.

---

## Legal / privacy / compliance review required before build

- PHI definition and data classification  
- Consent and minors (relevant to ultrasound / family care)  
- Retention and deletion  
- Audit and access logging  
- BAA / regional privacy (PIPEDA, PHIPA, HIPAA if US)  
- Subprocessors (email, storage, AI)  
- Cross-border data  
- Staff RBAC for clinical vs reception roles  

Do **not** implement clinical storage, charting, or EMR connectors in World Class Phases 1–9 without an approved compliance chapter.

---

## Recommended sequencing

| When | What |
|------|------|
| Phases 1–8 | Universal portal excellence; GVM remains service-business path |
| Phase 9 | Reporting/automation without PHI |
| **Phase 10** | Healthcare workspace architecture, RBAC, consent prototypes on Preview only |
| After legal approval | Limited clinical features with design partner clinics |

---

## GVM note

Continue supporting GVM on the **universal** operating system. Any future clinical charting for ultrasound partners is additive and optional — never a Production requirement for Phase 0 / World Class Foundation.
