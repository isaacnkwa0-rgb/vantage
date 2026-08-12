-- Payment Links: add token to invoices for shareable pay pages

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link_token UUID DEFAULT gen_random_uuid();
UPDATE invoices SET payment_link_token = gen_random_uuid() WHERE payment_link_token IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS invoices_payment_link_token ON invoices (payment_link_token);
