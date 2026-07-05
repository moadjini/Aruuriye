-- Create broadcasts table for admin announcements and popups
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  is_popup BOOLEAN DEFAULT false, -- Whether to show as popup
  popup_duration INTEGER DEFAULT 5, -- Duration in seconds for popup
  is_active BOOLEAN DEFAULT true,
  target_audience TEXT DEFAULT 'all', -- 'all', 'fundraisers', 'donors'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_broadcasts_is_active ON broadcasts(is_active);
CREATE INDEX idx_broadcasts_expires_at ON broadcasts(expires_at);

-- Enable realtime for broadcasts
ALTER PUBLICATION supabase_realtime ADD TABLE broadcasts;
