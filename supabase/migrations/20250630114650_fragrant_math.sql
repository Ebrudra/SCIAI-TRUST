/*
  # Create comments table for collaboration features

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `summary_id` (uuid, foreign key to summaries)
      - `user_id` (text, for user identification)
      - `user_email` (text, user email)
      - `user_name` (text, optional user name)
      - `content` (text, comment content)
      - `target_section` (text, optional section reference)
      - `target_id` (text, optional target element id)
      - `parent_id` (uuid, optional parent comment for replies)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_resolved` (boolean, for comment resolution)
      - `reactions` (jsonb, for comment reactions)

  2. Security
    - Enable RLS on `comments` table
    - Add policies for public access (matching existing pattern)
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id uuid NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  user_email text NOT NULL,
  user_name text,
  content text NOT NULL,
  target_section text,
  target_id text,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),
  is_resolved boolean DEFAULT false NOT NULL,
  reactions jsonb DEFAULT '[]'::jsonb NOT NULL
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (matching existing pattern in other tables)
CREATE POLICY "Allow public read access to comments"
  ON comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to comments"
  ON comments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to comments"
  ON comments
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to comments"
  ON comments
  FOR DELETE
  TO public
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_summary_id ON comments(summary_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);