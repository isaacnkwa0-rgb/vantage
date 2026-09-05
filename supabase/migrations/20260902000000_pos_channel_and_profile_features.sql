-- Add sales channel and order date to sales table
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'physical',
  ADD COLUMN IF NOT EXISTS order_date DATE;

-- Add date of birth to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;
