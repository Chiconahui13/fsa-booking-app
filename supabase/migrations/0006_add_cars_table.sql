-- Migration: Add cars table and car_id reference on bookings

CREATE TABLE IF NOT EXISTS cars (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  number text NOT NULL UNIQUE,
  university text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS car_id bigint REFERENCES cars(id) ON DELETE RESTRICT;

ALTER TABLE bookings
  ALTER COLUMN car_number DROP NOT NULL;

DROP INDEX IF EXISTS bookings_car_number_settings_id_unique;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_car_id_settings_id_unique ON bookings(car_id, settings_id) WHERE settings_id IS NOT NULL;
