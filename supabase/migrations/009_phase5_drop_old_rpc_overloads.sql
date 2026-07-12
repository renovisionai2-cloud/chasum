-- Drop pre-Phase-5 RPC overloads that conflict with location-aware signatures

drop function if exists get_available_slots(uuid, uuid, uuid, date, uuid);
drop function if exists validate_appointment_slot(uuid, uuid, uuid, timestamptz, timestamptz, uuid);
drop function if exists create_public_appointment(uuid, uuid, uuid, uuid, timestamptz, timestamptz, text);
