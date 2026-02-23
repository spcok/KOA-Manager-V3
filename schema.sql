-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    initials TEXT NOT NULL,
    role TEXT NOT NULL,
    pin TEXT NOT NULL, -- In a real app, this should be hashed
    active BOOLEAN DEFAULT true,
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Animals Table
CREATE TABLE IF NOT EXISTS animals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    archived BOOLEAN DEFAULT false,
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    due_date TIMESTAMPTZ,
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Logs Table
CREATE TABLE IF NOT EXISTS site_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- First Aid Logs Table
CREATE TABLE IF NOT EXISTS first_aid_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TEXT NOT NULL,
    person_name TEXT NOT NULL,
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Logs Table
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holiday Requests Table
CREATE TABLE IF NOT EXISTS holiday_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    status TEXT NOT NULL,
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global Documents Table
CREATE TABLE IF NOT EXISTS global_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Local Backups Table
CREATE TABLE IF NOT EXISTS local_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC Function for Secure Login
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
        'active', active,
        'json', json
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
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_backups ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current user's role
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Users Table Policies
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (get_user_role() = 'admin');

-- Animals Table Policies
CREATE POLICY "Anyone can read animals" ON animals FOR SELECT USING (true);
CREATE POLICY "Admins can insert animals" ON animals FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admins can update animals" ON animals FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Admins can delete animals" ON animals FOR DELETE USING (get_user_role() = 'admin');

-- Tasks Table Policies
CREATE POLICY "Anyone can read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Keepers and Admins can insert tasks" ON tasks FOR INSERT WITH CHECK (get_user_role() IN ('keeper', 'admin'));
CREATE POLICY "Keepers and Admins can update tasks" ON tasks FOR UPDATE USING (get_user_role() IN ('keeper', 'admin'));
CREATE POLICY "Admins can delete tasks" ON tasks FOR DELETE USING (get_user_role() = 'admin');

-- Site Logs Table Policies
CREATE POLICY "Anyone can read site_logs" ON site_logs FOR SELECT USING (true);
CREATE POLICY "Keepers and Admins can insert site_logs" ON site_logs FOR INSERT WITH CHECK (get_user_role() IN ('keeper', 'admin'));
CREATE POLICY "Keepers and Admins can update site_logs" ON site_logs FOR UPDATE USING (get_user_role() IN ('keeper', 'admin'));
CREATE POLICY "Admins can delete site_logs" ON site_logs FOR DELETE USING (get_user_role() = 'admin');

-- Incidents Table Policies
CREATE POLICY "Anyone can read incidents" ON incidents FOR SELECT USING (true);
CREATE POLICY "Keepers and Admins can insert incidents" ON incidents FOR INSERT WITH CHECK (get_user_role() IN ('keeper', 'admin'));
CREATE POLICY "Keepers and Admins can update incidents" ON incidents FOR UPDATE USING (get_user_role() IN ('keeper', 'admin'));
CREATE POLICY "Admins can delete incidents" ON incidents FOR DELETE USING (get_user_role() = 'admin');

-- First Aid Logs Table Policies
CREATE POLICY "Anyone can read first_aid_logs" ON first_aid_logs FOR SELECT USING (true);
CREATE POLICY "Keepers and Admins can insert first_aid_logs" ON first_aid_logs FOR INSERT WITH CHECK (get_user_role() IN ('keeper', 'admin'));
CREATE POLICY "Keepers and Admins can update first_aid_logs" ON first_aid_logs FOR UPDATE USING (get_user_role() IN ('keeper', 'admin'));
CREATE POLICY "Admins can delete first_aid_logs" ON first_aid_logs FOR DELETE USING (get_user_role() = 'admin');

-- Time Logs Table Policies
CREATE POLICY "Anyone can read time_logs" ON time_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert their own time_logs" ON time_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR get_user_role() = 'admin');
CREATE POLICY "Users can update their own time_logs" ON time_logs FOR UPDATE USING (auth.uid() = user_id OR get_user_role() = 'admin');
CREATE POLICY "Admins can delete time_logs" ON time_logs FOR DELETE USING (get_user_role() = 'admin');

-- Holiday Requests Table Policies
CREATE POLICY "Anyone can read holiday_requests" ON holiday_requests FOR SELECT USING (true);
CREATE POLICY "Users can insert their own holiday_requests" ON holiday_requests FOR INSERT WITH CHECK (auth.uid() = user_id OR get_user_role() = 'admin');
CREATE POLICY "Users can update their own holiday_requests" ON holiday_requests FOR UPDATE USING (auth.uid() = user_id OR get_user_role() = 'admin');
CREATE POLICY "Admins can delete holiday_requests" ON holiday_requests FOR DELETE USING (get_user_role() = 'admin');

-- Settings Table Policies
CREATE POLICY "Anyone can read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON settings FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admins can update settings" ON settings FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Admins can delete settings" ON settings FOR DELETE USING (get_user_role() = 'admin');

-- Global Documents Table Policies
CREATE POLICY "Anyone can read global_documents" ON global_documents FOR SELECT USING (true);
CREATE POLICY "Admins can insert global_documents" ON global_documents FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admins can update global_documents" ON global_documents FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Admins can delete global_documents" ON global_documents FOR DELETE USING (get_user_role() = 'admin');

-- Audit Logs Table Policies
CREATE POLICY "Admins can read audit_logs" ON audit_logs FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Anyone can insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update audit_logs" ON audit_logs FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Admins can delete audit_logs" ON audit_logs FOR DELETE USING (get_user_role() = 'admin');

-- Local Backups Table Policies
CREATE POLICY "Admins can read local_backups" ON local_backups FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Admins can insert local_backups" ON local_backups FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admins can update local_backups" ON local_backups FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Admins can delete local_backups" ON local_backups FOR DELETE USING (get_user_role() = 'admin');
