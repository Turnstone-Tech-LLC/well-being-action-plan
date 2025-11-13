-- Action Plans Table
-- This migration creates the action_plans table for provider-created well-being action plans

-- Action Plans Table
-- Stores action plans created by providers that can be shared with patients
CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_range TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  coping_strategy_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_action_plans_provider_id ON action_plans(provider_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_status ON action_plans(status);
CREATE INDEX IF NOT EXISTS idx_action_plans_created_at ON action_plans(created_at DESC);

-- Row Level Security (RLS) Policies
-- Enable RLS on action_plans table
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;

-- Providers can only view their own action plans
CREATE POLICY "Providers can view their own action plans"
  ON action_plans
  FOR SELECT
  USING (auth.uid() = provider_id);

-- Providers can create their own action plans
CREATE POLICY "Providers can create their own action plans"
  ON action_plans
  FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- Providers can update their own action plans
CREATE POLICY "Providers can update their own action plans"
  ON action_plans
  FOR UPDATE
  USING (auth.uid() = provider_id);

-- Providers can delete their own action plans
CREATE POLICY "Providers can delete their own action plans"
  ON action_plans
  FOR DELETE
  USING (auth.uid() = provider_id);

-- Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_action_plans_updated_at ON action_plans;
CREATE TRIGGER update_action_plans_updated_at
  BEFORE UPDATE ON action_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
