-- Migration: Create projects and project_configs tables
-- Purpose: Store permanent projects migrated from temporary drafts

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  project_id VARCHAR(50) PRIMARY KEY,
  owner_user_id VARCHAR(100) NOT NULL,
  owner_tenant_id VARCHAR(100),
  draft_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  
  -- Constraints
  CONSTRAINT projects_draft_id_unique UNIQUE (draft_id),
  CONSTRAINT projects_status_check CHECK (status IN ('DRAFT', 'READY', 'PUBLISHED', 'ARCHIVED'))
);

-- Indexes for projects
CREATE INDEX idx_projects_owner_user_id ON projects(owner_user_id);
CREATE INDEX idx_projects_draft_id ON projects(draft_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Project configs table
CREATE TABLE IF NOT EXISTS project_configs (
  config_id VARCHAR(50) PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL,
  schema_version INTEGER NOT NULL,
  config_version VARCHAR(20) NOT NULL,
  template_id VARCHAR(50) NOT NULL,
  template_version INTEGER NOT NULL,
  config_json JSONB NOT NULL,
  config_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign key
  CONSTRAINT fk_project_configs_project
    FOREIGN KEY (project_id)
    REFERENCES projects(project_id)
    ON DELETE CASCADE
);

-- Indexes for project_configs
CREATE INDEX idx_project_configs_project_id ON project_configs(project_id);
CREATE INDEX idx_project_configs_created_at ON project_configs(created_at DESC);
CREATE INDEX idx_project_configs_config_hash ON project_configs(config_hash);

-- GIN index for JSONB queries (useful for searching config content)
CREATE INDEX idx_project_configs_config_json ON project_configs USING GIN (config_json);

-- Comments
COMMENT ON TABLE projects IS 'Permanent projects migrated from temporary drafts';
COMMENT ON COLUMN projects.draft_id IS 'Original draft ID from Redis (unique for idempotency)';
COMMENT ON COLUMN projects.owner_user_id IS 'External user ID from auth service (opaque)';
COMMENT ON COLUMN projects.owner_tenant_id IS 'External tenant ID (optional)';

COMMENT ON TABLE project_configs IS 'Site configurations for projects';
COMMENT ON COLUMN project_configs.config_json IS 'Full SiteConfig JSON (JSONB for efficient queries)';
COMMENT ON COLUMN project_configs.config_hash IS 'SHA256 hash of config_json for versioning';

-- Updated_at trigger for projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

