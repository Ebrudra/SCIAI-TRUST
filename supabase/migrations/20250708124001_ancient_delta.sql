/*
  # Fix summaries table migration

  1. New Tables
    - `summaries` table with proper structure
      - `id` (uuid, primary key)
      - `paper_id` (uuid, foreign key to papers)
      - `content` (text, required)
      - `key_points` (jsonb array)
      - `limitations` (text array)
      - `citations` (jsonb array)
      - `confidence` (decimal with constraints)
      - `ethics_flags` (jsonb array)
      - `xai_data` (jsonb object)
      - `metadata` (jsonb object)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on summaries table
    - Add policies for public access (if not exists)

  3. Performance
    - Add index on paper_id for better query performance
    - Add updated_at trigger
*/

-- Create summaries table if it doesn't exist
CREATE TABLE IF NOT EXISTS summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  content text NOT NULL,
  key_points jsonb DEFAULT '[]',
  limitations text[] DEFAULT '{}',
  citations jsonb DEFAULT '[]',
  confidence decimal(3,2) DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  ethics_flags jsonb DEFAULT '[]',
  xai_data jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow public read access to summaries" ON summaries;
  DROP POLICY IF EXISTS "Allow public insert access to summaries" ON summaries;
  
  -- Create new policies
  CREATE POLICY "Allow public read access to summaries"
    ON summaries
    FOR SELECT
    TO public
    USING (true);

  CREATE POLICY "Allow public insert access to summaries"
    ON summaries
    FOR INSERT
    TO public
    WITH CHECK (true);
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_summaries_updated_at ON summaries;
CREATE TRIGGER update_summaries_updated_at
  BEFORE UPDATE ON summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_summaries_paper_id ON summaries(paper_id);