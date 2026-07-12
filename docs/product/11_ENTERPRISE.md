# Enterprise

## Status

**Future.** Not required for GVM go-live or v1.0 GA.

## Enterprise definition

Organizations with **50+ staff**, **compliance requirements**, or **custom contracts**.

## Feature set (draft)

| Category | Features |
|----------|----------|
| Identity | SSO (SAML/OIDC), SCIM provisioning |
| Security | Audit logs, IP allowlist, data retention policies |
| Support | SLA, dedicated CSM, onboarding |
| Custom | White-label, custom integrations, on-prem option (evaluate) |
| Scale | Multi-location, high API rate limits |

## Vertical compliance

| Vertical | Consideration |
|----------|---------------|
| Healthcare | HIPAA BAA, PHI handling — not current scope |
| EU | GDPR data export/delete |
| Ultrasound (GVM) | Standard business data; no clinical records in v1 |

## Sales motion

Enterprise is outbound + pilot, not self-serve signup. Dogfood and SMB GA first.

## Relationship to multi-location

Enterprise tier includes multi-location. See [10_MULTI_LOCATION.md](./10_MULTI_LOCATION.md).
