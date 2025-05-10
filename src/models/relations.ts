import { relations } from "drizzle-orm/relations";
import { users, userProfilePhoto, friendRequests, userInterests, userFriends, userBlocked, conversations, messages, repositories, repositoryMetadata, repoEntries, tokenizedcodes, comparisonresults, repoEntriesData } from "./schema";

export const userProfilePhotoRelations = relations(userProfilePhoto, ({one}) => ({
	user: one(users, {
		fields: [userProfilePhoto.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userProfilePhotos: many(userProfilePhoto),
	friendRequests_senderId: many(friendRequests, {
		relationName: "friendRequests_senderId_users_id"
	}),
	friendRequests_receiverId: many(friendRequests, {
		relationName: "friendRequests_receiverId_users_id"
	}),
	userInterests: many(userInterests),
	userFriends: many(userFriends),
	userBlockeds: many(userBlocked),
	conversations_user1Id: many(conversations, {
		relationName: "conversations_user1Id_users_id"
	}),
	conversations_user2Id: many(conversations, {
		relationName: "conversations_user2Id_users_id"
	}),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	messages_receiverId: many(messages, {
		relationName: "messages_receiverId_users_id"
	}),
	repositories: many(repositories),
	comparisonresults_user1: many(comparisonresults, {
		relationName: "comparisonresults_user1_users_id"
	}),
	comparisonresults_user2: many(comparisonresults, {
		relationName: "comparisonresults_user2_users_id"
	}),
}));

export const friendRequestsRelations = relations(friendRequests, ({one}) => ({
	user_senderId: one(users, {
		fields: [friendRequests.senderId],
		references: [users.id],
		relationName: "friendRequests_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [friendRequests.receiverId],
		references: [users.id],
		relationName: "friendRequests_receiverId_users_id"
	}),
}));

export const userInterestsRelations = relations(userInterests, ({one}) => ({
	user: one(users, {
		fields: [userInterests.userId],
		references: [users.id]
	}),
}));

export const userFriendsRelations = relations(userFriends, ({one}) => ({
	user: one(users, {
		fields: [userFriends.userId],
		references: [users.id]
	}),
}));

export const userBlockedRelations = relations(userBlocked, ({one}) => ({
	user: one(users, {
		fields: [userBlocked.userId],
		references: [users.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	user_user1Id: one(users, {
		fields: [conversations.user1Id],
		references: [users.id],
		relationName: "conversations_user1Id_users_id"
	}),
	user_user2Id: one(users, {
		fields: [conversations.user2Id],
		references: [users.id],
		relationName: "conversations_user2Id_users_id"
	}),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [messages.receiverId],
		references: [users.id],
		relationName: "messages_receiverId_users_id"
	}),
}));

export const repositoriesRelations = relations(repositories, ({one, many}) => ({
	user: one(users, {
		fields: [repositories.userId],
		references: [users.id]
	}),
	repositoryMetadata: many(repositoryMetadata),
	repoEntries: many(repoEntries),
}));

export const repositoryMetadataRelations = relations(repositoryMetadata, ({one}) => ({
	repository: one(repositories, {
		fields: [repositoryMetadata.repositoryId],
		references: [repositories.id]
	}),
}));

export const repoEntriesRelations = relations(repoEntries, ({one, many}) => ({
	repository: one(repositories, {
		fields: [repoEntries.repositoryId],
		references: [repositories.id]
	}),
	repoEntry: one(repoEntries, {
		fields: [repoEntries.parentId],
		references: [repoEntries.id],
		relationName: "repoEntries_parentId_repoEntries_id"
	}),
	repoEntries: many(repoEntries, {
		relationName: "repoEntries_parentId_repoEntries_id"
	}),
	repoEntriesData: many(repoEntriesData),
	tokenizedcodes: many(tokenizedcodes),
}));

export const comparisonresultsRelations = relations(comparisonresults, ({one}) => ({
	tokenizedcode_code1Id: one(tokenizedcodes, {
		fields: [comparisonresults.code1Id],
		references: [tokenizedcodes.id],
		relationName: "comparisonresults_code1Id_tokenizedcodes_id"
	}),
	tokenizedcode_code2Id: one(tokenizedcodes, {
		fields: [comparisonresults.code2Id],
		references: [tokenizedcodes.id],
		relationName: "comparisonresults_code2Id_tokenizedcodes_id"
	}),
	user_user1: one(users, {
		fields: [comparisonresults.user1],
		references: [users.id],
		relationName: "comparisonresults_user1_users_id"
	}),
	user_user2: one(users, {
		fields: [comparisonresults.user2],
		references: [users.id],
		relationName: "comparisonresults_user2_users_id"
	}),
}));

export const tokenizedcodesRelations = relations(tokenizedcodes, ({one, many}) => ({
	comparisonresults_code1Id: many(comparisonresults, {
		relationName: "comparisonresults_code1Id_tokenizedcodes_id"
	}),
	comparisonresults_code2Id: many(comparisonresults, {
		relationName: "comparisonresults_code2Id_tokenizedcodes_id"
	}),
	repoEntry: one(repoEntries, {
		fields: [tokenizedcodes.entryid],
		references: [repoEntries.id]
	}),
}));

export const repoEntriesDataRelations = relations(repoEntriesData, ({one}) => ({
	repoEntry: one(repoEntries, {
		fields: [repoEntriesData.entryId],
		references: [repoEntries.id]
	}),
}));