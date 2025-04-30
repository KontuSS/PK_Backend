-- USERS podstawowe info
CREATE TABLE users (
  id              serial PRIMARY KEY,
  email           citext UNIQUE NOT NULL,
  password_hash   text NOT NULL,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  nick            text UNIQUE NOT NULL,
  bio             text,
  age             integer CHECK (age >=8 ),
  is_active       boolean DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_profile_photo (
  id           serial PRIMARY KEY,
  user_id      serial REFERENCES users(id) ON DELETE CASCADE,
  file_name    text NOT NULL,-- nwm czy potrzeba zostawilem dla pewnosci
  file_data    bytea NOT NULL,-- tu jest przechowywany sam plik
  type    text CHECK (mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')),
  uploaded_at  timestamptz DEFAULT now()
);

--zainteresowania
CREATE TABLE intrests (
  id      serial PRIMARY KEY,
  name    text UNIQUE NOT NULL,
  description text
);


CREATE TABLE user_interests (
  user_id       serial PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  category_ids  serial[],
  CHECK (cardinality(category_ids) = cardinality(ARRAY(SELECT DISTINCT unnest(category_ids))))--sprawdza czy nie ma powtorek przetestowac czy dziala
);


-- FRIENDSHIPS  relations 
CREATE TABLE friend_requests ( --podstawowa wersja odnoszaca sie do zaproszen miedzy uzytkowniakami
  id              serial PRIMARY KEY,
  sender_id       serial REFERENCES users(id) ON DELETE CASCADE,
  receiver_id     serial REFERENCES users(id) ON DELETE CASCADE,
  message         text,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'rejected')),
  sent_at         timestamptz DEFAULT now(),
  CHECK (sender_id <> receiver_id),
  UNIQUE (sender_id, receiver_id)
);

CREATE TABLE user_friends (-- vektor z id uzytkownikow przyjaciol
  user_id   serial PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  friends   serial[] NOT NULL DEFAULT '{}',
   CHECK (cardinality(friends) = cardinality(ARRAY(SELECT DISTINCT unnest(friends))))--sprawdza czy nie ma powtorek przetestowac czy dziala
);

CREATE TABLE user_blocked (-- vektor z id uzytkownikow zablokowanych
  user_id       serial PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  blocked_users serial[] NOT NULL DEFAULT '{}',
  CHECK (    cardinality(blocked_users) = cardinality(ARRAY(SELECT DISTINCT unnest(blocked_users)))  )--sprawdza czy nie ma powtorek przetestowac czy dziala
);



-- CONVERSATIONS & MESSAGES
CREATE TABLE conversations (--nie zakładamy na tym etapie grup czatów
  id              bigserial PRIMARY KEY, 
  user1_id        serial REFERENCES users(id),
  user2_id        serial REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (user1_id < user2_id);          -- wymuszenie braku symentrycznosci
  UNIQUE (user1_id, user2_id)
);

CREATE TABLE messages (
  id              bigserial PRIMARY KEY,
  conversation_id bigserial REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       serial REFERENCES users(id),
  receiver_id     serial REFERENCES users(id),
  message_type    text CHECK (message_type IN ('text', 'image/JPEG','image/JPG','image/PNG','image/WEBP', 'link', 'voice', 'file/TXT','folder','ZIP')) NOT NULL,
  content         bytea NOT NULL, -- tylko dla tekstu/linku
  sent_at         timestamptz DEFAULT now(),
  is_read         boolean DEFAULT false
);


-- CODE REPOS, FOLDERS, FILES
CREATE TABLE repositories (
  id            serial PRIMARY KEY,
  user_id       serial REFERENCES users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  UNIQUE(user_id, name)

);

CREATE TABLE repository_metadata (
  repository_id    serial PRIMARY KEY REFERENCES repositories(id) ON DELETE CASCADE,
  total_files      integer DEFAULT 0,
  total_folders    integer DEFAULT 0,
  total_size       bigint DEFAULT 0,          -- w bajtach
  created_at       timestamptz DEFAULT now(),
  last_modified    timestamptz,
  license          text,
  visibility       text CHECK (visibility IN ('public', 'private')) DEFAULT 'private'
);


CREATE TABLE repo_entries (
  id              serial PRIMARY KEY,
  name            text NOT NULL,
  repository_id   uuid REFERENCES repositories(id) ON DELETE CASCADE,
  parent_id       uuid REFERENCES repo_entries(id) ON DELETE CASCADE DEFAULT NULL,
);

CREATE TABLE repo_entries_data (
  entry_id        serial PRIMARY KEY REFERENCES repo_entries(id) ON DELETE CASCADE,
  is_directory    boolean NOT NULL DEFAULT false,
  extension       text CHECK (extension IN ('txt', 'py', 'java', 'cpp', 'js', 'html', 'css', 'json', 'xml')) DEFAULT NULL,
  content         text,
  number_of_lines integer,
  size            integer,
  last_modified   timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  CHECK ((is_directory = true AND extension IS NULL AND content IS NULL AND number_of_lines IS NULL)    OR    (is_directory = false)  ),
  CHECK (size >= 0)
);



-- Tabele zwiazane z plagiatami do zrobienia po wymysleniu mechanizmu antyplagiatowego 

-- CREATE TABLE plagiarism_log (
--   id               bigserial PRIMARY KEY,
--   file_a_id        uuid REFERENCES code_files(id),
--   file_b_id        uuid REFERENCES code_files(id),
--   similarity_pct   numeric(5,2),
--   detected_at      timestamptz DEFAULT now(),
--   CONSTRAINT uniq_pair UNIQUE (file_a_id, file_b_id)
-- );

-- -- pgvector – przechowujemy wektor preferencji  (np. 128‑dimensional)
-- ALTER TABLE users
--   ADD COLUMN prefs_vec vector(128);

-- CREATE INDEX idx_users_prefs_vec ON users USING ivfflat (prefs_vec vector_cosine_ops);

