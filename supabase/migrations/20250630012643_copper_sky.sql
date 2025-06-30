/*
  # Create papers table

  1. New Tables
    - `papers`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `authors` (text array)
      - `content` (text, optional - for uploaded PDFs)
      - `url` (text, optional - for URL submissions)
      - `doi` (text, optional)
      - `metadata` (jsonb, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `papers` table
    - Add policy for public read access (since no auth yet)
    - Add policy for public insert access
*/

CREATE TABLE IF NOT EXISTS papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  authors text[] DEFAULT '{}',
  content text,
  url text,
  doi text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (will be restricted when auth is added)
CREATE POLICY "Allow public read access to papers"
  ON papers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to papers"
  ON papers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_papers_updated_at
  BEFORE UPDATE ON papers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();