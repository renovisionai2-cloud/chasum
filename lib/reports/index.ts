/**
 * Reports & Analytics — Business Intelligence surfaces.
 * Consumed by Dashboard → Reports, Overview, Owner Platform hooks,
 * and future AI Workforce agents.
 */
export type {
  BusinessIntelligenceSnapshot,
  ExecutiveDashboard,
  ReportsBundle,
  ReportSchedule,
  ReportType,
} from "@/lib/reports/types";

export {
  getBusinessIntelligenceSnapshot,
  getReportsBundle,
} from "@/lib/actions/reports";
