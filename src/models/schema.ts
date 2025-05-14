import { pgTable, unique, check, serial, text, integer, boolean, timestamp, foreignKey, bigserial, bigint, doublePrecision, varchar, pgView, customType  } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

const bytea = customType<{ data: Buffer; notNull: false }>({
  dataType() {
    return 'bytea';
  },
  toDriver(value: Buffer): Buffer {
    return value;
  }
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	nick: text().notNull(),
	bio: text(),
	age: integer(),
	fcmToken: text("fcm_token"),
	isActive: boolean("is_active").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_key").on(table.email),
	unique("users_nick_key").on(table.nick),
	check("users_age_check", sql`age >= 8`),
]);

export const userProfilePhoto = pgTable("user_profile_photo", {
	id: serial().primaryKey().notNull(),
	userId: serial("user_id").notNull(),
	fileName: text("file_name").notNull(),
	// TODO: failed to parse database type 'bytea'
	fileData: bytea("file_data").notNull(),
	type: text(),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_profile_photo_user_id_fkey"
		}).onDelete("cascade"),
	check("user_profile_photo_type_check", sql`type = ANY (ARRAY['image/jpeg'::text, 'image/jpg'::text, 'image/png'::text, 'image/webp'::text])`),
]);

export const intrests = pgTable("intrests", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
}, (table) => [
	unique("intrests_name_key").on(table.name),
]);

export const friendRequests = pgTable("friend_requests", {
	id: serial().primaryKey().notNull(),
	senderId: serial("sender_id").notNull(),
	receiverId: serial("receiver_id").notNull(),
	message: text(),
	status: text().default('pending').notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "friend_requests_sender_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "friend_requests_receiver_id_fkey"
		}).onDelete("cascade"),
	unique("friend_requests_sender_id_receiver_id_key").on(table.senderId, table.receiverId),
	check("friend_requests_status_check", sql`status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])`),
	check("friend_requests_check", sql`sender_id <> receiver_id`),
]);

export const userInterests = pgTable("user_interests", {
	userId: serial("user_id").primaryKey().notNull(),
	categoryIds: integer("category_ids").array(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_interests_user_id_fkey"
		}).onDelete("cascade"),
]);

export const userFriends = pgTable("user_friends", {
	userId: serial("user_id").primaryKey().notNull(),
	friends: integer().array().default([]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_friends_user_id_fkey"
		}).onDelete("cascade"),
]);

export const userBlocked = pgTable("user_blocked", {
	userId: serial("user_id").primaryKey().notNull(),
	blockedUsers: integer("blocked_users").array().default([]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_blocked_user_id_fkey"
		}).onDelete("cascade"),
]);

export const conversations = pgTable("conversations", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	user1Id: serial("user1_id").notNull(),
	user2Id: serial("user2_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.user1Id],
			foreignColumns: [users.id],
			name: "conversations_user1_id_fkey"
		}),
	foreignKey({
			columns: [table.user2Id],
			foreignColumns: [users.id],
			name: "conversations_user2_id_fkey"
		}),
	unique("conversations_user1_id_user2_id_key").on(table.user1Id, table.user2Id),
	check("conversations_check", sql`user1_id < user2_id`),
]);

export const messages = pgTable("messages", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	conversationId: bigserial("conversation_id", { mode: "bigint" }).notNull(),
	senderId: serial("sender_id").notNull(),
	receiverId: serial("receiver_id").notNull(),
	messageType: text("message_type").notNull(),
	// TODO: failed to parse database type 'bytea'
	content: bytea("content").notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isRead: boolean("is_read").default(false),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_fkey"
		}),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "messages_receiver_id_fkey"
		}),
	check("messages_message_type_check", sql`message_type = ANY (ARRAY['text'::text, 'image/JPEG'::text, 'image/JPG'::text, 'image/PNG'::text, 'image/WEBP'::text, 'link'::text, 'voice'::text, 'file/TXT'::text, 'folder'::text, 'ZIP'::text])`),
]);

export const repositories = pgTable("repositories", {
	id: serial().primaryKey().notNull(),
	userId: serial("user_id").notNull(),
	name: text().notNull(),
	description: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "repositories_user_id_fkey"
		}).onDelete("cascade"),
	unique("repositories_user_id_name_key").on(table.userId, table.name),
]);

export const repositoryMetadata = pgTable("repository_metadata", {
	repositoryId: serial("repository_id").primaryKey().notNull(),
	totalFiles: integer("total_files").default(0),
	totalFolders: integer("total_folders").default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalSize: bigint("total_size", { mode: "number" }).default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastModified: timestamp("last_modified", { withTimezone: true, mode: 'string' }),
	license: text(),
	visibility: text().default('private'),
}, (table) => [
	foreignKey({
			columns: [table.repositoryId],
			foreignColumns: [repositories.id],
			name: "repository_metadata_repository_id_fkey"
		}).onDelete("cascade"),
	check("repository_metadata_visibility_check", sql`visibility = ANY (ARRAY['public'::text, 'private'::text])`),
]);

