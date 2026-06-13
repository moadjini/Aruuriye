-- HaddaICaawi - Initial Database Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('visitor', 'fundraiser', 'admin');
CREATE TYPE verification_level AS ENUM ('none', 'level_1', 'level_2', 'level_3');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE campaign_status AS ENUM ('draft', 'pending_review', 'verified', 'active', 'frozen', 'completed', 'rejected');
CREATE TYPE donation_status AS ENUM ('pending_verification', 'verified', 'rejected');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
CREATE TYPE report_reason AS ENUM ('fake_campaign', 'misleading_information', 'duplicate_campaign', 'suspicious_activity');
CREATE TYPE report_status AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');
CREATE TYPE document_type AS ENUM ('national_id', 'student_id', 'medical_report', 'organization_doc', 'campaign_supporting', 'receipt', 'proof_of_impact');
CREATE TYPE payment_method AS ENUM ('evc_plus', 'zaad', 'sahal', 'bank_transfer');

-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, slug, description, icon) VALUES
  ('Medical', 'medical', 'Medical expenses and healthcare needs', 'heart-pulse'),
  ('Education', 'education', 'School fees, scholarships, and learning', 'graduation-cap'),
  ('Business', 'business', 'Small business and entrepreneurship', 'briefcase'),
  ('Emergency Relief', 'emergency-relief', 'Urgent disaster and crisis relief', 'alert-triangle'),
  ('Community Projects', 'community-projects', 'Local community development', 'users'),
  ('Charity', 'charity', 'Charitable causes and giving', 'hand-heart'),
  ('Mosque Projects', 'mosque-projects', 'Mosque construction and maintenance', 'building');

-- ============================================
-- PLATFORM SETTINGS
-- ============================================

CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

INSERT INTO platform_settings (key, value) VALUES
  ('platform_fee_percent', '5'),
  ('evc_business_number', '61XXXXXXX'),
  ('min_withdrawal_amount', '10'),
  ('max_campaign_duration_days', '90');

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  city TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'visitor',
  verification_level verification_level DEFAULT 'none',
  verification_status verification_status DEFAULT 'unverified',
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAMPAIGNS
-- ============================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  story TEXT,
  goal_amount DECIMAL(12, 2) NOT NULL CHECK (goal_amount > 0),
  raised_amount DECIMAL(12, 2) DEFAULT 0 CHECK (raised_amount >= 0),
  location TEXT NOT NULL,
  cover_image_url TEXT,
  status campaign_status DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT FALSE,
  is_anonymous_donations BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  admin_notes TEXT,
  view_count INTEGER DEFAULT 0,
  donor_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_creator ON campaigns(creator_id);
CREATE INDEX idx_campaigns_category ON campaigns(category_id);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);

-- ============================================
-- CAMPAIGN DOCUMENTS & GALLERY
-- ============================================

CREATE TABLE campaign_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAMPAIGN UPDATES
-- ============================================

CREATE TABLE campaign_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMENTS
-- ============================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DONATIONS
-- ============================================

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  donor_phone TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  transaction_reference TEXT NOT NULL,
  payment_method payment_method DEFAULT 'evc_plus',
  status donation_status DEFAULT 'pending_verification',
  is_anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_status ON donations(status);

-- ============================================
-- WITHDRAWAL REQUESTS
-- ============================================

CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  fundraiser_id UUID NOT NULL REFERENCES profiles(id),
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  payment_method payment_method NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  platform_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12, 2) NOT NULL,
  status withdrawal_status DEFAULT 'pending',
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VERIFICATION REQUESTS
-- ============================================

CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_level verification_level NOT NULL,
  document_type document_type NOT NULL,
  document_url TEXT NOT NULL,
  status verification_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REPORTS (Fraud)
-- ============================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason report_reason NOT NULL,
  description TEXT NOT NULL,
  status report_status DEFAULT 'pending',
  investigated_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================
-- ADMIN LOGS (Audit)
-- ============================================

CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update campaign raised amount when donation verified
CREATE OR REPLACE FUNCTION update_campaign_on_donation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    UPDATE campaigns
    SET raised_amount = raised_amount + NEW.amount,
        donor_count = donor_count + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  ELSIF OLD.status = 'verified' AND NEW.status != 'verified' THEN
    UPDATE campaigns
    SET raised_amount = GREATEST(0, raised_amount - OLD.amount),
        donor_count = GREATEST(0, donor_count - 1),
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_donation_status_change
  AFTER INSERT OR UPDATE OF status ON donations
  FOR EACH ROW EXECUTE FUNCTION update_campaign_on_donation();

-- Generate slug from title
CREATE OR REPLACE FUNCTION generate_campaign_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM campaigns WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_campaign_slug
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION generate_campaign_slug();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is fundraiser or admin
CREATE OR REPLACE FUNCTION is_fundraiser_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('fundraiser', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Categories: public read
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (is_admin());

-- Campaigns
CREATE POLICY "Active campaigns viewable by everyone" ON campaigns FOR SELECT USING (
  status IN ('active', 'verified', 'completed') OR creator_id = auth.uid() OR is_admin()
);
CREATE POLICY "Fundraisers can create campaigns" ON campaigns FOR INSERT WITH CHECK (
  auth.uid() = creator_id AND is_fundraiser_or_admin()
);
CREATE POLICY "Creators can update own campaigns" ON campaigns FOR UPDATE USING (
  creator_id = auth.uid() OR is_admin()
);

-- Campaign documents
CREATE POLICY "Campaign docs viewable" ON campaign_documents FOR SELECT USING (true);
CREATE POLICY "Fundraisers can upload docs" ON campaign_documents FOR INSERT WITH CHECK (
  uploaded_by = auth.uid()
);

-- Campaign gallery
CREATE POLICY "Gallery viewable" ON campaign_gallery FOR SELECT USING (true);
CREATE POLICY "Creators can manage gallery" ON campaign_gallery FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND creator_id = auth.uid())
);

-- Campaign updates
CREATE POLICY "Updates viewable" ON campaign_updates FOR SELECT USING (true);
CREATE POLICY "Creators can post updates" ON campaign_updates FOR INSERT WITH CHECK (
  author_id = auth.uid()
);

-- Comments
CREATE POLICY "Comments viewable" ON comments FOR SELECT USING (NOT is_hidden OR is_admin());
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit own comments" ON comments FOR UPDATE USING (user_id = auth.uid());

-- Donations
CREATE POLICY "Donations viewable by campaign owner and admin" ON donations FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND (creator_id = auth.uid() OR is_anonymous_donations = false))
  OR donor_id = auth.uid() OR is_admin()
);
CREATE POLICY "Anyone can create donation" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update donations" ON donations FOR UPDATE USING (is_admin());

-- Withdrawals
CREATE POLICY "Fundraisers see own withdrawals" ON withdrawal_requests FOR SELECT USING (
  fundraiser_id = auth.uid() OR is_admin()
);
CREATE POLICY "Fundraisers can request withdrawal" ON withdrawal_requests FOR INSERT WITH CHECK (
  fundraiser_id = auth.uid()
);
CREATE POLICY "Admins can process withdrawals" ON withdrawal_requests FOR UPDATE USING (is_admin());

-- Verification requests
CREATE POLICY "Users see own verification" ON verification_requests FOR SELECT USING (
  user_id = auth.uid() OR is_admin()
);
CREATE POLICY "Users can submit verification" ON verification_requests FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "Admins can review verification" ON verification_requests FOR UPDATE USING (is_admin());

-- Reports
CREATE POLICY "Authenticated can report" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins see reports" ON reports FOR SELECT USING (is_admin() OR reporter_id = auth.uid());
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (is_admin());

-- Notifications
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can mark read" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Admin logs: admin only
CREATE POLICY "Admins see logs" ON admin_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins can create logs" ON admin_logs FOR INSERT WITH CHECK (is_admin());

-- Platform settings: public read, admin write
CREATE POLICY "Settings viewable" ON platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON platform_settings FOR UPDATE USING (is_admin());

-- ============================================
-- STORAGE BUCKETS (run in Supabase dashboard or via API)
-- ============================================
-- avatars, campaign-covers, campaign-gallery, documents, receipts
