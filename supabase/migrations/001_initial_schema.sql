-- Provider Portal Database Schema
-- This migration creates the necessary tables for provider authentication and link management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Provider Profiles Table
-- Stores extended profile information for authenticated providers
CREATE TABLE IF NOT EXISTS provider_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  organization TEXT,
  logo_url TEXT,
  contact_info JSONB DEFAULT '{}'::JSONB,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider Links Table
-- Stores information about generated provider links for tracking and management
CREATE TABLE IF NOT EXISTS provider_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  link_config JSONB NOT NULL,
  encoded_url TEXT NOT NULL,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_provider_links_provider_id ON provider_links(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_links_is_active ON provider_links(is_active);
CREATE INDEX IF NOT EXISTS idx_provider_links_created_at ON provider_links(created_at DESC);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_links ENABLE ROW LEVEL SECURITY;

-- Provider Profiles Policies
-- Providers can only read and update their own profile
CREATE POLICY "Users can view their own profile"
  ON provider_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON provider_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON provider_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Provider Links Policies
-- Providers can only manage their own links
CREATE POLICY "Users can view their own links"
  ON provider_links
  FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Users can create their own links"
  ON provider_links
  FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can update their own links"
  ON provider_links
  FOR UPDATE
  USING (auth.uid() = provider_id);

CREATE POLICY "Users can delete their own links"
  ON provider_links
  FOR DELETE
  USING (auth.uid() = provider_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.provider_profiles (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NOW(),
    NOW()
  );

  -- Update organization if provided
  IF NEW.raw_user_meta_data->>'organization' IS NOT NULL THEN
    UPDATE public.provider_profiles
    SET organization = NEW.raw_user_meta_data->>'organization'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_provider_profiles_updated_at ON provider_profiles;
CREATE TRIGGER update_provider_profiles_updated_at
  BEFORE UPDATE ON provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
