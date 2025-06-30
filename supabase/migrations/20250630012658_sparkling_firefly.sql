/*
  # Create feedback and usage declaration tables

  1. New Tables
    - `user_feedback`
      - `id` (uuid, primary key)
      - `summary_id` (uuid, foreign key to summaries)
      - `rating` (integer, 1-5)
      - `helpful` (boolean)
      - `accuracy` (integer, 1-5)
      - `comments` (text, optional)
      - `created_at` (timestamp)

    - `ai_usage_declarations`
      - `id` (uuid, primary key)
      - `summary_id` (uuid, foreign key to summaries)
      - `intended_use` (text)
      - `custom_use` (text, optional)
      - `acknowledgement` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id uuid NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  helpful boolean NOT NULL DEFAULT false,
  accuracy integer NOT NULL CHECK (accuracy >= 1 AND accuracy <= 5),
  comments text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_usage_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id uuid NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  intended_use text NOT NULL,
  custom_use text,
  acknowledgement boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_declarations ENABLE ROW LEVEL SECURITY;

-- Allow public access for now
CREATE POLICY "Allow public read access to user_feedback"
  ON user_feedback
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to user_feedback"
  ON user_feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to ai_usage_declarations"
  ON ai_usage_declarations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to ai_usage_declarations"
  ON ai_usage_declarations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_summary_id ON user_feedback(summary_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_declarations_summary_id ON ai_usage_declarations(summary_id);