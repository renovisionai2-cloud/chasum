import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";

export const INDUSTRY_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "industry-ultrasound",
    category: "industries",
    title: "Ultrasound Studios",
    summary: "Multi-service menus, reminders, and visit context.",
    body:
      "Ultrasound studios often run multi-service menus (2D, gender reveal, 3D/4D), need trustworthy availability, strong reminders, and CRM notes before sessions. Recommended start: Online Booking, Calendar, CRM, Deposits, Reports.",
    tags: ["ultrasound", "sonography", "gender reveal", "baby"],
    industries: ["ultrasound"],
    followUps: ["Tell me about deposits", "How do I apply for Private Alpha?"],
    relatedIds: ["feature-booking", "feature-deposits", "feature-crm"],
  },
  {
    id: "industry-spa",
    category: "industries",
    title: "Spa",
    summary: "Packages, rebooking, and staff utilization.",
    body:
      "Spas juggle therapists, rooms, packages, and rebooking. Common challenges: underbooked days and gift-heavy seasons. Recommended: Calendar, Packages, Gift Certificates, CRM, Marketing follow-ups.",
    tags: ["spa", "med spa", "wellness spa"],
    industries: ["spa"],
    followUps: ["Tell me about packages", "How does Chasum think about marketing?"],
    relatedIds: ["feature-packages", "feature-gift-certificates", "feature-calendar"],
  },
  {
    id: "industry-salon",
    category: "industries",
    title: "Salon",
    summary: "Stylist books, retail-adjacent packages, and retention.",
    body:
      "Salons need stylist-level calendars, service menus, and retention after color or cut visits. Challenges include no-shows and uneven utilization. Recommended: Booking, Employees, CRM, Packages, Reports.",
    tags: ["salon", "hair", "beauty salon", "stylist"],
    industries: ["salon"],
    followUps: ["How do you compare philosophically to Fresha?", "Show pricing"],
    relatedIds: ["feature-employees", "competitive-fresha", "pricing-plans"],
  },
  {
    id: "industry-massage",
    category: "industries",
    title: "Massage Therapy",
    summary: "Therapist schedules, packages, and quiet CRM.",
    body:
      "Massage practices need clear therapist availability, series packages, and private client notes. Challenges: cancellations and filling last-minute gaps. Recommended: Booking, Calendar, Packages, Deposits, CRM.",
    tags: ["massage", "massage therapy", "bodywork"],
    industries: ["massage"],
    followUps: ["Tell me about deposits", "What about the customer portal?"],
    relatedIds: ["feature-packages", "feature-deposits", "feature-portal"],
  },
  {
    id: "industry-chiropractic",
    category: "industries",
    title: "Chiropractic",
    summary: "Care plans, recall, and multi-visit rhythm.",
    body:
      "Chiropractic clinics run recurring care plans and need reliable recall. Challenges: missed follow-ups and fragmented notes. Recommended: CRM, Calendar, Packages, Reports, Communications.",
    tags: ["chiropractic", "chiropractor", "adjustment"],
    industries: ["chiropractic"],
    followUps: ["Tell me about CRM", "How do reports help?"],
    relatedIds: ["feature-crm", "feature-packages", "feature-reports"],
  },
  {
    id: "industry-physiotherapy",
    category: "industries",
    title: "Physiotherapy",
    summary: "Episode-based care with staff and room constraints.",
    body:
      "Physiotherapy clinics balance therapists, rooms, and multi-visit plans. Challenges: scheduling complexity and progress context. Recommended: Employees, Calendar, CRM, Reports, Multi-location when scaling.",
    tags: ["physiotherapy", "physio", "physical therapy", "pt"],
    industries: ["physiotherapy"],
    followUps: ["Multi-location support?", "Employee management?"],
    relatedIds: ["feature-employees", "feature-multi-location", "feature-crm"],
  },
  {
    id: "industry-dental",
    category: "industries",
    title: "Dental",
    summary: "Chair time, hygiene recalls, and clear booking rules.",
    body:
      "Dental practices protect chair time with structured booking and recalls. Challenges: no-shows and fragmented patient context. Recommended: Booking, Deposits/policies, CRM, Calendar, Reports.",
    tags: ["dental", "dentist", "hygiene", "orthodont"],
    industries: ["dental"],
    followUps: ["Security and privacy?", "Deposits?"],
    relatedIds: ["faq-security", "faq-privacy", "feature-deposits"],
  },
  {
    id: "industry-veterinary",
    category: "industries",
    title: "Veterinary",
    summary: "Pet + guardian context beside the appointment.",
    body:
      "Veterinary clinics need guardian and patient context next to appointments, plus reminder discipline. Challenges: multi-pet households and urgent day reshuffles. Recommended: CRM, Booking, Calendar, Communications, Reports.",
    tags: ["veterinary", "vet", "animal clinic"],
    industries: ["veterinary"],
    followUps: ["Customer portal?", "AI features?"],
    relatedIds: ["feature-crm", "feature-portal", "feature-ai"],
  },
  {
    id: "industry-pet-grooming",
    category: "industries",
    title: "Pet Grooming",
    summary: "Groomer books, add-ons, and rebooking cadence.",
    body:
      "Pet grooming shops run groomer schedules, breed/add-on complexity, and rebooking cycles. Challenges: day-of delays and no-shows. Recommended: Booking, Employees, Deposits, CRM, Packages.",
    tags: ["pet grooming", "groomer", "dog groom", "cat groom"],
    industries: ["pet_grooming"],
    followUps: ["Deposits?", "How does online booking work?"],
    relatedIds: ["feature-booking", "feature-deposits", "feature-employees"],
  },
  {
    id: "industry-barbershop",
    category: "industries",
    title: "Barbershop",
    summary: "Chair utilization and walk-in vs booked balance.",
    body:
      "Barbershops balance booked chairs with walk-in flow. Challenges: idle chairs and client retention. Recommended: Booking, Employees, Calendar, CRM, simple Packages.",
    tags: ["barbershop", "barber", "fade", "cuts"],
    industries: ["barbershop"],
    followUps: ["Employee management?", "Pricing for a single shop?"],
    relatedIds: ["feature-employees", "feature-calendar", "pricing-plans"],
  },
];
