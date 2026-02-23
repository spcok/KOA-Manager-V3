-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    initials TEXT NOT NULL,
    role TEXT NOT NULL,
    job_position TEXT,
    pin TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}'::jsonb,
    signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Animals Table
CREATE TABLE IF NOT EXISTS animals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    latin_name TEXT,
    category TEXT NOT NULL,
    dob DATE,
    is_dob_unknown BOOLEAN DEFAULT false,
    sex TEXT,
    location TEXT NOT NULL,
    description TEXT,
    special_requirements TEXT,
    critical_husbandry_notes JSONB DEFAULT '[]'::jsonb,
    toxicity TEXT,
    image_url TEXT,
    distribution_map_url TEXT,
    weight_unit TEXT DEFAULT 'g',
    summer_weight NUMERIC,
    winter_weight NUMERIC,
    flying_weight NUMERIC,
    ring_number TEXT,
    microchip TEXT,
    has_no_id BOOLEAN DEFAULT false,
    arrival_date DATE,
    origin TEXT,
    sire TEXT,
    dam TEXT,
    is_venomous BOOLEAN DEFAULT false,
    hazard_rating TEXT,
    red_list_status TEXT,
    target_day_temp NUMERIC,
    target_night_temp NUMERIC,
    target_basking_temp NUMERIC,
    target_cool_temp NUMERIC,
    target_humidity_min NUMERIC,
    target_humidity_max NUMERIC,
    misting_frequency TEXT,
    water_type TEXT,
    archived BOOLEAN DEFAULT false,
    is_quarantine BOOLEAN DEFAULT false,
    quarantine_start_date DATE,
    quarantine_reason TEXT,
    display_order INTEGER DEFAULT 0,
    is_group BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Animal Logs Table (replaces nested logs in JSON)
CREATE TABLE IF NOT EXISTS animal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    notes TEXT,
    timestamp BIGINT NOT NULL,
    user_initials TEXT NOT NULL,
    attachment_url TEXT,
    
    -- Type specific fields
    weight_grams NUMERIC,
    feed_method TEXT,
    has_cast BOOLEAN,
    
    health_type TEXT,
    condition TEXT,
    bcs NUMERIC,
    feather_condition TEXT,
    medication_name TEXT,
    medication_batch TEXT,
    medication_dosage TEXT,
    medication_route TEXT,
    medication_frequency TEXT,
    medication_end_date DATE,
    prescribed_by TEXT,
    cause_of_death TEXT,
    disposal_method TEXT,

    temperature NUMERIC,
    basking_temp NUMERIC,
    cool_temp NUMERIC,
    
    weather_desc TEXT,
    wind_speed NUMERIC,
    flight_duration NUMERIC,
    flight_quality TEXT,
    gps_url TEXT,
    
    movement_type TEXT,
    movement_source TEXT,
    movement_destination TEXT,
    
    weathering_start TIMESTAMPTZ,
    weathering_end TIMESTAMPTZ,
    
    egg_count INTEGER,
    egg_weight NUMERIC,
    shell_quality TEXT,
    egg_outcome TEXT,

    event_type TEXT,
    event_start_time TIMESTAMPTZ,
    event_end_time TIMESTAMPTZ,
    event_duration INTEGER,
    event_animal_ids JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    recurring BOOLEAN DEFAULT false,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Site Logs Table
CREATE TABLE IF NOT EXISTS site_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    cost NUMERIC,
    logged_by TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    time TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    actions_taken TEXT,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. First Aid Logs Table
CREATE TABLE IF NOT EXISTS first_aid_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    time TEXT NOT NULL,
    person_name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    treatment TEXT NOT NULL,
    treated_by TEXT NOT NULL,
    location TEXT NOT NULL,
    outcome TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Time Logs Table
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    start_time BIGINT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    end_time BIGINT,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Holiday Requests Table
CREATE TABLE IF NOT EXISTS holiday_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    status TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Global Documents Table
CREATE TABLE IF NOT EXISTS global_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT NOT NULL,
    upload_date DATE NOT NULL,
    expiry_date DATE,
    notes TEXT,
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE, -- If attached to an animal
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp BIGINT NOT NULL,
    action TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX idx_animal_logs_animal_id ON animal_logs(animal_id);
CREATE INDEX idx_animal_logs_date ON animal_logs(date);
CREATE INDEX idx_animal_logs_type ON animal_logs(type);
CREATE INDEX idx_tasks_animal_id ON tasks(animal_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX idx_holiday_requests_user_id ON holiday_requests(user_id);
CREATE INDEX idx_global_documents_animal_id ON global_documents(animal_id);

-- RPC Function for Secure Login (Updated for new schema)
CREATE OR REPLACE FUNCTION authenticate_user(p_user_id UUID, p_pin TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'initials', initials,
        'role', role,
        'job_position', job_position,
        'active', active,
        'permissions', permissions,
        'signature', signature
    ) INTO v_user
    FROM users
    WHERE id = p_user_id AND pin = p_pin AND active = true;

    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Invalid credentials or inactive user';
    END IF;

    RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current user's role
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Create Policies (Simplified for now, assuming app handles auth via RPC and custom tokens or Supabase Auth)
-- For this migration, we will allow authenticated users to read/write, but in a real app, you'd restrict based on roles.
-- Since the app uses a custom PIN login, RLS might need to be permissive for the anon key if custom JWTs aren't used,
-- OR we use a service role key for backend operations. Assuming standard anon key usage with custom auth:
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated animals" ON animals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated animal_logs" ON animal_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated site_logs" ON site_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated incidents" ON incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated first_aid_logs" ON first_aid_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated time_logs" ON time_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated holiday_requests" ON holiday_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated global_documents" ON global_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
