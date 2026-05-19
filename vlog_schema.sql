-- Create vlog_users table
CREATE TABLE IF NOT EXISTS vlog_users (
  id TEXT PRIMARY KEY, -- Unique ID (e.g., guest_uid or username)
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create vlog_videos table
CREATE TABLE IF NOT EXISTS vlog_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES vlog_users(id) ON DELETE SET NULL,
  uploader_name TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE NOT NULL, -- TRUE: System video / Ads, FALSE: Real user video
  likes INTEGER DEFAULT 0 NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  spots JSONB,
  hotels JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE vlog_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vlog_videos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to everyone
CREATE POLICY "Allow public read access on vlog_users" ON vlog_users FOR SELECT USING (true);
CREATE POLICY "Allow public read access on vlog_videos" ON vlog_videos FOR SELECT USING (true);

-- Allow public insert access to everyone
CREATE POLICY "Allow public insert access on vlog_users" ON vlog_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access on vlog_videos" ON vlog_videos FOR INSERT WITH CHECK (true);

-- Insert some initial system videos (ads/system videos) as seed data
INSERT INTO vlog_users (id, nickname, avatar_url)
VALUES ('system_admin', 'Quốc Admin 67k1', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&fit=crop')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vlog_videos (uploader_name, user_id, url, title, description, is_system, likes, views)
VALUES 
('Quốc Admin 67k1', 'system_admin', 'https://meddohfaywowscwmefxn.supabase.co/storage/v1/object/public/videos/Qu%E1%BB%91c%20Kh%C3%A1ch__guest_9i6nczd__video_1769165979500.mp4', 'Chào mừng tới Vlog Việt Nam Chill 🌴', 'Video hệ thống giới thiệu hành trình khám phá dải đất hình chữ S xinh đẹp cùng với Quốc Admin.', true, 4290, 15400)
ON CONFLICT DO NOTHING;
