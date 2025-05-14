-- USERS podstawowe info
CREATE TABLE users (
  id              serial PRIMARY KEY,
  email           text UNIQUE NOT NULL,
  password_hash   text NOT NULL,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  nick            text UNIQUE NOT NULL,
  bio             text,
  age             integer CHECK (age >=8 ),
  is_active       boolean DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
  fcmToken      text DEFAULT NULL,-- token 
);

CREATE TABLE user_profile_photo (
  id           serial PRIMARY KEY,
  user_id      serial REFERENCES users(id) ON DELETE CASCADE,
  file_name    text NOT NULL,-- nwm czy potrzeba zostawilem dla pewnosci
  file_data    bytea NOT NULL,-- tu jest przechowywany sam plik
  type    text CHECK (type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')),
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
  category_ids  integer[]
  --CHECK (cardinality(category_ids) = cardinality(ARRAY(SELECT DISTINCT unnest(category_ids))))--sprawdza czy nie ma powtorek przetestowac czy dziala
  --do dodania przez backend
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
  friends   integer[] NOT NULL DEFAULT '{}'
  -- CHECK (cardinality(friends) = cardinality(ARRAY(SELECT DISTINCT unnest(friends))))--sprawdza czy nie ma powtorek przetestowac czy dziala
   --do dodania przez backend
);

CREATE TABLE user_blocked (-- vektor z id uzytkownikow zablokowanych
  user_id       serial PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  blocked_users integer[] NOT NULL DEFAULT '{}'
  --CHECK (    cardinality(blocked_users) = cardinality(ARRAY(SELECT DISTINCT unnest(blocked_users)))  )--sprawdza czy nie ma powtorek przetestowac czy dziala
   --do dodania przez backend
);



-- CONVERSATIONS & MESSAGES
CREATE TABLE conversations (--nie zakładamy na tym etapie grup czatów
  id              bigserial PRIMARY KEY, 
  user1_id        serial REFERENCES users(id),
  user2_id        serial REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (user1_id < user2_id),          -- wymuszenie braku symentrycznosci
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
  repository_id   serial REFERENCES repositories(id) ON DELETE CASCADE,
  parent_id       integer REFERENCES repo_entries(id) ON DELETE CASCADE
);

CREATE TABLE repo_entries_data (
  entry_id        serial PRIMARY KEY REFERENCES repo_entries(id) ON DELETE CASCADE,
  is_directory    boolean NOT NULL DEFAULT false,
  extension       text CHECK (extension IN ('txt', 'py', 'java', 'cpp', 'js', 'html', 'css', 'json', 'xml','md','kt')) DEFAULT NULL,
  content         text,
  number_of_lines integer,
  size            integer,
  last_modified   timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  CHECK ((is_directory = true AND extension IS NULL AND content IS NULL AND number_of_lines IS NULL)    OR    (is_directory = false)  ),
  CHECK (size >= 0)
);



-- Tabele zwiazane z plagiatami
CREATE TABLE TokenizedCodes (
    id SERIAL PRIMARY KEY,
    EntryID INTEGER REFERENCES repo_entries(id) ON DELETE CASCADE NOT NULL,
    TokenSequence TEXT NOT NULL,          -- Sekwencja tokenów
    NormalizedTokenSequence TEXT NOT NULL, -- Znormalizowane tokeny
    FolderPath VARCHAR(512)  -- Ścieżka do katalogu
);

CREATE TABLE ComparisonResults (
    Id SERIAL PRIMARY KEY,
    Code1Id INTEGER REFERENCES TokenizedCodes(id) ON DELETE CASCADE NOT NULL,
    Code2Id INTEGER REFERENCES TokenizedCodes(id) ON DELETE CASCADE NOT NULL,
    User1   INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,--pierwszy wyslal kod
    User2   INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,--drugi wyslal kod
    SimilarityScore DOUBLE PRECISION NOT NULL -- Wynik podobieństwa (0-1)
 
);


-- =====================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create a new user
CREATE OR REPLACE FUNCTION create_new_user(
  p_email TEXT,
  p_password_hash TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_nick TEXT,
  p_bio TEXT DEFAULT NULL,
  p_age INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  new_user_id INTEGER;
BEGIN
  -- Validate inputs
  IF p_email IS NULL OR p_password_hash IS NULL OR p_first_name IS NULL OR 
     p_last_name IS NULL OR p_nick IS NULL THEN
    RAISE EXCEPTION 'Required fields cannot be null';
  END IF;
  
  IF p_age IS NOT NULL AND p_age < 8 THEN
    RAISE EXCEPTION 'User must be at least 8 years old';
  END IF;

  -- Insert new user
  INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    nick, 
    bio, 
    age, 
    is_active
  ) VALUES (
    p_email, 
    p_password_hash, 
    p_first_name, 
    p_last_name, 
    p_nick, 
    p_bio, 
    p_age, 
    TRUE
  ) RETURNING id INTO new_user_id;
  
  -- Initialize empty arrays for interests, friends, and blocked users
  INSERT INTO user_interests (user_id, category_ids) VALUES (new_user_id, '{}');
  INSERT INTO user_friends (user_id, friends) VALUES (new_user_id, '{}');
  INSERT INTO user_blocked (user_id, blocked_users) VALUES (new_user_id, '{}');
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  p_user_id INTEGER,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_nick TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_age INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
    RETURN FALSE;
  END IF;
  
  -- Validate age
  IF p_age IS NOT NULL AND p_age < 8 THEN
    RAISE EXCEPTION 'User must be at least 8 years old';
    RETURN FALSE;
  END IF;
  
  -- Update user profile with provided fields
  UPDATE users SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    nick = COALESCE(p_nick, nick),
    bio = COALESCE(p_bio, bio),
    age = COALESCE(p_age, age)
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to add or update user profile photo
CREATE OR REPLACE FUNCTION add_user_profile_photo(
  p_user_id INTEGER,
  p_file_name TEXT,
  p_file_data BYTEA,
  p_type TEXT
) RETURNS INTEGER AS $$
DECLARE
  user_exists BOOLEAN;
  photo_id INTEGER;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
    RETURN -1;
  END IF;
  
  -- Validate photo type
  IF p_type NOT IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp') THEN
    RAISE EXCEPTION 'Invalid image type. Must be one of: image/jpeg, image/jpg, image/png, image/webp';
    RETURN -1;
  END IF;
  
  -- Check if user already has a profile photo
  SELECT id INTO photo_id FROM user_profile_photo WHERE user_id = p_user_id;
  
  -- Update if exists, otherwise insert
  IF FOUND THEN
    UPDATE user_profile_photo SET
      file_name = p_file_name,
      file_data = p_file_data,
      type = p_type,
      uploaded_at = now()
    WHERE id = photo_id;
  ELSE
    INSERT INTO user_profile_photo (user_id, file_name, file_data, type)
    VALUES (p_user_id, p_file_name, p_file_data, p_type)
    RETURNING id INTO photo_id;
  END IF;
  
  RETURN photo_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INTEREST MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to add a new interest category
CREATE OR REPLACE FUNCTION add_interest_category(
  p_name TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  new_interest_id INTEGER;
BEGIN
  -- Validate input
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
    RAISE EXCEPTION 'Interest name cannot be null or empty';
  END IF;
  
  -- Insert new interest
  INSERT INTO intrests (name, description)
  VALUES (p_name, p_description)
  RETURNING id INTO new_interest_id;
  
  RETURN new_interest_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Interest with name "%" already exists', p_name;
    RETURN -1;
END;
$$ LANGUAGE plpgsql;

-- Function to add an interest to a user's profile
CREATE OR REPLACE FUNCTION add_user_interest(
  p_user_id INTEGER,
  p_interest_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
  interest_exists BOOLEAN;
  current_interests INTEGER[];
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id) INTO user_exists;
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
    RETURN FALSE;
  END IF;
  
  -- Check if interest exists
  SELECT EXISTS(SELECT 1 FROM intrests WHERE id = p_interest_id) INTO interest_exists;
  IF NOT interest_exists THEN
    RAISE EXCEPTION 'Interest with ID % does not exist', p_interest_id;
    RETURN FALSE;
  END IF;
  
  -- Get current interests
  SELECT category_ids INTO current_interests FROM user_interests WHERE user_id = p_user_id;
  
  -- Check if interest already added
  IF p_interest_id = ANY(current_interests) THEN
    RETURN TRUE; -- Already exists, no need to add
  END IF;
  
  -- Add interest to array
  UPDATE user_interests 
  SET category_ids = array_append(category_ids, p_interest_id)
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get all users with a specific interest
CREATE OR REPLACE FUNCTION get_users_by_interest(
  p_interest_id INTEGER
) RETURNS TABLE (user_id INTEGER, first_name TEXT, last_name TEXT, nick TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.first_name, u.last_name, u.nick
  FROM users u
  JOIN user_interests ui ON u.id = ui.user_id
  WHERE p_interest_id = ANY(ui.category_ids)
  AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FRIENDSHIP MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to send a friend request
CREATE OR REPLACE FUNCTION send_friend_request(
  p_sender_id INTEGER,
  p_receiver_id INTEGER,
  p_message TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  sender_exists BOOLEAN;
  receiver_exists BOOLEAN;
  already_friends BOOLEAN;
  is_blocked BOOLEAN;
  request_id INTEGER;
BEGIN
  -- Check if users exist
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_sender_id) INTO sender_exists;
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_receiver_id) INTO receiver_exists;
  
  IF NOT sender_exists OR NOT receiver_exists THEN
    RAISE EXCEPTION 'One or both users do not exist';
    RETURN -1;
  END IF;
  
  -- Prevent self-friend request
  IF p_sender_id = p_receiver_id THEN
    RAISE EXCEPTION 'Cannot send friend request to yourself';
    RETURN -1;
  END IF;
  
  -- Check if already friends
  SELECT p_receiver_id = ANY(friends) INTO already_friends 
  FROM user_friends 
  WHERE user_id = p_sender_id;
  
  IF already_friends THEN
    RAISE EXCEPTION 'Users are already friends';
    RETURN -1;
  END IF;
  
  -- Check if sender is blocked by receiver
  SELECT p_sender_id = ANY(blocked_users) INTO is_blocked 
  FROM user_blocked 
  WHERE user_id = p_receiver_id;
  
  IF is_blocked THEN
    RAISE EXCEPTION 'Cannot send friend request to a user who has blocked you';
    RETURN -1;
  END IF;
  
  -- Check if receiver is blocked by sender
  SELECT p_receiver_id = ANY(blocked_users) INTO is_blocked 
  FROM user_blocked 
  WHERE user_id = p_sender_id;
  
  IF is_blocked THEN
    RAISE EXCEPTION 'Cannot send friend request to a user you have blocked';
    RETURN -1;
  END IF;
  
  -- Insert friend request
  INSERT INTO friend_requests (sender_id, receiver_id, message, status)
  VALUES (p_sender_id, p_receiver_id, p_message, 'pending')
  RETURNING id INTO request_id;
  
  RETURN request_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'A friend request already exists between these users';
    RETURN -1;
END;
$$ LANGUAGE plpgsql;

-- Function to accept a friend request
CREATE OR REPLACE FUNCTION accept_friend_request(
  p_request_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_sender_id INTEGER;
  v_receiver_id INTEGER;
  request_exists BOOLEAN;
BEGIN
  -- Check if request exists and is pending
  SELECT 
    EXISTS(SELECT 1 FROM friend_requests WHERE id = p_request_id AND status = 'pending'),
    sender_id,
    receiver_id
  INTO 
    request_exists,
    v_sender_id,
    v_receiver_id
  FROM friend_requests 
  WHERE id = p_request_id;
  
  IF NOT request_exists THEN
    RAISE EXCEPTION 'Friend request with ID % does not exist or is not pending', p_request_id;
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE friend_requests 
  SET status = 'accepted' 
  WHERE id = p_request_id;
  
  -- Add each user to the other's friend list
  -- Add sender to receiver's friends
  UPDATE user_friends 
  SET friends = array_append(friends, v_sender_id)
  WHERE user_id = v_receiver_id;
  
  -- Add receiver to sender's friends
  UPDATE user_friends 
  SET friends = array_append(friends, v_receiver_id)
  WHERE user_id = v_sender_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to reject a friend request
CREATE OR REPLACE FUNCTION reject_friend_request(
  p_request_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  request_exists BOOLEAN;
BEGIN
  -- Check if request exists and is pending
  SELECT 
    EXISTS(SELECT 1 FROM friend_requests WHERE id = p_request_id AND status = 'pending')
  INTO 
    request_exists
  FROM friend_requests 
  WHERE id = p_request_id;
  
  IF NOT request_exists THEN
    RAISE EXCEPTION 'Friend request with ID % does not exist or is not pending', p_request_id;
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE friend_requests 
  SET status = 'rejected' 
  WHERE id = p_request_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a friend
CREATE OR REPLACE FUNCTION remove_friend(
  p_user_id INTEGER,
  p_friend_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
  friend_exists BOOLEAN;
  is_friend BOOLEAN;
BEGIN
  -- Check if users exist
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id) INTO user_exists;
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_friend_id) INTO friend_exists;
  
  IF NOT user_exists OR NOT friend_exists THEN
    RAISE EXCEPTION 'One or both users do not exist';
    RETURN FALSE;
  END IF;
  
  -- Check if they are friends
  SELECT p_friend_id = ANY(friends) INTO is_friend 
  FROM user_friends 
  WHERE user_id = p_user_id;
  
  IF NOT is_friend THEN
    RAISE EXCEPTION 'Users are not friends';
    RETURN FALSE;
  END IF;
  
  -- Remove each user from the other's friend list
  -- Remove friend from user's friends
  UPDATE user_friends 
  SET friends = array_remove(friends, p_friend_id)
  WHERE user_id = p_user_id;
  
  -- Remove user from friend's friends
  UPDATE user_friends 
  SET friends = array_remove(friends, p_user_id)
  WHERE user_id = p_friend_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to block a user
CREATE OR REPLACE FUNCTION block_user(
  p_user_id INTEGER,
  p_blocked_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
  blocked_exists BOOLEAN;
  already_blocked BOOLEAN;
  is_friend BOOLEAN;
BEGIN
  -- Check if users exist
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id) INTO user_exists;
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_blocked_id) INTO blocked_exists;
  
  IF NOT user_exists OR NOT blocked_exists THEN
    RAISE EXCEPTION 'One or both users do not exist';
    RETURN FALSE;
  END IF;
  
  -- Prevent self-blocking
  IF p_user_id = p_blocked_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
    RETURN FALSE;
  END IF;
  
  -- Check if already blocked
  SELECT p_blocked_id = ANY(blocked_users) INTO already_blocked 
  FROM user_blocked 
  WHERE user_id = p_user_id;
  
  IF already_blocked THEN
    RETURN TRUE; -- Already blocked, no need to block again
  END IF;
  
  -- Check if they are friends
  SELECT p_blocked_id = ANY(friends) INTO is_friend 
  FROM user_friends 
  WHERE user_id = p_user_id;
  
  -- If friends, remove from friend list first
  IF is_friend THEN
    PERFORM remove_friend(p_user_id, p_blocked_id);
  END IF;
  
  -- Add to blocked list
  UPDATE user_blocked 
  SET blocked_users = array_append(blocked_users, p_blocked_id)
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MESSAGING MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to check if a conversation exists between two users
CREATE OR REPLACE FUNCTION check_if_conversation_exists(
  p_user1_id INTEGER,
  p_user2_id INTEGER
) RETURNS BIGINT AS $$
DECLARE
  v_user1_id INTEGER;
  v_user2_id INTEGER;
  v_conversation_id BIGINT;
BEGIN
  -- Ensure user1_id < user2_id for conversation uniqueness
  IF p_user1_id < p_user2_id THEN
    v_user1_id := p_user1_id;
    v_user2_id := p_user2_id;
  ELSE
    v_user1_id := p_user2_id;
    v_user2_id := p_user1_id;
  END IF;
  
  -- Check if conversation exists
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE user1_id = v_user1_id AND user2_id = v_user2_id;
  
  IF NOT FOUND THEN
    RETURN -1; -- Conversation doesn't exist
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a conversation between two users
CREATE OR REPLACE FUNCTION create_conversation(
  p_user1_id INTEGER,
  p_user2_id INTEGER
) RETURNS BIGINT AS $$
DECLARE
  user1_exists BOOLEAN;
  user2_exists BOOLEAN;
  are_friends BOOLEAN;
  is_blocked BOOLEAN;
  v_user1_id INTEGER;
  v_user2_id INTEGER;
  v_conversation_id BIGINT;
BEGIN
  -- Check if users exist
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user1_id) INTO user1_exists;
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user2_id) INTO user2_exists;
  
  IF NOT user1_exists OR NOT user2_exists THEN
    RAISE EXCEPTION 'One or both users do not exist';
    RETURN -1;
  END IF;
  
  -- Prevent self-conversation
  IF p_user1_id = p_user2_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
    RETURN -1;
  END IF;
  
  -- Check if they are friends
  SELECT p_user2_id = ANY(friends) INTO are_friends 
  FROM user_friends 
  WHERE user_id = p_user1_id;
  
  IF NOT are_friends THEN
    RAISE EXCEPTION 'Users are not friends';
    RETURN -1;
  END IF;
  
  -- Check if either user has blocked the other
  SELECT p_user2_id = ANY(blocked_users) INTO is_blocked 
  FROM user_blocked 
  WHERE user_id = p_user1_id;
  
  IF is_blocked THEN
    RAISE EXCEPTION 'Cannot create conversation with a blocked user';
    RETURN -1;
  END IF;
  
  SELECT p_user1_id = ANY(blocked_users) INTO is_blocked 
  FROM user_blocked 
  WHERE user_id = p_user2_id;
  
  IF is_blocked THEN
    RAISE EXCEPTION 'Cannot create conversation with a user who has blocked you';
    RETURN -1;
  END IF;
  
  -- Ensure user1_id < user2_id for conversation uniqueness
  IF p_user1_id < p_user2_id THEN
    v_user1_id := p_user1_id;
    v_user2_id := p_user2_id;
  ELSE
    v_user1_id := p_user2_id;
    v_user2_id := p_user1_id;
  END IF;
  
  -- Check if conversation already exists
  v_conversation_id := check_if_conversation_exists(p_user1_id, p_user2_id);
  
  -- Create new conversation if it doesn't exist
  IF v_conversation_id = -1 THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (v_user1_id, v_user2_id)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send a message
