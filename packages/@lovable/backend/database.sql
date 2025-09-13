-- Supabase Database Schema for Lovable App Generator
-- This file should be executed in the Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  credits INTEGER DEFAULT 10 CHECK (credits >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0),
  description TEXT,
  domain TEXT,
  blueprint JSONB,
  files JSONB,
  preview_url TEXT,
  deployed_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) > 0),
  description TEXT,
  domain TEXT,
  blueprint JSONB NOT NULL,
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generations history table
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  domain TEXT,
  tokens_used INTEGER CHECK (tokens_used > 0),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  credits_per_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_domain ON public.projects(domain);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_project_id ON public.generations(project_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_domain ON public.templates(domain);
CREATE INDEX IF NOT EXISTS idx_templates_is_premium ON public.templates(is_premium);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for templates table
CREATE POLICY "Anyone can view non-premium templates" ON public.templates
  FOR SELECT USING (NOT is_premium OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all templates" ON public.templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for generations table
CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for usage_logs table
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Functions
-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement user credits
CREATE OR REPLACE FUNCTION public.decrement_credits(user_id UUID, amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET 
    credits = credits - amount,
    updated_at = NOW()
  WHERE id = user_id AND credits >= amount;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits or user not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.templates 
  SET 
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(user_id UUID)
RETURNS TABLE(
  total_projects BIGINT,
  total_generations BIGINT,
  avg_quality_score NUMERIC,
  credits_remaining INTEGER,
  subscription_tier TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.projects p WHERE p.user_id = get_user_stats.user_id),
    (SELECT COUNT(*) FROM public.generations g WHERE g.user_id = get_user_stats.user_id),
    (SELECT AVG(quality_score) FROM public.generations g WHERE g.user_id = get_user_stats.user_id AND quality_score IS NOT NULL),
    (SELECT credits FROM public.users u WHERE u.id = get_user_stats.user_id),
    (SELECT subscription_tier FROM public.users u WHERE u.id = get_user_stats.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
  user_id UUID,
  action TEXT,
  resource_type TEXT DEFAULT NULL,
  resource_id UUID DEFAULT NULL,
  metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (user_id, action, resource_type, resource_id, metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
-- Trigger to update updated_at on users table
DROP TRIGGER IF EXISTS handle_updated_at_users ON public.users;
CREATE TRIGGER handle_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update updated_at on projects table
DROP TRIGGER IF EXISTS handle_updated_at_projects ON public.projects;
CREATE TRIGGER handle_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update updated_at on templates table
DROP TRIGGER IF EXISTS handle_updated_at_templates ON public.templates;
CREATE TRIGGER handle_updated_at_templates
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update updated_at on subscriptions table
DROP TRIGGER IF EXISTS handle_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER handle_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets (these need to be created via Supabase dashboard or API)
-- Bucket policies are set via the Supabase dashboard

-- Insert default templates
INSERT INTO public.templates (name, description, domain, blueprint, is_premium, created_by) VALUES 
(
  'E-commerce Store',
  'A complete e-commerce solution with product catalog, shopping cart, and checkout',
  'ecommerce',
  '{
    "components": ["ProductCard", "ShoppingCart", "Checkout"],
    "pages": ["Home", "Products", "Cart", "Checkout"],
    "features": ["authentication", "payment", "inventory"]
  }'::jsonb,
  false,
  NULL
),
(
  'SaaS Landing Page',
  'Modern SaaS landing page with pricing, features, and sign-up flow',
  'saas',
  '{
    "components": ["Hero", "Features", "Pricing", "Testimonials"],
    "pages": ["Home", "Pricing", "About", "Contact"],
    "features": ["responsive", "seo", "analytics"]
  }'::jsonb,
  false,
  NULL
),
(
  'Personal Blog',
  'Clean and simple blog template with posts, categories, and comments',
  'blog',
  '{
    "components": ["PostCard", "Category", "CommentSection"],
    "pages": ["Home", "Post", "Category", "About"],
    "features": ["seo", "responsive", "social-sharing"]
  }'::jsonb,
  false,
  NULL
),
(
  'Portfolio Website',
  'Professional portfolio to showcase your work and skills',
  'portfolio',
  '{
    "components": ["ProjectCard", "SkillBadge", "ContactForm"],
    "pages": ["Home", "Portfolio", "About", "Contact"],
    "features": ["responsive", "animations", "contact-form"]
  }'::jsonb,
  false,
  NULL
)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Comments for documentation
COMMENT ON TABLE public.users IS 'Extended user profiles with subscription and credit information';
COMMENT ON TABLE public.projects IS 'User-generated application projects';
COMMENT ON TABLE public.templates IS 'Pre-built application templates';
COMMENT ON TABLE public.generations IS 'History of AI generation requests';
COMMENT ON TABLE public.subscriptions IS 'User subscription management';
COMMENT ON TABLE public.usage_logs IS 'User action tracking for analytics and billing';

COMMENT ON FUNCTION public.decrement_credits IS 'Safely decrement user credits with validation';
COMMENT ON FUNCTION public.get_user_stats IS 'Get comprehensive user statistics';
COMMENT ON FUNCTION public.log_user_action IS 'Log user actions for analytics';

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';