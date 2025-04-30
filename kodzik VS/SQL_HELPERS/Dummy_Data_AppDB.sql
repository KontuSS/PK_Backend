

BEGIN;

INSERT INTO intrests (id, name, description) VALUES
  (1, 'Python', 'General‑purpose programming language'),
  (2, 'Machine Learning', 'Supervised & unsupervised ML methods'),
  (3, 'Open‑Source Hardware', 'Arduino / Raspberry‑Pi projects'),
  (4, 'Web Development', 'Front‑end & back‑end technologies'),
  (5, 'Cyber‑security', 'Offensive & defensive security');

INSERT INTO users (id, email, password_hash, first_name, last_name, nick, bio, age, is_active)
VALUES
  (1, 'alice@example.com',  'hash$alice', 'Alice', 'Johnson',  'alicej',  'ML engineer & coffee addict', 25, TRUE),
  (2, 'bob@example.com',    'hash$bob',   'Bob',   'Kowalski', 'bobk',    'Full‑stack dev, climber',   28, TRUE),
  (3, 'carol@example.com',  'hash$carol', 'Carol', 'Nowak',     'caroln',  'IoT tinkerer',             30, TRUE),
  (4, 'dave@example.com',   'hash$dave',  'Dave',  'Smith',     'daves',   'CS undergrad / gamer',     22, TRUE),
  (5, 'eve@example.com',    'hash$eve',   'Eve',   'Wójcik',    'evew',    'Security researcher',      27, TRUE);

------------------------------------------------------------
-- 2.1 Profile photos (users 1 & 3)
------------------------------------------------------------
INSERT INTO user_profile_photo (id, user_id, file_name, file_data, type)
VALUES
  (1, 1, 'alice_profile.jpg', '\xFFD8FFE000', 'image/jpeg'),
  (2, 3, 'carol_profile.png', '\x89504E470D0A', 'image/png');

------------------------------------------------------------
-- 2.2 User interests (array style on intrest_id column)
------------------------------------------------------------
INSERT INTO user_interests (user_id, category_ids) VALUES
  (1, '{1,2,4}'),   -- Alice: Python, ML, Web Dev
  (2, '{1,4}'),     -- Bob: Python, Web Dev
  (3, '{1,3}'),     -- Carol: Python, Open‑Source HW
  (4, '{1,5}'),     -- Dave: Python, Cyber‑security
  (5, '{1,2,5}');   -- Eve: Python, ML, Cyber‑security

------------------------------------------------------------
-- 3. Friend relations
------------------------------------------------------------
-- 3.1 Friend requests (accepted)
INSERT INTO friend_requests (id, sender_id, receiver_id, status)
VALUES
  (1, 1, 2, 'accepted'),
  (2, 4, 5, 'accepted');

-- 3.2 Final friendship vectors
INSERT INTO user_friends (user_id, friends) VALUES
  (1, '{2,3}'),
  (2, '{1}'),
  (3, '{1}'),
  (4, '{5}'),
  (5, '{4}');

-- 3.3 Blocked users (1‑2 each)
INSERT INTO user_blocked (user_id, blocked_users) VALUES
  (1, '{5}'),
  (2, '{4}'),
  (3, '{2,5}'),
  (4, '{2}'),
  (5, '{1}');

------------------------------------------------------------
-- 4. Conversations & messages (real‑time chat)
------------------------------------------------------------
-- Conversation between Alice (1) & Bob (2)
INSERT INTO conversations (id, user1_id, user2_id) VALUES (1, 1, 2);

-- Conversation between Dave (4) & Eve (5)
INSERT INTO conversations (id, user1_id, user2_id) VALUES (2, 4, 5);

-- 3 messages each conversation (alternating senders)
INSERT INTO messages (id, conversation_id, sender_id, receiver_id, message_type, content)
VALUES
  -- conv 1
  (1, 1, 1, 2, 'text',  '\x48657920426f6221'), -- "Hey Bob!"
  (2, 1, 2, 1, 'text',  '\x48692c20416c69636521'), -- "Hi, Alice!"
  (3, 1, 1, 2, 'text',  '\x57616e61207374617274206d6c2070726f6a6563743f'), -- "Wanna start ML project?"
  -- conv 2
  (4, 2, 4, 5, 'text',  '\x5768617427732075703f'), -- "What's up?"
  (5, 2, 5, 4, 'text',  '\x4a757374206861636b696e672074685f636f64652e2e2e'), -- "Just hacking the code..."
  (6, 2, 4, 5, 'text',  '\x4e696365212049277620666f756e642061206275672e'); -- "Nice! I've found a bug."

------------------------------------------------------------
-- 5. Repositories, metadata and entries
------------------------------------------------------------
-- Helper: macro‑style comment per user --------------------------------------

-- ------------------------- User 1: Alice ----------------------------------
INSERT INTO repositories (id, user_id, name, description) VALUES
  (1, 1, 'ml-utils',      'Small ML helper functions'),
  (2, 1, 'web-scraper',   'Async Python scraper'),
  (3, 1, 'algo-cpp',      'Classic algorithms in C++');

