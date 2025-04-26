-- USERS
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             citext UNIQUE NOT NULL,
  password_hash     text          NOT NULL,
  display_name      text,
  avatar_url        text,
  bio               text,
  created_at        timestamptz   NOT NULL DEFAULT now()
);

-- CATEGORIES & USER_CATEGORIES
CREATE TABLE categories (
  id      smallserial PRIMARY KEY,
  name    text UNIQUE NOT NULL
);

CREATE TABLE user_categories (
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  category_id  smallint REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, category_id)
);

-- FRIENDSHIPS (status = pending / accepted / blocked)
CREATE TABLE friendships (
  user_id        uuid REFERENCES users(id) ON DELETE CASCADE,
  friend_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  status         text       NOT NULL,
  created_at     timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

-- CONVERSATIONS & MESSAGES
CREATE TABLE conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id        uuid REFERENCES users(id),
  user2_id        uuid REFERENCES users(id),
  UNIQUE (user1_id, user2_id)
);

CREATE TABLE messages (
  id            bigserial PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid REFERENCES users(id),
  body            text,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  message_type    text DEFAULT 'text'  -- 'text' | 'call_offer' | etc.
);

-- CODE REPOS, FOLDERS, FILES
CREATE TABLE code_repos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  name          text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE code_folders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id     uuid REFERENCES code_repos(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES code_folders(id),
  name        text NOT NULL
);

CREATE TABLE code_files (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id       uuid REFERENCES code_folders(id) ON DELETE CASCADE,
  filename        text,
  storage_path    text,          -- ścieżka w S3 / Blob
  language        text,
  uploaded_at     timestamptz DEFAULT now(),
  hash_sha256     char(64),
  is_plagiarised  boolean DEFAULT false
);

-- PLAGIARISM LOG
CREATE TABLE plagiarism_log (
  id               bigserial PRIMARY KEY,
  file_a_id        uuid REFERENCES code_files(id),
  file_b_id        uuid REFERENCES code_files(id),
  similarity_pct   numeric(5,2),
  detected_at      timestamptz DEFAULT now(),
  CONSTRAINT uniq_pair UNIQUE (file_a_id, file_b_id)
);

-- pgvector – przechowujemy wektor preferencji  (np. 128‑dimensional)
ALTER TABLE users
  ADD COLUMN prefs_vec vector(128);

CREATE INDEX idx_users_prefs_vec ON users USING ivfflat (prefs_vec vector_cosine_ops);

