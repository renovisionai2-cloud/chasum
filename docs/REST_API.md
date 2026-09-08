# Chasum REST API (Phase 3)

Base URL: `{NEXT_PUBLIC_APP_URL}/api/v1`

## Authentication

All requests require an API key in the Authorization header:

```
Authorization: Bearer chsm_<your-api-key>
```

Create keys in **Dashboard → Developer**. Keys are shown once at creation.

### Scopes

| Scope | Access |
|-------|--------|
| `read` | GET endpoints |
| `write` | POST, PATCH, DELETE |
| `webhooks` | Manage webhook endpoints (dashboard only today) |

---

## Endpoints

### Appointments

#### `GET /api/v1/appointments`

List appointments for your business.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `start` | ISO 8601 | Filter start_time >= |
| `end` | ISO 8601 | Filter start_time <= |

**Response:** `{ "data": [ ... ] }`

#### `POST /api/v1/appointments`

Create an appointment.

**Body:**
```json
{
  "location_id": "uuid",
  "service_id": "uuid",
  "staff_id": "uuid",
  "customer_id": "uuid",
  "start_time": "2026-07-15T14:00:00.000Z",
  "end_time": "2026-07-15T15:00:00.000Z",
  "status": "pending",
  "notes": "Optional"
}
```

`location_id` is an active location belonging to the API key's business. For legacy
requests that omit it, the API uses a location only when that business has exactly
one active location. Zero active locations or multiple active locations return 400;
`is_default` does not resolve an ambiguous API request.

`customer_id`, `service_id`, and `staff_id` must belong to the API key's business.
Customers are shared across that business's locations. Service and staff must be
active; the existing scheduling RPC checks staff/service assignment and location
eligibility. The same validated location is used for slot validation and insertion.
Unknown and foreign IDs return the same safe 400 error. Reference lookup failures
return 503 without database details. Invalid references create no appointment or
notification/job. `business_id` is always taken from the API key; unknown POST
fields are stripped, while `location_id` is explicitly retained and UUID-validated.

After successful insertion, triggers the existing notification/calendar/webhook
orchestration. This API does not run the background worker.

#### `GET /api/v1/appointments/:id`

Get a single appointment with relations. Both detail and list responses scope the
embedded customer/service/staff objects to the API key's business. A historical
invalid foreign relation is returned as `null`, never as foreign contact data.

#### `PATCH /api/v1/appointments/:id`

Update allowed appointment fields, including optional `location_id`, `customer_id`,
`service_id`, and `staff_id`. Unknown fields, including `business_id`, are rejected.
The API reads the owned appointment and validates the complete resulting reference
set before updating. Omitted location keeps the existing location; PATCH never
resolves a new location by fallback.

Actual location/service/staff/start/end changes, and reactivation from cancelled,
revalidate the resulting schedule through `validate_appointment_slot` with the
appointment excluded and the validated location supplied. Historical notes/status
edits may retain inactive same-business references; scheduling changes require
active location/service/staff. Customer reassignment must remain in the business.
Timestamp strings that differ from the stored representation also revalidate,
including equivalent offsets: JavaScript parsing cannot safely establish PostgreSQL
timestamp equivalence or preserve its fractional precision.

A concurrent appointment edit returns 409; reload before retrying. Failed validation
or a lost update race creates no notification/event. Existing response envelopes
remain `{ "data": ... }` for success and `{ "error": ... }` for errors.

#### `DELETE /api/v1/appointments/:id`

Soft-cancel (sets status to `cancelled`). Triggers cancellation flow.

---

### Services

#### `GET /api/v1/services`

List all services.

---

### Customers

#### `GET /api/v1/customers`

List all customers.

#### `POST /api/v1/customers`

Create a customer.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+15551234567",
  "notes": "Optional"
}
```

---

### Staff

#### `GET /api/v1/staff`

List staff with service assignments.

---

## Webhooks

Configure webhook endpoints in **Dashboard → Developer**. Chasum sends POST requests with:

**Headers:**
- `Content-Type: application/json`
- `X-Chasum-Event: appointment.created`
- `X-Chasum-Signature: <hmac-sha256-hex>`

**Body:**
```json
{
  "event": "appointment.created",
  "data": { "appointmentId": "...", "startTime": "...", "status": "..." },
  "timestamp": "2026-07-11T04:00:00.000Z"
}
```

Verify signatures with HMAC-SHA256 using your webhook secret.

### Events

- `appointment.created`
- `appointment.updated`
- `appointment.cancelled`
- `appointment.rescheduled`
- `customer.created`
- `waitlist.notified`

---

## Integration Discovery

### `GET /api/integrations/zapier`

Returns trigger/action catalog for Zapier and Make.com integration builders.

---

## Apple Calendar (.ics)

Subscribe to appointment feeds at:

```
GET /api/calendar/feed/{ics_secret}.ics
```

Generate the secret by connecting Apple Calendar in **Dashboard → Integrations**.

---

## Background Jobs

Email, SMS, calendar sync, and webhooks are processed asynchronously via the job queue.

**Cron endpoint:** `GET /api/cron/process-jobs`

Requires header: `Authorization: Bearer {CRON_SECRET}`

Configured in `vercel.json` to run every 5 minutes.

---

## Error Responses

```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request |
| 401 | Missing or invalid API key |
| 403 | Insufficient scope |
| 404 | Resource not found |
| 500 | Server error |

---

## Rate Limits

Not enforced in v0.2.0. Will be added in a future release.
