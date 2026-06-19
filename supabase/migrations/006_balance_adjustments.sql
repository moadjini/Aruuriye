-- Create balance_adjustments table for tracking admin balance adjustments
CREATE TABLE balance_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  adjusted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_balance_adjustments_user_id ON balance_adjustments(user_id);
CREATE INDEX idx_balance_adjustments_adjusted_by ON balance_adjustments(adjusted_by);
