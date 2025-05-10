-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"nick" text NOT NULL,
	"bio" text,
	"age" integer,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_key" UNIQUE("email"),
	CONSTRAINT "users_nick_key" UNIQUE("nick"),
	CONSTRAINT "users_age_check" CHECK (age >= 8)
);
--> statement-breakpoint
CREATE TABLE "user_profile_photo" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"file_name" text NOT NULL,
	"file_data" "bytea" NOT NULL,
	"type" text,
	"uploaded_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_profile_photo_type_check" CHECK (type = ANY (ARRAY['image/jpeg'::text, 'image/jpg'::text, 'image/png'::text, 'image/webp'::text]))
);
--> statement-breakpoint
CREATE TABLE "intrests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "intrests_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "friend_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" serial NOT NULL,
	"receiver_id" serial NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "friend_requests_sender_id_receiver_id_key" UNIQUE("sender_id","receiver_id"),
	CONSTRAINT "friend_requests_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
	CONSTRAINT "friend_requests_check" CHECK (sender_id <> receiver_id)
);
--> statement-breakpoint
CREATE TABLE "user_interests" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"category_ids" integer[]
);
--> statement-breakpoint
CREATE TABLE "user_friends" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"friends" integer[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_blocked" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"blocked_users" integer[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user1_id" serial NOT NULL,
	"user2_id" serial NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_user1_id_user2_id_key" UNIQUE("user1_id","user2_id"),
	CONSTRAINT "conversations_check" CHECK (user1_id < user2_id)
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"conversation_id" bigserial NOT NULL,
	"sender_id" serial NOT NULL,
	"receiver_id" serial NOT NULL,
	"message_type" text NOT NULL,
	"content" "bytea" NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now(),
	"is_read" boolean DEFAULT false,
	CONSTRAINT "messages_message_type_check" CHECK (message_type = ANY (ARRAY['text'::text, 'image/JPEG'::text, 'image/JPG'::text, 'image/PNG'::text, 'image/WEBP'::text, 'link'::text, 'voice'::text, 'file/TXT'::text, 'folder'::text, 'ZIP'::text]))
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "repositories_user_id_name_key" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "repository_metadata" (
	"repository_id" serial PRIMARY KEY NOT NULL,
	"total_files" integer DEFAULT 0,
	"total_folders" integer DEFAULT 0,
	"total_size" bigint DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified" timestamp with time zone,
	"license" text,
	"visibility" text DEFAULT 'private',
	CONSTRAINT "repository_metadata_visibility_check" CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text]))
);
--> statement-breakpoint
CREATE TABLE "repo_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"repository_id" serial NOT NULL,
	"parent_id" integer
);
--> statement-breakpoint
CREATE TABLE "comparisonresults" (
	"id" serial PRIMARY KEY NOT NULL,
	"code1id" integer NOT NULL,
	"code2id" integer NOT NULL,
	"user1" integer NOT NULL,
	"user2" integer NOT NULL,
	"similarityscore" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repo_entries_data" (
	"entry_id" serial PRIMARY KEY NOT NULL,
	"is_directory" boolean DEFAULT false NOT NULL,
	"extension" text,
	"content" text,
	"number_of_lines" integer,
	"size" integer,
	"last_modified" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "repo_entries_data_extension_check" CHECK (extension = ANY (ARRAY['txt'::text, 'py'::text, 'java'::text, 'cpp'::text, 'js'::text, 'html'::text, 'css'::text, 'json'::text, 'xml'::text, 'md'::text, 'kt'::text])),
	CONSTRAINT "repo_entries_data_check" CHECK (((is_directory = true) AND (extension IS NULL) AND (content IS NULL) AND (number_of_lines IS NULL)) OR (is_directory = false)),
	CONSTRAINT "repo_entries_data_size_check" CHECK (size >= 0)
);
--> statement-breakpoint
CREATE TABLE "tokenizedcodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"entryid" integer NOT NULL,
	"tokensequence" text NOT NULL,
	"normalizedtokensequence" text NOT NULL,
	"folderpath" varchar(512)
);
--> statement-breakpoint
ALTER TABLE "user_profile_photo" ADD CONSTRAINT "user_profile_photo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_friends" ADD CONSTRAINT "user_friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocked" ADD CONSTRAINT "user_blocked_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_metadata" ADD CONSTRAINT "repository_metadata_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo_entries" ADD CONSTRAINT "repo_entries_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo_entries" ADD CONSTRAINT "repo_entries_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."repo_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisonresults" ADD CONSTRAINT "comparisonresults_code1id_fkey" FOREIGN KEY ("code1id") REFERENCES "public"."tokenizedcodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisonresults" ADD CONSTRAINT "comparisonresults_code2id_fkey" FOREIGN KEY ("code2id") REFERENCES "public"."tokenizedcodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisonresults" ADD CONSTRAINT "comparisonresults_user1_fkey" FOREIGN KEY ("user1") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisonresults" ADD CONSTRAINT "comparisonresults_user2_fkey" FOREIGN KEY ("user2") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo_entries_data" ADD CONSTRAINT "repo_entries_data_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."repo_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokenizedcodes" ADD CONSTRAINT "tokenizedcodes_entryid_fkey" FOREIGN KEY ("entryid") REFERENCES "public"."repo_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "public"."interest_categories" AS (SELECT id, name, description FROM intrests ORDER BY name);--> statement-breakpoint
CREATE VIEW "public"."user_with_interests" AS (SELECT u.id AS user_id, u.nick, u.first_name, u.last_name, ui.category_ids AS interest_ids, array_agg(i.name) FILTER (WHERE i.id IS NOT NULL) AS interest_names FROM users u LEFT JOIN user_interests ui ON u.id = ui.user_id LEFT JOIN LATERAL unnest(ui.category_ids) interest_id(interest_id) ON true LEFT JOIN intrests i ON interest_id.interest_id = i.id WHERE u.is_active = true GROUP BY u.id, u.nick, u.first_name, u.last_name, ui.category_ids);--> statement-breakpoint
CREATE VIEW "public"."pending_friend_requests" AS (SELECT fr.id AS request_id, fr.sender_id, s.nick AS sender_nick, s.first_name AS sender_first_name, s.last_name AS sender_last_name, fr.receiver_id, r.nick AS receiver_nick, r.first_name AS receiver_first_name, r.last_name AS receiver_last_name, fr.message, fr.status, fr.sent_at FROM friend_requests fr JOIN users s ON fr.sender_id = s.id JOIN users r ON fr.receiver_id = r.id WHERE fr.status = 'pending'::text);--> statement-breakpoint
CREATE VIEW "public"."user_friends_view" AS (SELECT uf.user_id, u.nick AS user_nick, unnest(uf.friends) AS friend_id, f.nick AS friend_nick, f.first_name AS friend_first_name, f.last_name AS friend_last_name FROM user_friends uf JOIN users u ON uf.user_id = u.id JOIN users f ON f.id = ANY (uf.friends) WHERE u.is_active = true AND f.is_active = true);--> statement-breakpoint
CREATE VIEW "public"."user_blocked_view" AS (SELECT ub.user_id, u.nick AS user_nick, unnest(ub.blocked_users) AS blocked_id, b.nick AS blocked_nick, b.first_name AS blocked_first_name, b.last_name AS blocked_last_name FROM user_blocked ub JOIN users u ON ub.user_id = u.id JOIN users b ON b.id = ANY (ub.blocked_users));--> statement-breakpoint
CREATE VIEW "public"."user_conversations" AS (SELECT c.id AS conversation_id, CASE WHEN c.user1_id = u.id THEN c.user2_id ELSE c.user1_id END AS other_user_id, ( SELECT users.nick FROM users WHERE users.id = CASE WHEN c.user1_id = u.id THEN c.user2_id ELSE c.user1_id END) AS other_user_nick, c.created_at, ( SELECT max(messages.sent_at) AS max FROM messages WHERE messages.conversation_id = c.id) AS last_message_at, ( SELECT count(*) AS count FROM messages WHERE messages.conversation_id = c.id AND messages.is_read = false AND messages.receiver_id = u.id) AS unread_count FROM conversations c CROSS JOIN users u WHERE u.id = c.user1_id OR u.id = c.user2_id);--> statement-breakpoint
CREATE VIEW "public"."conversation_messages" AS (SELECT m.id AS message_id, m.conversation_id, m.sender_id, s.nick AS sender_nick, m.receiver_id, r.nick AS receiver_nick, m.message_type, CASE WHEN m.message_type = 'text'::text THEN convert_from(m.content, 'UTF-8'::name) ELSE NULL::text END AS text_content, m.content AS binary_content, m.sent_at, m.is_read FROM messages m JOIN users s ON m.sender_id = s.id JOIN users r ON m.receiver_id = r.id ORDER BY m.sent_at);--> statement-breakpoint
CREATE VIEW "public"."high_similarity_codes" AS (SELECT cr.id AS comparison_id, cr.similarityscore, tc1.entryid AS entry1_id, re1.name AS file1_name, tc2.entryid AS entry2_id, re2.name AS file2_name, u1.id AS user1_id, u1.nick AS user1_nick, u2.id AS user2_id, u2.nick AS user2_nick FROM comparisonresults cr JOIN tokenizedcodes tc1 ON cr.code1id = tc1.id JOIN tokenizedcodes tc2 ON cr.code2id = tc2.id JOIN repo_entries re1 ON tc1.entryid = re1.id JOIN repo_entries re2 ON tc2.entryid = re2.id JOIN users u1 ON cr.user1 = u1.id JOIN users u2 ON cr.user2 = u2.id WHERE cr.similarityscore > 0.7::double precision ORDER BY cr.similarityscore DESC);
*/