export const repoEntries = pgTable("repo_entries", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	repositoryId: serial("repository_id").notNull(),
	parentId: integer("parent_id"),
}, (table) => [
	foreignKey({
			columns: [table.repositoryId],
			foreignColumns: [repositories.id],
			name: "repo_entries_repository_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "repo_entries_parent_id_fkey"
		}).onDelete("cascade"),
]);

export const comparisonresults = pgTable("comparisonresults", {
	id: serial().primaryKey().notNull(),
	code1Id: integer().notNull(),
	code2Id: integer().notNull(),
	user1: integer().notNull(),
	user2: integer().notNull(),
	similarityscore: doublePrecision().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.code1Id],
			foreignColumns: [tokenizedcodes.id],
			name: "comparisonresults_code1id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.code2Id],
			foreignColumns: [tokenizedcodes.id],
			name: "comparisonresults_code2id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user1],
			foreignColumns: [users.id],
			name: "comparisonresults_user1_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.user2],
			foreignColumns: [users.id],
			name: "comparisonresults_user2_fkey"
		}).onDelete("cascade"),
]);

export const repoEntriesData = pgTable("repo_entries_data", {
	entryId: serial("entry_id").primaryKey().notNull(),
	isDirectory: boolean("is_directory").default(false).notNull(),
	extension: text(),
	content: text(),
	numberOfLines: integer("number_of_lines"),
	size: integer(),
	lastModified: timestamp("last_modified", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.entryId],
			foreignColumns: [repoEntries.id],
			name: "repo_entries_data_entry_id_fkey"
		}).onDelete("cascade"),
	check("repo_entries_data_extension_check", sql`extension = ANY (ARRAY['txt'::text, 'py'::text, 'java'::text, 'cpp'::text, 'js'::text, 'html'::text, 'css'::text, 'json'::text, 'xml'::text, 'md'::text, 'kt'::text])`),
	check("repo_entries_data_check", sql`((is_directory = true) AND (extension IS NULL) AND (content IS NULL) AND (number_of_lines IS NULL)) OR (is_directory = false)`),
	check("repo_entries_data_size_check", sql`size >= 0`),
]);

export const tokenizedcodes = pgTable("tokenizedcodes", {
	id: serial().primaryKey().notNull(),
	entryid: integer().notNull(),
	tokensequence: text().notNull(),
	normalizedtokensequence: text().notNull(),
	folderpath: varchar({ length: 512 }),
}, (table) => [
	foreignKey({
			columns: [table.entryid],
			foreignColumns: [repoEntries.id],
			name: "tokenizedcodes_entryid_fkey"
		}).onDelete("cascade"),
]);
export const interestCategories = pgView("interest_categories", {	id: integer(),
	name: text(),
	description: text(),
}).as(sql`SELECT id, name, description FROM intrests ORDER BY name`);