CREATE OR REPLACE FUNCTION send_message(
  p_sender_id INTEGER,
  p_receiver_id INTEGER,
  p_message_type TEXT,
  p_content BYTEA
) RETURNS BIGINT AS $$
DECLARE
  user1_exists BOOLEAN;
  user2_exists BOOLEAN;
  are_friends BOOLEAN;
  is_blocked BOOLEAN;
  v_conversation_id BIGINT;
  v_message_id BIGINT;
BEGIN
  -- Check if users exist
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_sender_id) INTO user1_exists;
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_receiver_id) INTO user2_exists;
  
  IF NOT user1_exists OR NOT user2_exists THEN
    RAISE EXCEPTION 'One or both users do not exist';
    RETURN -1;
  END IF;
  
  -- Validate message type
  IF p_message_type NOT IN ('text', 'image/JPEG', 'image/JPG', 'image/PNG', 'image/WEBP', 'link', 'voice', 'file/TXT', 'folder', 'ZIP') THEN
    RAISE EXCEPTION 'Invalid message type';
    RETURN -1;
  END IF;
  
  -- Prevent self-messaging
  IF p_sender_id = p_receiver_id THEN
    RAISE EXCEPTION 'Cannot send message to yourself';
    RETURN -1;
  END IF;
  
  -- Check if they are friends
  SELECT p_receiver_id = ANY(friends) INTO are_friends 
  FROM user_friends 
  WHERE user_id = p_sender_id;
  
  IF NOT are_friends THEN
    RAISE EXCEPTION 'Users are not friends';
    RETURN -1;
  END IF;
  
  -- Check if either user has blocked the other
  SELECT p_receiver_id = ANY(blocked_users) INTO is_blocked 
  FROM user_blocked 
  WHERE user_id = p_sender_id;
  
  IF is_blocked THEN
    RAISE EXCEPTION 'Cannot send message to a blocked user';
    RETURN -1;
  END IF;
  
  SELECT p_sender_id = ANY(blocked_users) INTO is_blocked 
  FROM user_blocked 
  WHERE user_id = p_receiver_id;
  
  IF is_blocked THEN
    RAISE EXCEPTION 'Cannot send message to a user who has blocked you';
    RETURN -1;
  END IF;
  
  -- Get or create conversation
  v_conversation_id := create_conversation(p_sender_id, p_receiver_id);
  
  IF v_conversation_id = -1 THEN
    RAISE EXCEPTION 'Failed to create conversation';
    RETURN -1;
  END IF;
  
  -- Insert message
  INSERT INTO messages (conversation_id, sender_id, receiver_id, message_type, content)
  VALUES (v_conversation_id, p_sender_id, p_receiver_id, p_message_type, p_content)
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark a message as read
CREATE OR REPLACE FUNCTION mark_message_as_read(
  p_message_id BIGINT,
  p_user_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  message_exists BOOLEAN;
  is_receiver BOOLEAN;
BEGIN
  -- Check if message exists and user is receiver
  SELECT 
    EXISTS(SELECT 1 FROM messages WHERE id = p_message_id),
    (SELECT receiver_id = p_user_id FROM messages WHERE id = p_message_id)
  INTO 
    message_exists,
    is_receiver;
  
  IF NOT message_exists THEN
    RAISE EXCEPTION 'Message with ID % does not exist', p_message_id;
    RETURN FALSE;
  END IF;
  
  IF NOT is_receiver THEN
    RAISE EXCEPTION 'Only the receiver can mark a message as read';
    RETURN FALSE;
  END IF;
  
  -- Mark message as read
  UPDATE messages 
  SET is_read = TRUE 
  WHERE id = p_message_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CODE ANALYSIS FUNCTIONS
-- =====================================================

-- Function to add tokenized code
CREATE OR REPLACE FUNCTION add_tokenised_code(
  p_entry_id INTEGER,
  p_token_sequence TEXT,
  p_normalized_token_sequence TEXT,
  p_folder_path VARCHAR(512) DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  entry_exists BOOLEAN;
  code_id INTEGER;
BEGIN
  -- Check if entry exists
  SELECT EXISTS(SELECT 1 FROM repo_entries WHERE id = p_entry_id) INTO entry_exists;
  
  IF NOT entry_exists THEN
    RAISE EXCEPTION 'Repository entry with ID % does not exist', p_entry_id;
    RETURN -1;
  END IF;
  
  -- Insert tokenized code
  INSERT INTO TokenizedCodes (EntryID, TokenSequence, NormalizedTokenSequence, FolderPath)
  VALUES (p_entry_id, p_token_sequence, p_normalized_token_sequence, p_folder_path)
  RETURNING id INTO code_id;
  
  RETURN code_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add similarity score directly
CREATE OR REPLACE FUNCTION add_similarity_score(
  p_entry1_id INTEGER,
  p_entry2_id INTEGER,
  p_user1_id INTEGER,
  p_user2_id INTEGER,
  p_similarity_score DOUBLE PRECISION
) RETURNS INTEGER AS $$
DECLARE
  entry1_exists BOOLEAN;
  entry2_exists BOOLEAN;
  user1_exists BOOLEAN;
  user2_exists BOOLEAN;
  code1_id INTEGER;
  code2_id INTEGER;
  comparison_id INTEGER;
BEGIN
  -- Check if entries exist
  SELECT EXISTS(SELECT 1 FROM repo_entries WHERE id = p_entry1_id) INTO entry1_exists;
  SELECT EXISTS(SELECT 1 FROM repo_entries WHERE id = p_entry2_id) INTO entry2_exists;
  
  IF NOT entry1_exists OR NOT entry2_exists THEN
    RAISE EXCEPTION 'One or both repository entries do not exist';
    RETURN -1;
  END IF;
  
  -- Check if users exist
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user1_id) INTO user1_exists;
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user2_id) INTO user2_exists;
  
  IF NOT user1_exists OR NOT user2_exists THEN
    RAISE EXCEPTION 'One or both users do not exist';
    RETURN -1;
  END IF;
  
  -- Validate similarity score
  IF p_similarity_score < 0 OR p_similarity_score > 1 THEN
    RAISE EXCEPTION 'Similarity score must be between 0 and 1';
    RETURN -1;
  END IF;
  
  -- Get or create tokenized code entries
  SELECT id INTO code1_id FROM TokenizedCodes WHERE EntryID = p_entry1_id;
  IF NOT FOUND THEN
    -- For simplicity, we'll create a basic token entry if none exists
    INSERT INTO TokenizedCodes (EntryID, TokenSequence, NormalizedTokenSequence)
    VALUES (p_entry1_id, 'AUTO_GENERATED', 'AUTO_GENERATED')
    RETURNING id INTO code1_id;
  END IF;
  
  SELECT id INTO code2_id FROM TokenizedCodes WHERE EntryID = p_entry2_id;
  IF NOT FOUND THEN
    -- For simplicity, we'll create a basic token entry if none exists
    INSERT INTO TokenizedCodes (EntryID, TokenSequence, NormalizedTokenSequence)
    VALUES (p_entry2_id, 'AUTO_GENERATED', 'AUTO_GENERATED')
    RETURNING id INTO code2_id;
  END IF;
  
  -- Insert comparison result
  INSERT INTO ComparisonResults (Code1Id, Code2Id, User1, User2, SimilarityScore)
  VALUES (code1_id, code2_id, p_user1_id, p_user2_id, p_similarity_score)
  RETURNING Id INTO comparison_id;
  
  RETURN comparison_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- Interest categories view
