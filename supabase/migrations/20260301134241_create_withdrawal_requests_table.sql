/*
  # Create withdrawal_requests table

  1. New Tables
    - `withdrawal_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `amount` (numeric, the withdrawal amount)
      - `method` (text, e.g., 'EFT / Bank Transfer', 'Other')
      - `details` (jsonb, stores bank details or wallet address)
      - `reason` (text, optional message/reason)
      - `status` (text, default 'pending', can be 'pending', 'approved', 'rejected', 'processed')
      - `created_at` (timestamp)
      - `processed_at` (timestamp, nullable)

  2. Security
    - Enable RLS on `withdrawal_requests` table
    - Add policy for authenticated users to view their own requests
    - Add policy for authenticated users to create their own requests
    - Add policy for authenticated users to update their own requests

  3. Notes
    - Minimum withdrawal amount is R100
    - Stores bank details and wallet address in jsonb format for flexibility
*/

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  method text NOT NULL,
  details jsonb NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS withdrawal_requests_user_id_idx ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS withdrawal_requests_status_idx ON withdrawal_requests(status);
