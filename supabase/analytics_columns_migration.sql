-- Facebook Pixel and Google Analytics columns

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS fb_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS ga_measurement_id TEXT;
