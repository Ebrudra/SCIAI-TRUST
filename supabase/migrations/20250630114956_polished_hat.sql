/*
  # Add Collaboration Tables

  1. New Tables
    - `share_links` - For sharing summaries with external users
    - `notifications` - For user notifications and invitations  
    - `workspaces` - For organizing papers and collaboration
    - `activity_logs` - For tracking user activities
    - `collaborators` - For managing workspace collaborators

  2. Security
    - Enable RLS on all new tables
    - Add policies for public access (matching existing pattern)

  3. Indexes
    - Add performance indexes for common queries
*/

-- Share Links Table
CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id uuid NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  created_by text NOT NULL DEFAULT 'anonymous',
  expires_at timestamptz,
  is_public boolean DEFAULT false,
  allow_comments boolean DEFAULT true,
  allow_download boolean DEFAULT false,
  access_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert access to share_links"
  ON share_links
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to share_links"
  ON share_links
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update access to share_links"
  ON share_links
  FOR UPDATE
  TO public
  USING (true);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_id text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert access to notifications"
  ON notifications
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to notifications"
  ON notifications
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update access to notifications"
  ON notifications
  FOR UPDATE
  TO public
  USING (true);

-- Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id text NOT NULL DEFAULT 'anonymous',
  is_public boolean DEFAULT false,
  papers jsonb DEFAULT '[]'::jsonb,
  collaborators jsonb DEFAULT '[]'::jsonb,
  invite_code text UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert access to workspaces"
  ON workspaces
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to workspaces"
  ON workspaces
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update access to workspaces"
  ON workspaces
  FOR UPDATE
  TO public
  USING (true);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  summary_id uuid REFERENCES summaries(id) ON DELETE CASCADE,
  user_id text NOT NULL DEFAULT 'anonymous',
  user_email text NOT NULL DEFAULT 'anonymous@example.com',
  action text NOT NULL,
  details text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert access to activity_logs"
  ON activity_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to activity_logs"
  ON activity_logs
  FOR SELECT
  TO public
  USING (true);

-- Collaborators Table
CREATE TABLE IF NOT EXISTS collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  user_email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  invited_by text NOT NULL DEFAULT 'anonymous',
  joined_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert access to collaborators"
  ON collaborators
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to collaborators"
  ON collaborators
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update access to collaborators"
  ON collaborators
  FOR UPDATE
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_share_links_summary_id ON share_links(summary_id);
CREATE INDEX IF NOT EXISTS idx_share_links_created_by ON share_links(created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id ON activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_summary_id ON activity_logs(summary_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_collaborators_workspace_id ON collaborators(workspace_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_email ON collaborators(user_email);

-- Create trigger for updating workspace updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_workspaces_updated_at'
  ) THEN
    CREATE TRIGGER update_workspaces_updated_at
      BEFORE UPDATE ON workspaces
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;