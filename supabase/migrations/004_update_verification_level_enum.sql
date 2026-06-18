-- Update verification_level enum to use 'verified' instead of level_1, level_2, level_3

-- First, update any existing data to use 'none' or 'verified'
UPDATE profiles SET verification_level = 'none' WHERE verification_level NOT IN ('none', 'verified');
UPDATE verification_requests SET requested_level = 'none' WHERE requested_level NOT IN ('none', 'verified');

-- Drop the old enum type
DROP TYPE IF EXISTS verification_level CASCADE;

-- Create the new enum with simplified values
CREATE TYPE verification_level AS ENUM ('none', 'verified');

-- Re-create the verification_requests table with the new enum
ALTER TABLE verification_requests ALTER COLUMN requested_level TYPE verification_level USING requested_level::text::verification_level;
ALTER TABLE profiles ALTER COLUMN verification_level TYPE verification_level USING verification_level::text::verification_level;
