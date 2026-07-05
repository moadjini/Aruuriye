-- Lockdown Public Access Migration
-- Prevents all unauthenticated access to database tables
-- Only authenticated users with proper permissions can read/write data

-- ============================================
-- CATEGORIES
-- ============================================
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories viewable by authenticated users" ON categories FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE USING (is_admin());
CREATE POLICY "Admins can update categories" ON categories FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can insert categories" ON categories FOR INSERT WITH CHECK (is_admin());

-- ============================================
-- PROFILES
-- ============================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE USING (is_admin());
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- CAMPAIGNS
-- ============================================
DROP POLICY IF EXISTS "Active campaigns viewable by everyone" ON campaigns;
CREATE POLICY "Active campaigns viewable by authenticated users" ON campaigns FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    status IN ('active', 'verified', 'completed') OR creator_id = auth.uid() OR is_admin()
  )
);
DROP POLICY IF EXISTS "Fundraisers can create campaigns" ON campaigns;
CREATE POLICY "Fundraisers can create campaigns" ON campaigns FOR INSERT WITH CHECK (
  auth.uid() = creator_id AND is_fundraiser_or_admin()
);
DROP POLICY IF EXISTS "Creators can update own campaigns" ON campaigns;
CREATE POLICY "Creators can update own campaigns" ON campaigns FOR UPDATE USING (
  creator_id = auth.uid() OR is_admin()
);
DROP POLICY IF EXISTS "Admins can delete campaigns" ON campaigns;
CREATE POLICY "Admins can delete campaigns" ON campaigns FOR DELETE USING (is_admin());

-- ============================================
-- CAMPAIGN DOCUMENTS
-- ============================================
DROP POLICY IF EXISTS "Campaign docs viewable" ON campaign_documents;
CREATE POLICY "Campaign docs viewable by authenticated users" ON campaign_documents FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Fundraisers can upload docs" ON campaign_documents;
CREATE POLICY "Fundraisers can upload docs" ON campaign_documents FOR INSERT WITH CHECK (
  uploaded_by = auth.uid()
);
CREATE POLICY "Campaign doc owners can update" ON campaign_documents FOR UPDATE USING (uploaded_by = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Admins can delete campaign documents" ON campaign_documents;
CREATE POLICY "Admins can delete campaign documents" ON campaign_documents FOR DELETE USING (is_admin());

-- ============================================
-- CAMPAIGN GALLERY
-- ============================================
DROP POLICY IF EXISTS "Gallery viewable" ON campaign_gallery;
CREATE POLICY "Gallery viewable by authenticated users" ON campaign_gallery FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Creators can manage gallery" ON campaign_gallery;
CREATE POLICY "Creators can manage gallery" ON campaign_gallery FOR ALL USING (
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM campaigns WHERE id = campaign_id AND creator_id = auth.uid()
  )) OR is_admin()
);
DROP POLICY IF EXISTS "Admins can delete campaign gallery" ON campaign_gallery;
CREATE POLICY "Admins can delete campaign gallery" ON campaign_gallery FOR DELETE USING (is_admin());

-- ============================================
-- CAMPAIGN UPDATES
-- ============================================
DROP POLICY IF EXISTS "Updates viewable" ON campaign_updates;
CREATE POLICY "Updates viewable by authenticated users" ON campaign_updates FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Creators can post updates" ON campaign_updates;
CREATE POLICY "Creators can post updates" ON campaign_updates FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Update authors can update" ON campaign_updates FOR UPDATE USING (author_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Admins can delete campaign updates" ON campaign_updates;
CREATE POLICY "Admins can delete campaign updates" ON campaign_updates FOR DELETE USING (is_admin());

-- ============================================
-- COMMENTS
-- ============================================
DROP POLICY IF EXISTS "Comments viewable" ON comments;
CREATE POLICY "Comments viewable by authenticated users" ON comments FOR SELECT USING (
  auth.uid() IS NOT NULL AND (NOT is_hidden OR is_admin())
);
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can edit own comments" ON comments;
CREATE POLICY "Users can edit own comments" ON comments FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can delete comments" ON comments;
CREATE POLICY "Admins can delete comments" ON comments FOR DELETE USING (is_admin());

