-- Add maintenance mode toggle to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS store_maintenance_mode BOOLEAN DEFAULT false;
