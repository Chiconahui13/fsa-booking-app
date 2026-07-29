-- Migration: Add booking support and improve settings schema

-- Create settings table if it does not already exist
CREATE TABLE IF NOT EXISTS settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  slot_length smallint NOT NULL,
  slot_intervall smallint NOT NULL,
  notification_email text NOT NULL,
  slack_webhook text,
  is_active boolean NOT NULL DEFAULT true,
  availability_start timestamptz NOT NULL,
  availability_end timestamptz NOT NULL
);

-- Create bookings table if it does not already exist
CREATE TABLE IF NOT EXISTS bookings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_email text NOT NULL,
  car_number text NOT NULL,
  external_id text,
  status text NOT NULL DEFAULT 'confirmed',
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  google_event_id text,
  settings_id bigint REFERENCES settings(id) ON DELETE SET NULL
);

-- Ensure a booking slot cannot be double-booked within the same window
CREATE UNIQUE INDEX IF NOT EXISTS bookings_start_at_unique ON bookings(start_at);

-- Ensure each car can only have one booking per active setting
CREATE UNIQUE INDEX IF NOT EXISTS bookings_car_number_settings_id_unique ON bookings(car_number, settings_id) WHERE settings_id IS NOT NULL;

-- Ensure settings can be limited to one active row if needed
CREATE UNIQUE INDEX IF NOT EXISTS settings_active_unique ON settings(is_active) WHERE is_active;