-- INSERT INTO repository_metadata (repository_id, total_files, total_folders, total_size, visibility) VALUES
--   (1, 4, 1,  8192, 'public'),
--   (2, 3, 1,  4096, 'private'),
--   (3, 5, 2, 12288, 'public');

-- Root dirs & files
-- repo 1 (ml-utils)
INSERT INTO repo_entries (id, name, repository_id, parent_id) VALUES
  (1, 'src', 1, NULL),
  (2, 'README.md', 1, NULL);
INSERT INTO repo_entries_data (entry_id, is_directory, extension, content, number_of_lines, size) VALUES
  -- directory
  (1, TRUE,  NULL, NULL, NULL, 0),
  -- file
  (2, FALSE, 'py', '# ML‑Utils\nSample', 4, 128);

-- repo 2 (web-scraper)
INSERT INTO repo_entries (id, name, repository_id, parent_id) VALUES
  (3, 'src', 2, NULL),
  (4, 'scraper.py', 2, 3);
INSERT INTO repo_entries_data VALUES
  (3, TRUE,  NULL, NULL, NULL, 0),
  (4, FALSE, 'py', 'print("Hello")', 1, 64);

-- repo 3 (algo-cpp)
INSERT INTO repo_entries (id, name, repository_id, parent_id) VALUES
  (5, 'include', 3, NULL),
  (6, 'main.cpp', 3, NULL);
INSERT INTO repo_entries_data VALUES
  (5, TRUE,  NULL, NULL, NULL, 0),
  (6, FALSE, 'cpp', '// TODO', 10, 256);

-- ------------------------- User 2: Bob ------------------------------------
INSERT INTO repositories (id, user_id, name, description) VALUES
  (4, 2, 'portfolio', 'Personal projects showcase'),
  (5, 2, 'chat-app',  'Realtime chat with websockets');



INSERT INTO repo_entries VALUES
  (7, 'README.md', 4, NULL),
  (8, 'server',     5, NULL),
  (9, 'app.js',     5, 8);
INSERT INTO repo_entries_data VALUES
  (7, FALSE, 'md', '## Portfolio', 3, 96),
  (8, TRUE,  NULL, NULL, NULL, 0),
  (9, FALSE, 'js', '// Node server', 20, 512);

-- ------------------------- User 3: Carol ----------------------------------
INSERT INTO repositories (id, user_id, name, description) VALUES
  (6, 3, 'data-visualization', 'Charts & plots'),
  (7, 3, 'rest-api',          'FastAPI backend'),
  (8, 3, 'arduino-project',   'Sensor readings'),
  (9, 3, 'image-processing',  'OpenCV examples');

-- INSERT INTO repository_metadata VALUES
--   (6, 2, 1, 4096, 'public'),
--   (7, 3, 1, 6144, 'private'),
--   (8, 1, 0, 1024, 'public'),
--   (9, 2, 1, 8192, 'public');

INSERT INTO repo_entries VALUES
  (10, 'README.md', 6, NULL),
  (11, 'api', 7, NULL),
  (12, 'main.py', 7, 11);
INSERT INTO repo_entries_data VALUES
  (10, FALSE, 'md', '# DataViz', 2, 64),
  (11, TRUE,  NULL, NULL, NULL, 0),
  (12, FALSE, 'py', 'from fastapi import FastAPI', 50, 2048);

-- ------------------------- User 4: Dave -----------------------------------
INSERT INTO repositories (id, user_id, name, description) VALUES
  (10, 4, 'game-engine', '2D engine in C++');

-- INSERT INTO repository_metadata VALUES
--   (10, 3, 1, 14336, 'public');

INSERT INTO repo_entries VALUES
  (13, 'src', 10, NULL),
  (14, 'engine.cpp', 10, 13),
  (15, 'README.md', 10, NULL);
INSERT INTO repo_entries_data VALUES
  (13, TRUE,  NULL, NULL, NULL, 0),
  (14, FALSE, 'cpp', '// engine', 200, 8192),
  (15, FALSE, 'md', '# Engine', 4, 128);

-- ------------------------- User 5: Eve ------------------------------------
INSERT INTO repositories (id, user_id, name, description) VALUES
  (11, 5, 'blockchain-demo', 'Toy blockchain'),
  (12, 5, 'android-app',     'Kotlin sample');

-- INSERT INTO repository_metadata VALUES
--   (11, 3, 1, 12288, 'public'),
--   (12, 2, 1, 5120,  'private');

INSERT INTO repo_entries VALUES
  (16, 'src', 11, NULL),
  (17, 'chain.py', 11, 16),
  (18, 'app', 12, NULL),
  (19, 'MainActivity.kt', 12, 18);
INSERT INTO repo_entries_data VALUES
  (16, TRUE,  NULL, NULL, NULL, 0),
  (17, FALSE, 'py', 'class Block:', 120, 4096),
  (18, TRUE,  NULL, NULL, NULL, 0),
  (19, FALSE, 'kt', 'class MainActivity', 80, 2048);

COMMIT;

