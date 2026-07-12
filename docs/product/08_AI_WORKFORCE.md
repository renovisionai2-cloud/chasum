# AI Workforce

Vision for AI agents that operate inside Chasum on behalf of the business.

## Status

**Planned — Phase 5.** Scheduling engine (Phase 4) is the prerequisite.

## Concept

An **AI workforce** is a set of specialized agents that handle repetitive booking operations:

| Agent | Role |
|-------|------|
| **Scheduler** | Natural-language booking ("Book a 3D ultrasound next Tuesday afternoon") |
| **Reminder** | Smart reminder timing based on no-show history |
| **Rescheduler** | Handle client cancel/reschedule requests via SMS or chat |
| **Intake** | Collect pre-appointment info (forms, consent) |
| **Analyst** | Weekly summary: utilization, revenue, no-shows |

## Design constraints

1. **Same scheduling engine** — agents call `get_available_slots` / `validate_appointment_slot`, never bypass RPCs
2. **Human in the loop** — owner approves policy changes; agents act within business rules
3. **Audit trail** — every agent action logged (appointment_id, agent, action, timestamp)
4. **Vertical awareness** — ultrasound studio prompts differ from salon prompts

## GVM Baby World use cases

- Client texts "Do you have gender reveal slots this Saturday?" → Scheduler proposes options
- Auto-remind with studio-specific prep (" arrive 10 min early, full bladder for 2D")
- Post-visit follow-up for 3D package upsell (with owner approval)

## Technical direction (TBD)

- LLM provider abstraction (OpenAI / Anthropic)
- Tool-calling against Chasum server actions or REST API
- Optional SMS/chat channel via Twilio
- RAG over business-specific FAQs (services, policies, parking)

## Not in scope initially

- Autonomous pricing changes
- Medical diagnosis or clinical advice
- Replacing human sonographers
