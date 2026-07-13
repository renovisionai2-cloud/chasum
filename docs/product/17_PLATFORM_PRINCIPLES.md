# Platform Principles

## Purpose

How we design Chasum’s architecture and platform capabilities so they scale from a solo operator to enterprise without rebuilding the product.

These principles take precedence over short-term architectural shortcuts. Product-level rules live in [16_PRODUCT_PRINCIPLES.md](./16_PRODUCT_PRINCIPLES.md).

---

## 1. Build Once, Scale Everywhere

Design every capability so the same foundation serves:

- Solo professional
- Small business
- Multi-location company
- Franchise
- Enterprise organization

Avoid one-off implementations that only work for a single tenant size. Prefer patterns that grow with the business.

---

## 2. Modular Architecture

The platform should be composed of clear modules with stable boundaries.

- Core scheduling, customers, locations, billing, and integrations stay shared.
- Features plug into the core rather than forking it.
- Modules can be enabled, limited, or packaged by plan without rewriting the data model.

See [05_ARCHITECTURE.md](./05_ARCHITECTURE.md) and [06_DATABASE.md](./06_DATABASE.md).

---

## 3. Industry Features Are Configurable Modules

Industry-specific needs (ultrasound workflows, salon packages, clinic forms, etc.) should be **configurable modules**, not separate products.

- One codebase, one tenant model, vertical configuration on top.
- Prefer settings, templates, and optional modules over hard forks.
- GVM Baby World informs ultrasound needs without locking the platform to one vertical.

---

## 4. Multi-Location Is Core Infrastructure

Every feature must work for one location, multiple locations, and enterprise organizations.

- Design location scope into the model early — do not retrofit later.
- Customers stay business-scoped; operational data may be location-scoped.
- “All locations” and single-location views are first-class.

See [10_MULTI_LOCATION.md](./10_MULTI_LOCATION.md).

---

## 5. Platform Before Features

Build strong foundations before adding new functionality.

Priority:

Architecture  
↓  
Database  
↓  
Security  
↓  
Performance  
↓  
User Experience  
↓  
Advanced Features

Backend and schema land before UI polish on new domains.

---

## 6. Subscription Plans Unlock Growth

Every capability should support flexible packaging without architectural rewrites.

Examples:

- locations
- users
- AI credits
- marketing
- automation
- integrations
- storage
- reporting

Limits and entitlements come from plan configuration (e.g. `subscription_plans`), not hard-coded constants.

See [09_PRICING_AND_PLANS.md](./09_PRICING_AND_PLANS.md).

---

## 7. Tenant Isolation Is Non-Negotiable

Users must never access another business’s data.

- RLS on every table.
- Public flows via SECURITY DEFINER RPCs with explicit business (and location) scope.
- Cross-tenant leaks are release blockers.

---

## Related

- Product principles: [16_PRODUCT_PRINCIPLES.md](./16_PRODUCT_PRINCIPLES.md)
- Architecture: [05_ARCHITECTURE.md](./05_ARCHITECTURE.md)
- Database: [06_DATABASE.md](./06_DATABASE.md)
- Multi-location: [10_MULTI_LOCATION.md](./10_MULTI_LOCATION.md)
- Enterprise: [11_ENTERPRISE.md](./11_ENTERPRISE.md)
- Decision log: [14_DECISION_LOG.md](./14_DECISION_LOG.md)