export const userWithInterests = pgView("user_with_interests", {	userId: integer("user_id"),
	nick: text(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	interestIds: integer("interest_ids"),
	interestNames: text("interest_names"),
}).as(sql`SELECT u.id AS user_id, u.nick, u.first_name, u.last_name, ui.category_ids AS interest_ids, array_agg(i.name) FILTER (WHERE i.id IS NOT NULL) AS interest_names FROM users u LEFT JOIN user_interests ui ON u.id = ui.user_id LEFT JOIN LATERAL unnest(ui.category_ids) interest_id(interest_id) ON true LEFT JOIN intrests i ON interest_id.interest_id = i.id WHERE u.is_active = true GROUP BY u.id, u.nick, u.first_name, u.last_name, ui.category_ids`);

export const pendingFriendRequests = pgView("pending_friend_requests", {	requestId: integer("request_id"),
	senderId: integer("sender_id"),
	senderNick: text("sender_nick"),
	senderFirstName: text("sender_first_name"),
	senderLastName: text("sender_last_name"),
	receiverId: integer("receiver_id"),
	receiverNick: text("receiver_nick"),
	receiverFirstName: text("receiver_first_name"),
	receiverLastName: text("receiver_last_name"),
	message: text(),
	status: text(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT fr.id AS request_id, fr.sender_id, s.nick AS sender_nick, s.first_name AS sender_first_name, s.last_name AS sender_last_name, fr.receiver_id, r.nick AS receiver_nick, r.first_name AS receiver_first_name, r.last_name AS receiver_last_name, fr.message, fr.status, fr.sent_at FROM friend_requests fr JOIN users s ON fr.sender_id = s.id JOIN users r ON fr.receiver_id = r.id WHERE fr.status = 'pending'::text`);

export const userFriendsView = pgView("user_friends_view", {	userId: integer("user_id"),
	userNick: text("user_nick"),
	friendId: integer("friend_id"),
	friendNick: text("friend_nick"),
	friendFirstName: text("friend_first_name"),
	friendLastName: text("friend_last_name"),
}).as(sql`SELECT uf.user_id, u.nick AS user_nick, unnest(uf.friends) AS friend_id, f.nick AS friend_nick, f.first_name AS friend_first_name, f.last_name AS friend_last_name FROM user_friends uf JOIN users u ON uf.user_id = u.id JOIN users f ON f.id = ANY (uf.friends) WHERE u.is_active = true AND f.is_active = true`);

export const userBlockedView = pgView("user_blocked_view", {	userId: integer("user_id"),
	userNick: text("user_nick"),
	blockedId: integer("blocked_id"),
	blockedNick: text("blocked_nick"),
	blockedFirstName: text("blocked_first_name"),
	blockedLastName: text("blocked_last_name"),
}).as(sql`SELECT ub.user_id, u.nick AS user_nick, unnest(ub.blocked_users) AS blocked_id, b.nick AS blocked_nick, b.first_name AS blocked_first_name, b.last_name AS blocked_last_name FROM user_blocked ub JOIN users u ON ub.user_id = u.id JOIN users b ON b.id = ANY (ub.blocked_users)`);

export const userConversations = pgView("user_conversations", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	conversationId: bigint("conversation_id", { mode: "number" }),
	otherUserId: integer("other_user_id"),
	otherUserNick: text("other_user_nick"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	lastMessageAt: timestamp("last_message_at", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	unreadCount: bigint("unread_count", { mode: "number" }),
}).as(sql`SELECT c.id AS conversation_id, CASE WHEN c.user1_id = u.id THEN c.user2_id ELSE c.user1_id END AS other_user_id, ( SELECT users.nick FROM users WHERE users.id = CASE WHEN c.user1_id = u.id THEN c.user2_id ELSE c.user1_id END) AS other_user_nick, c.created_at, ( SELECT max(messages.sent_at) AS max FROM messages WHERE messages.conversation_id = c.id) AS last_message_at, ( SELECT count(*) AS count FROM messages WHERE messages.conversation_id = c.id AND messages.is_read = false AND messages.receiver_id = u.id) AS unread_count FROM conversations c CROSS JOIN users u WHERE u.id = c.user1_id OR u.id = c.user2_id`);

export const conversationMessages = pgView("conversation_messages", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	messageId: bigint("message_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	conversationId: bigint("conversation_id", { mode: "number" }),
	senderId: integer("sender_id"),
	senderNick: text("sender_nick"),
	receiverId: integer("receiver_id"),
	receiverNick: text("receiver_nick"),
	messageType: text("message_type"),
	textContent: text("text_content"),
	// TODO: failed to parse database type 'bytea'
	binaryContent: bytea("binary_content"),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	isRead: boolean("is_read"),
}).as(sql`SELECT m.id AS message_id, m.conversation_id, m.sender_id, s.nick AS sender_nick, m.receiver_id, r.nick AS receiver_nick, m.message_type, CASE WHEN m.message_type = 'text'::text THEN convert_from(m.content, 'UTF-8'::name) ELSE NULL::text END AS text_content, m.content AS binary_content, m.sent_at, m.is_read FROM messages m JOIN users s ON m.sender_id = s.id JOIN users r ON m.receiver_id = r.id ORDER BY m.sent_at`);

export const highSimilarityCodes = pgView("high_similarity_codes", {	comparisonId: integer("comparison_id"),
	similarityscore: doublePrecision(),
	entry1Id: integer("entry1_id"),
	file1Name: text("file1_name"),
	entry2Id: integer("entry2_id"),
	file2Name: text("file2_name"),
	user1Id: integer("user1_id"),
	user1Nick: text("user1_nick"),
	user2Id: integer("user2_id"),
	user2Nick: text("user2_nick"),
}).as(sql`SELECT cr.id AS comparison_id, cr.similarityscore, tc1.entryid AS entry1_id, re1.name AS file1_name, tc2.entryid AS entry2_id, re2.name AS file2_name, u1.id AS user1_id, u1.nick AS user1_nick, u2.id AS user2_id, u2.nick AS user2_nick FROM comparisonresults cr JOIN tokenizedcodes tc1 ON cr.code1id = tc1.id JOIN tokenizedcodes tc2 ON cr.code2id = tc2.id JOIN repo_entries re1 ON tc1.entryid = re1.id JOIN repo_entries re2 ON tc2.entryid = re2.id JOIN users u1 ON cr.user1 = u1.id JOIN users u2 ON cr.user2 = u2.id WHERE cr.similarityscore > 0.7::double precision ORDER BY cr.similarityscore DESC`);