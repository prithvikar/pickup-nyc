-- -----------------------------------------------------
-- Check-in Enhancements
-- -----------------------------------------------------

-- Create Check-in Status Type
CREATE TYPE checkin_status AS ENUM ('PLAYING', 'WAITING');

-- Add new columns to checkins table
ALTER TABLE public.checkins 
ADD COLUMN IF NOT EXISTS status checkin_status DEFAULT 'WAITING',
ADD COLUMN IF NOT EXISTS party_size INTEGER DEFAULT 1;

-- -----------------------------------------------------
-- Function: Check In (Enforces Single Active Check-in)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_in(
  p_court_id BIGINT,
  p_status checkin_status,
  p_party_size INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_checkin_id BIGINT;
BEGIN
  -- 1. Remove any existing check-in for this user (user can only be at one place)
  DELETE FROM public.checkins WHERE user_id = auth.uid();

  -- 2. Insert new check-in
  -- Expires in 2 hours automatically
  INSERT INTO public.checkins (user_id, court_id, status, party_size, expires_at)
  VALUES (
    auth.uid(), 
    p_court_id, 
    p_status, 
    p_party_size, 
    NOW() + INTERVAL '2 hours'
  )
  RETURNING id INTO v_checkin_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Checked in successfully.',
    'checkin_id', v_checkin_id
  );
END;
$$;

-- -----------------------------------------------------
-- Function: Get Court Queue
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_court_queue(p_court_id BIGINT)
RETURNS TABLE (
  username TEXT,
  avatar_url TEXT,
  status checkin_status,
  party_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.username,
    p.avatar_url,
    c.status,
    c.party_size,
    c.created_at
  FROM public.checkins c
  JOIN public.profiles p ON c.user_id = p.id
  WHERE c.court_id = p_court_id
  ORDER BY c.created_at ASC; -- FIFO Queue
$$;
