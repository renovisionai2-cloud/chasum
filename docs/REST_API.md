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
  "service_id": "uuid",
  "staff_id": "uuid",
  "customer_id": "uuid",
  "start_time": "2026-07-15T14:00:00.000Z",
  "end_time": "2026-07-15T15:00:00.000Z",
  "status": "pending",
  "notes": "Optional"
}
```

Triggers confirmation emails, calendar sync, and webhooks.

#### `GET /api/v1/appointments/:id`

Get a single appointment with relations.

#### `PATCH /api/v1/appointments/:id`

Update appointment fields. Triggers notifications on status change.

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
