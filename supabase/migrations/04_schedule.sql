-- Create a table for court slots
CREATE TYPE slot_status AS ENUM ('OPEN', 'TAKEN');

CREATE TABLE IF NOT EXISTS court_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id BIGINT NOT NULL, -- Logical ID from our static data
    court_number INT NOT NULL, -- Which specific court (1, 2, 3...)
    start_time TIMESTAMPTZ NOT NULL, -- e.g. 2024-01-01 08:00:00+00
    status slot_status DEFAULT 'OPEN',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique slot per court per time
    UNIQUE(court_id, court_number, start_time)
);

-- Enable RLS
ALTER TABLE court_slots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read slots"
ON court_slots FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can update slots"
ON court_slots FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update existing slots"
ON court_slots FOR UPDATE
TO authenticated
USING (true);

-- RPC to get slots for a specific date range (simplified for client convenience)
CREATE OR REPLACE FUNCTION get_court_schedule(
    p_court_id BIGINT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    id UUID,
    court_id BIGINT,
    court_number INT,
    start_time TIMESTAMPTZ,
    status slot_status,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        id,
        court_id,
        court_number,
        start_time,
        status,
        updated_at
    FROM court_slots
    WHERE court_id = p_court_id
    AND start_time >= p_start_time
    AND start_time < p_end_time
    ORDER BY start_time ASC, court_number ASC;
$$;

-- RPC to toggle a slot (Insert or Update)
CREATE OR REPLACE FUNCTION toggle_court_slot(
    p_court_id BIGINT,
    p_court_number INT,
    p_start_time TIMESTAMPTZ,
    p_status slot_status
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot_id UUID;
BEGIN
    INSERT INTO court_slots (court_id, court_number, start_time, status, updated_at, updated_by)
    VALUES (p_court_id, p_court_number, p_start_time, p_status, NOW(), auth.uid())
    ON CONFLICT (court_id, court_number, start_time)
    DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = NOW(),
        updated_by = EXCLUDED.updated_by
    RETURNING id INTO v_slot_id;
    
    RETURN json_build_object('slot_id', v_slot_id, 'status', 'success');
END;
$$;
