import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BookingPaymentSection, type BookingPaymentDraft } from "@/components/booking/booking-payment-section";

function Fixture() {
  const [value, setValue] = useState<BookingPaymentDraft>({ mode: "custom", amountCents: 5000, method: "cash", note: "", sendReceipt: false });
  const [price, setPrice] = useState(10000);
  const [submitted, setSubmitted] = useState("");
  const [count, setCount] = useState(0);
  return <main style={{ maxWidth: 640, margin: "auto", padding: 16 }}>
    <form onSubmit={event => {
      event.preventDefault();
      setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
      setCount(count + 1);
    }}>
      <BookingPaymentSection catalogPriceCents={price} serviceTaxRateBps={1300} depositCents={5000} depositRequired currency="cad" value={value} onChange={setValue} defaultExpanded />
      <input type="hidden" name="payment_idempotency_key" value="n02-synthetic-key" />
      <button type="submit" style={{ minHeight: 44 }}>Submit synthetic booking</button>
      <button type="button" style={{ minHeight: 44 }} onClick={() => setValue({ ...value, amountCents: 2500 })}>Parent amount</button>
      <button type="button" style={{ minHeight: 44 }} onClick={() => { setPrice(20000); setValue({ ...value, amountCents: 8000 }); }}>Parent price</button>
      <label>Paste source<input aria-label="Paste source" defaultValue="12.34" /></label>
      <output data-testid="count">{count}</output>
      <output data-testid="submitted" style={{ display: "block", overflowWrap: "anywhere" }}>{submitted}</output>
    </form>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Fixture />);
