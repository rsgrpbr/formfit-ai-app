ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz
  DEFAULT (now() + interval '7 days');
