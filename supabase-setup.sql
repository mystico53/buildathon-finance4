-- FinanceSync Database Schema
-- Complete setup for collaborative personal finance tracker

-- Workspace Presence Table (for real-time user tracking)
CREATE TABLE IF NOT EXISTS workspace_presence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id text NOT NULL,
  user_session text NOT NULL,
  user_name text,
  last_seen timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, user_session)
);

-- Enable RLS for workspace presence
ALTER TABLE workspace_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace presence
DROP POLICY IF EXISTS "Users can view workspace presence" ON workspace_presence;
CREATE POLICY "Users can view workspace presence" ON workspace_presence
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own presence" ON workspace_presence;
CREATE POLICY "Users can update their own presence" ON workspace_presence
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own session" ON workspace_presence;
CREATE POLICY "Users can update their own session" ON workspace_presence
  FOR UPDATE USING (true);

-- Enable real-time for presence
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_presence;

-- Indexes for workspace presence
CREATE INDEX IF NOT EXISTS idx_workspace_presence_workspace_id ON workspace_presence(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_presence_last_seen ON workspace_presence(last_seen);

-- Workspace Items Table (for transactions and collaborative data)
CREATE TABLE IF NOT EXISTS workspace_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id text NOT NULL,
  item_type text NOT NULL DEFAULT 'note',
  content jsonb DEFAULT '{}',
  position_x integer DEFAULT 0,
  position_y integer DEFAULT 0,
  created_by text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  -- Finance-specific columns
  transaction_data jsonb,
  uploaded_by text
);

-- Enable RLS for workspace items
ALTER TABLE workspace_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace items
DROP POLICY IF EXISTS "Users can view workspace items" ON workspace_items;
CREATE POLICY "Users can view workspace items" ON workspace_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create workspace items" ON workspace_items;
CREATE POLICY "Users can create workspace items" ON workspace_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update workspace items" ON workspace_items;
CREATE POLICY "Users can update workspace items" ON workspace_items
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete workspace items" ON workspace_items;
CREATE POLICY "Users can delete workspace items" ON workspace_items
  FOR DELETE USING (true);

-- Enable real-time for workspace items
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_items;

-- Indexes for workspace items
CREATE INDEX IF NOT EXISTS idx_workspace_items_workspace_id ON workspace_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_items_updated_at ON workspace_items(updated_at);
CREATE INDEX IF NOT EXISTS idx_workspace_items_transaction_data ON workspace_items USING GIN (transaction_data);
CREATE INDEX IF NOT EXISTS idx_workspace_items_uploaded_by ON workspace_items(uploaded_by);

-- Transaction data validation constraint
ALTER TABLE workspace_items DROP CONSTRAINT IF EXISTS chk_transaction_data;
ALTER TABLE workspace_items ADD CONSTRAINT chk_transaction_data 
  CHECK (
    item_type != 'transaction' OR 
    (
      transaction_data IS NOT NULL AND
      transaction_data ? 'date' AND
      transaction_data ? 'description' AND
      transaction_data ? 'amount' AND
      transaction_data ? 'category' AND
      transaction_data ? 'type'
    )
  );

-- View for easier transaction queries
DROP VIEW IF EXISTS workspace_transactions;
CREATE VIEW workspace_transactions AS
SELECT 
  id,
  workspace_id,
  uploaded_by,
  (transaction_data->>'date')::date as transaction_date,
  transaction_data->>'description' as description,
  (transaction_data->>'amount')::numeric as amount,
  transaction_data->>'category' as category,
  transaction_data->>'type' as transaction_type,
  (transaction_data->>'auto_categorized')::boolean as auto_categorized,
  transaction_data->>'user_color' as user_color,
  created_at,
  updated_at
FROM workspace_items 
WHERE item_type = 'transaction';

-- Performance indexes for transactions
CREATE INDEX IF NOT EXISTS idx_workspace_transactions_date ON workspace_items((transaction_data->>'date')) WHERE item_type = 'transaction';
CREATE INDEX IF NOT EXISTS idx_workspace_transactions_amount ON workspace_items((transaction_data->>'amount')) WHERE item_type = 'transaction';
CREATE INDEX IF NOT EXISTS idx_workspace_transactions_category ON workspace_items((transaction_data->>'category')) WHERE item_type = 'transaction';

-- Clean up old presence records (run periodically)
-- DELETE FROM workspace_presence WHERE last_seen < now() - interval '1 hour';