/*
  # Create summaries table

  1. New Tables
    - `summaries`
      - `id` (uuid, primary key)
      - `paper_id` (uuid, foreign key to papers)
      - `content` (text, required)
      - `key_points` (jsonb array)
      - `limitations` (text array)
      - `citations` (jsonb array)
      - `confidence` (decimal)
      - `ethics_flags` (jsonb array)
      - `xai_data` (jsonb)
      - `metadata` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `summaries` table
    - Add policy for public read access
    - Add policy for public insert access
*/

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

ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Allow public access for now
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

-- Create updated_at trigger
CREATE TRIGGER update_summaries_updated_at
  BEFORE UPDATE ON summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_summaries_paper_id ON summaries(paper_id);