CREATE OR REPLACE VIEW interest_categories AS
SELECT id, name, description
FROM intrests
ORDER BY name;

-- User with interests view
CREATE OR REPLACE VIEW user_with_interests AS
SELECT 
  u.id AS user_id,
  u.nick,
  u.first_name,
  u.last_name,
  ui.category_ids AS interest_ids,
  array_agg(i.name) FILTER (WHERE i.id IS NOT NULL) AS interest_names
FROM 
  users u
LEFT JOIN 
  user_interests ui ON u.id = ui.user_id
LEFT JOIN 
  LATERAL unnest(ui.category_ids) AS interest_id ON true
LEFT JOIN 
  intrests i ON interest_id = i.id
WHERE 
  u.is_active = TRUE
GROUP BY 
  u.id, u.nick, u.first_name, u.last_name, ui.category_ids;

-- Pending friend requests view
CREATE OR REPLACE VIEW pending_friend_requests AS
SELECT 
  fr.id AS request_id,
  fr.sender_id,
  s.nick AS sender_nick,
  s.first_name AS sender_first_name,
  s.last_name AS sender_last_name,
  fr.receiver_id,
  r.nick AS receiver_nick,
  r.first_name AS receiver_first_name,
  r.last_name AS receiver_last_name,
  fr.message,
  fr.status,
  fr.sent_at
