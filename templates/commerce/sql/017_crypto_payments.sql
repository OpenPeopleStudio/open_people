-- Add crypto payment fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'card';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_payment_status text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_network text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_transaction_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS nowpayments_invoice_id text;

-- Index for looking up orders by NOWPayments invoice ID
CREATE INDEX IF NOT EXISTS idx_orders_nowpayments_invoice_id ON orders(nowpayments_invoice_id);

-- Comments
COMMENT ON COLUMN orders.payment_method IS 'Payment method: card or crypto';
COMMENT ON COLUMN orders.crypto_payment_status IS 'Crypto payment status: waiting, confirming, confirmed, finished, failed, expired';
COMMENT ON COLUMN orders.crypto_network IS 'Cryptocurrency used (e.g., btc, eth, doge, shib, xrp)';
COMMENT ON COLUMN orders.crypto_transaction_id IS 'NOWPayments payment ID';
COMMENT ON COLUMN orders.nowpayments_invoice_id IS 'NOWPayments invoice ID';
