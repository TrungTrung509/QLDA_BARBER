INSERT OR IGNORE INTO services
  (id, name, description, duration_minutes, price_amount, currency, active, display_order)
VALUES
  ('service-classic', 'Classic Cut', 'Consultation and precision haircut', 30, 3000, 'USD', 1, 1),
  ('service-deluxe', 'Cut and Beard', 'Haircut with beard shaping', 60, 5000, 'USD', 1, 2);

INSERT OR IGNORE INTO barbers (id, name, active, display_order)
VALUES ('barber-alex', 'Alex', 1, 1), ('barber-sam', 'Sam', 1, 2);

INSERT OR IGNORE INTO barber_services (barber_id, service_id)
SELECT b.id, s.id FROM barbers b CROSS JOIN services s;

INSERT OR IGNORE INTO barber_hours (barber_id, weekday, start_minute, end_minute)
SELECT id, weekday, 540, 1020
FROM barbers
CROSS JOIN (
  SELECT 1 AS weekday UNION ALL SELECT 2 UNION ALL SELECT 3
  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
);

INSERT OR IGNORE INTO shop_settings
  (id, name, timezone, currency, slot_interval_minutes, minimum_lead_minutes)
VALUES ('shop-default', 'Example Barbershop', 'UTC', 'USD', 30, 0);

INSERT OR IGNORE INTO shop_hours (shop_id, weekday, start_minute, end_minute)
SELECT 'shop-default', weekday, 540, 1020
FROM (
  SELECT 1 AS weekday UNION ALL SELECT 2 UNION ALL SELECT 3
  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
);

