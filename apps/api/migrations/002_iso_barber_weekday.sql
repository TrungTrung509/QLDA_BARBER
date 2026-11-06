-- Legacy seed and runtime already used ISO Monday=1 .. Saturday=6.
-- Only legacy Sunday=0 is remapped to ISO Sunday=7; other days are preserved.
-- Rebuilding is idempotent, transactional, and preserves every schedule interval.
BEGIN IMMEDIATE;
CREATE TABLE barber_hours_iso (
  barber_id TEXT NOT NULL REFERENCES barbers(id),
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_minute INTEGER NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute INTEGER NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
  CHECK (start_minute < end_minute),
  PRIMARY KEY (barber_id, weekday, start_minute)
);
INSERT INTO barber_hours_iso
SELECT barber_id, CASE weekday WHEN 0 THEN 7 ELSE weekday END, start_minute, end_minute
FROM barber_hours;
DROP TABLE barber_hours;
ALTER TABLE barber_hours_iso RENAME TO barber_hours;
COMMIT;
