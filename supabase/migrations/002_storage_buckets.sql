-- Storage buckets for HaddaICaawi
-- Run in Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('campaign-covers', 'campaign-covers', true),
  ('campaign-gallery', 'campaign-gallery', true),
  ('documents', 'documents', false),
  ('verification-docs', 'verification-docs', true),
  ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars: users can upload own
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Verification documents: users can upload own
CREATE POLICY "Users upload own verification docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Verification docs are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'verification-docs');

-- Campaign covers
CREATE POLICY "Fundraisers upload covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'campaign-covers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Covers are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'campaign-covers');

-- Campaign gallery
CREATE POLICY "Fundraisers upload gallery" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'campaign-gallery' AND auth.uid() IS NOT NULL);

CREATE POLICY "Gallery is public" ON storage.objects
  FOR SELECT USING (bucket_id = 'campaign-gallery');

-- Documents (private)
CREATE POLICY "Users upload own docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Receipts
CREATE POLICY "Fundraisers upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Receipts readable by owner" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
