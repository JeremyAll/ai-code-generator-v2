-- Créer la table allowed_users
CREATE TABLE IF NOT EXISTS allowed_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  invite_code TEXT,
  added_by TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);

-- Ajouter l'index pour les recherches rapides
CREATE INDEX idx_allowed_users_email ON allowed_users(email);

-- Ajouter les premiers utilisateurs autorisés
INSERT INTO allowed_users (email, invite_code, added_by, notes) VALUES
  ('jeremyallouche@hotmail.fr', 'TONCODE2024', 'admin', 'Créateur de la plateforme');

-- Créer une fonction pour vérifier si un email est autorisé
CREATE OR REPLACE FUNCTION is_email_allowed(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM allowed_users 
    WHERE email = user_email 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture (tout le monde peut vérifier)
CREATE POLICY "Anyone can check allowed emails" ON allowed_users
  FOR SELECT USING (true);