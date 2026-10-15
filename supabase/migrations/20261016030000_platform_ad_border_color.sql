UPDATE platforms
SET ad_slots = jsonb_build_object('borderColor', '#f97316') || ad_slots
WHERE NOT (ad_slots ? 'borderColor');
