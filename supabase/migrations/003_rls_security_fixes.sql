-- RLS Security Fixes for HaddaICaawi
-- Run in Supabase SQL Editor

-- Fix: Require authentication for donation creation to prevent spam/fraud
DROP POLICY IF EXISTS "Anyone can create donation" ON donations;
CREATE POLICY "Authenticated users can create donation" ON donations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix: Add policy to prevent deletion of donations by non-admins
CREATE POLICY "Admins can delete donations" ON donations FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of campaigns by non-admins  
CREATE POLICY "Admins can delete campaigns" ON campaigns FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of withdrawal requests by non-admins
CREATE POLICY "Admins can delete withdrawals" ON withdrawal_requests FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of verification requests by non-admins
CREATE POLICY "Admins can delete verification requests" ON verification_requests FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of comments by non-admins
CREATE POLICY "Admins can delete comments" ON comments FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of reports by non-admins
CREATE POLICY "Admins can delete reports" ON reports FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of campaign documents by non-admins
CREATE POLICY "Admins can delete campaign documents" ON campaign_documents FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of campaign gallery by non-admins
CREATE POLICY "Admins can delete campaign gallery" ON campaign_gallery FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of campaign updates by non-admins
CREATE POLICY "Admins can delete campaign updates" ON campaign_updates FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of notifications by non-admins (users should only update is_read)
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());

-- Fix: Add policy to prevent deletion of profiles by non-admins
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of categories by non-admins
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE USING (is_admin());

-- Fix: Add policy to prevent deletion of platform settings by non-admins
CREATE POLICY "Admins can delete settings" ON platform_settings FOR DELETE USING (is_admin());