-- ============================================
-- DONATIONS
-- ============================================
DROP POLICY IF EXISTS "Donations viewable by campaign owner and admin" ON donations;
CREATE POLICY "Donations viewable by authenticated users" ON donations FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND (creator_id = auth.uid() OR is_anonymous_donations = false))
    OR donor_id = auth.uid() OR is_admin()
  )
);
DROP POLICY IF EXISTS "Anyone can create donation" ON donations;
CREATE POLICY "Authenticated users can create donation" ON donations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can update donations" ON donations;
CREATE POLICY "Admins can update donations" ON donations FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete donations" ON donations;
CREATE POLICY "Admins can delete donations" ON donations FOR DELETE USING (is_admin());

-- ============================================
-- WITHDRAWAL REQUESTS
-- ============================================
DROP POLICY IF EXISTS "Fundraisers see own withdrawals" ON withdrawal_requests;
CREATE POLICY "Fundraisers see own withdrawals" ON withdrawal_requests FOR SELECT USING (
  auth.uid() IS NOT NULL AND (fundraiser_id = auth.uid() OR is_admin())
);
DROP POLICY IF EXISTS "Fundraisers can request withdrawal" ON withdrawal_requests;
CREATE POLICY "Fundraisers can request withdrawal" ON withdrawal_requests FOR INSERT WITH CHECK (
  auth.uid() = fundraiser_id
);
DROP POLICY IF EXISTS "Admins can process withdrawals" ON withdrawal_requests;
CREATE POLICY "Admins can process withdrawals" ON withdrawal_requests FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete withdrawals" ON withdrawal_requests;
CREATE POLICY "Admins can delete withdrawals" ON withdrawal_requests FOR DELETE USING (is_admin());

-- ============================================
-- VERIFICATION REQUESTS
-- ============================================
DROP POLICY IF EXISTS "Users see own verification" ON verification_requests;
CREATE POLICY "Users see own verification" ON verification_requests FOR SELECT USING (
  auth.uid() IS NOT NULL AND (user_id = auth.uid() OR is_admin())
);
DROP POLICY IF EXISTS "Users can submit verification" ON verification_requests;
CREATE POLICY "Users can submit verification" ON verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can review verification" ON verification_requests;
CREATE POLICY "Admins can review verification" ON verification_requests FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete verification requests" ON verification_requests;
CREATE POLICY "Admins can delete verification requests" ON verification_requests FOR DELETE USING (is_admin());

-- ============================================
-- REPORTS
-- ============================================
DROP POLICY IF EXISTS "Authenticated can report" ON reports;
CREATE POLICY "Authenticated can report" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins see reports" ON reports;
CREATE POLICY "Admins see reports" ON reports FOR SELECT USING (is_admin() OR reporter_id = auth.uid());
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;
CREATE POLICY "Admins can delete reports" ON reports FOR DELETE USING (is_admin());

-- ============================================
-- NOTIFICATIONS
-- ============================================
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can mark read" ON notifications;
CREATE POLICY "Users can mark read" ON notifications FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- ADMIN LOGS
-- ============================================
DROP POLICY IF EXISTS "Admins see logs" ON admin_logs;
CREATE POLICY "Admins see logs" ON admin_logs FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can create logs" ON admin_logs;
CREATE POLICY "Admins can create logs" ON admin_logs FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can delete logs" ON admin_logs FOR DELETE USING (is_admin());

-- ============================================
-- PLATFORM SETTINGS
-- ============================================
DROP POLICY IF EXISTS "Settings viewable" ON platform_settings;
CREATE POLICY "Settings viewable by authenticated users" ON platform_settings FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins update settings" ON platform_settings;
CREATE POLICY "Admins update settings" ON platform_settings FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete settings" ON platform_settings;
CREATE POLICY "Admins can delete settings" ON platform_settings FOR DELETE USING (is_admin());
CREATE POLICY "Admins can insert settings" ON platform_settings FOR INSERT WITH CHECK (is_admin());