FROM 
  friend_requests fr
JOIN 
  users s ON fr.sender_id = s.id
JOIN 
  users r ON fr.receiver_id = r.id
WHERE 
  fr.status = 'pending';

-- User friends view
CREATE OR REPLACE VIEW user_friends_view AS
SELECT 
  uf.user_id,
  u.nick AS user_nick,
  unnest(uf.friends) AS friend_id,
  f.nick AS friend_nick,
  f.first_name AS friend_first_name,
  f.last_name AS friend_last_name
FROM 
  user_friends uf
JOIN 
  users u ON uf.user_id = u.id
JOIN 
  users f ON f.id = ANY(uf.friends)
WHERE 
  u.is_active = TRUE AND f.is_active = TRUE;

-- User blocked view
CREATE OR REPLACE VIEW user_blocked_view AS
SELECT 
  ub.user_id,
  u.nick AS user_nick,
  unnest(ub.blocked_users) AS blocked_id,
  b.nick AS blocked_nick,
  b.first_name AS blocked_first_name,
  b.last_name AS blocked_last_name
FROM 
  user_blocked ub
JOIN 
  users u ON ub.user_id = u.id
JOIN 
  users b ON b.id = ANY(ub.blocked_users);

-- User conversations view
CREATE OR REPLACE VIEW user_conversations AS
SELECT 
  c.id AS conversation_id,
  CASE 
    WHEN c.user1_id = u.id THEN c.user2_id
    ELSE c.user1_id
  END AS other_user_id,
  (SELECT nick FROM users WHERE id = 
    CASE 
      WHEN c.user1_id = u.id THEN c.user2_id
      ELSE c.user1_id
    END
  ) AS other_user_nick,
  c.created_at,
  (SELECT MAX(sent_at) FROM messages WHERE conversation_id = c.id) AS last_message_at,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_read = FALSE AND receiver_id = u.id) AS unread_count
