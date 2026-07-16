/**
 * Spark / AI Workforce CRM hooks — stubs today, pluggable later.
 */

export type CrmAiQueryKind =
  | "summarize_customer"
  | "inactive_customers"
  | "top_spenders"
  | "birthday_promotions"
  | "custom";

export type CrmAiQueryInput = {
  businessId: string;
  kind: CrmAiQueryKind;
  customerId?: string;
  prompt?: string;
  lookbackDays?: number;
};

export type CrmAiQueryResult = {
  kind: CrmAiQueryKind;
  summary: string;
  items?: Array<{ id: string; label: string; detail?: string }>;
  ready: boolean;
};

export interface CrmAiProvider {
  readonly name: string;
  query(input: CrmAiQueryInput): Promise<CrmAiQueryResult>;
}

class SparkStubProvider implements CrmAiProvider {
  readonly name = "spark_stub";

  async query(input: CrmAiQueryInput): Promise<CrmAiQueryResult> {
    const prompts: Record<CrmAiQueryKind, string> = {
      summarize_customer:
        "Spark will summarize this customer's history, preferences, and risk signals.",
      inactive_customers:
        "Spark will list customers who have not visited in the selected lookback window.",
      top_spenders:
        "Spark will rank customers by lifetime spend and visit frequency.",
      birthday_promotions:
        "Spark will suggest birthday and anniversary outreach candidates.",
      custom: input.prompt ?? "Spark custom CRM query.",
    };

    return {
      kind: input.kind,
      summary: prompts[input.kind],
      items: [],
      ready: false,
    };
  }
}

let provider: CrmAiProvider | null = null;

export function getCrmAiProvider(): CrmAiProvider {
  if (!provider) provider = new SparkStubProvider();
  return provider;
}

export async function runCrmAiQuery(
  input: CrmAiQueryInput,
): Promise<CrmAiQueryResult> {
  return getCrmAiProvider().query(input);
}
