-- Adiciona coluna gender na tabela profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender text DEFAULT 'male'
  CHECK (gender IN ('male', 'female'));