FROM 
  conversations c
CROSS JOIN 
  users u
WHERE 
  u.id = c.user1_id OR u.id = c.user2_id;

-- Conversation messages view
CREATE OR REPLACE VIEW conversation_messages AS
SELECT 
  m.id AS message_id,
  m.conversation_id,
  m.sender_id,
  s.nick AS sender_nick,
  m.receiver_id,
  r.nick AS receiver_nick,
  m.message_type,
  CASE 
    WHEN m.message_type = 'text' THEN convert_from(m.content, 'UTF-8')
    ELSE NULL
  END AS text_content,
  m.content AS binary_content,
  m.sent_at,
  m.is_read
FROM 
  messages m
JOIN 
  users s ON m.sender_id = s.id
JOIN 
  users r ON m.receiver_id = r.id
ORDER BY 
  m.sent_at ASC;

-- High similarity code view
CREATE OR REPLACE VIEW high_similarity_codes AS
SELECT 
  cr.Id AS comparison_id,
  cr.SimilarityScore,
  tc1.EntryID AS entry1_id,
  re1.name AS file1_name,
  tc2.EntryID AS entry2_id,
  re2.name AS file2_name,
  u1.id AS user1_id,
  u1.nick AS user1_nick,
  u2.id AS user2_id,
  u2.nick AS user2_nick
FROM 
  ComparisonResults cr
JOIN 
  TokenizedCodes tc1 ON cr.Code1Id = tc1.id
JOIN 
  TokenizedCodes tc2 ON cr.Code2Id = tc2.id
JOIN 
  repo_entries re1 ON tc1.EntryID = re1.id
JOIN 
  repo_entries re2 ON tc2.EntryID = re2.id
JOIN 
  users u1 ON cr.User1 = u1.id
JOIN 
  users u2 ON cr.User2 = u2.id
WHERE 
  cr.SimilarityScore > 0.7 -- High similarity threshold
ORDER BY 
  cr.SimilarityScore DESC;