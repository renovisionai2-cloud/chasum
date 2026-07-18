import { http, HttpResponse } from "msw";

/** Default MSW handlers for unit/integration tests — no real network. */
export const handlers = [
  http.get("https://api.resend.com/emails", () =>
    HttpResponse.json({ data: [] }),
  ),
  http.post("https://api.resend.com/emails", () =>
    HttpResponse.json({ id: "email_test_1" }, { status: 200 }),
  ),
  http.post("https://api.stripe.com/v1/payment_intents", () =>
    HttpResponse.json({
      id: "pi_test_1",
      client_secret: "pi_test_1_secret",
      status: "requires_payment_method",
    }),
  ),
];
