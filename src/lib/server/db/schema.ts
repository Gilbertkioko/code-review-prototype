import { sql } from 'drizzle-orm';
import { check, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { UserRole } from '$lib/userRole';

export const user = sqliteTable(
	'user',
	{
		id: text('id').primaryKey(),
		username: text('username').notNull().unique(),
		email: text('email').notNull().unique(),
		password_hash: text('password_hash').notNull(),
		role: text('role')
			.notNull()
			.default('submitter')
			.$type<UserRole>()
	},
	(t) => ({
		roleCheck: check('user_role_check', sql`${t.role} in ('admin', 'submitter', 'reviewer')`)
	})
);

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'number' }).notNull()
});

/** Submitter-owned repo review cycle (batches = multiple rows over time for the one submitter). */
export const project = sqliteTable('project', {
	id: text('id').primaryKey(),
	submitterId: text('submitter_id')
		.notNull()
		.references(() => user.id),
	instructions: text('instructions').notNull(),
	giteaUrl: text('gitea_url'),
	status: text('status').notNull(),
	/** Linear review gate beyond `status`: repo → testing → code review → done. */
	submissionProgress: text('submission_progress').notNull().default('awaiting_repo'),
	/** Saved Testing phase: checklist rows, verdicts, and per-item comment threads (prototype shape). */
	testingJson: text('testing_json'),
	codeReviewJson: text('code_review_json'),
	createdAt: integer('created_at', { mode: 'number' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	/** When set, project is omitted from the admin sidebar until restored (Settings). */
	adminSidebarHiddenAt: integer('admin_sidebar_hidden_at', { mode: 'number' })
});

/** Admin pairs two reviewers to one project; categories split the four sprint areas. */
export const reviewPair = sqliteTable(
	'review_pair',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.notNull()
			.references(() => project.id)
			.unique(),
		reviewerAId: text('reviewer_a_id')
			.notNull()
			.references(() => user.id),
		reviewerBId: text('reviewer_b_id')
			.notNull()
			.references(() => user.id),
		categoriesAJson: text('categories_a_json').notNull(),
		categoriesBJson: text('categories_b_json').notNull(),
		createdById: text('created_by_id')
			.notNull()
			.references(() => user.id),
		createdAt: integer('created_at', { mode: 'number' }).notNull()
	},
	(t) => ({
		distinctReviewers: check('review_pair_distinct', sql`${t.reviewerAId} != ${t.reviewerBId}`)
	})
);

/** Threaded discussion for the trio (and visible to admin). */
export type ProjectRow = typeof project.$inferSelect;
export type ReviewPairRow = typeof reviewPair.$inferSelect;

/** Latest accept/decline/pending per testing checklist row (same item ids as prototype). */
export const testingItemProgress = sqliteTable(
	'testing_item_progress',
	{
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		itemId: text('item_id').notNull(),
		section: text('section').notNull(),
		itemSummary: text('item_summary').notNull(),
		mandatoryOwner: text('mandatory_owner'),
		janeVerdict: text('jane_verdict').notNull(),
		joeVerdict: text('joe_verdict').notNull(),
		testingRound: integer('testing_round', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.projectId, t.itemId] })
	})
);

/** Ordered messages on a testing row (reviewer ↔ submitter threads). */
export const testingThreadMessage = sqliteTable('testing_thread_message', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	itemId: text('item_id').notNull(),
	round: integer('round', { mode: 'number' }).notNull(),
	authorPersona: text('author_persona').notNull(),
	body: text('body').notNull(),
	postedAt: integer('posted_at', { mode: 'number' }).notNull(),
	authorUserId: text('author_user_id').references(() => user.id)
});

/** Latest verdicts per code-review observation. */
export const codeReviewObservationProgress = sqliteTable(
	'code_review_observation_progress',
	{
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		categoryId: text('category_id').notNull(),
		observationId: text('observation_id').notNull(),
		janeVerdict: text('jane_verdict').notNull(),
		joeVerdict: text('joe_verdict').notNull(),
		codeReviewRound: integer('code_review_round', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.projectId, t.categoryId, t.observationId] })
	})
);

/** Messages on one code-review observation row. */
export const codeReviewThreadMessage = sqliteTable('code_review_thread_message', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	categoryId: text('category_id').notNull(),
	observationId: text('observation_id').notNull(),
	round: integer('round', { mode: 'number' }).notNull(),
	authorPersona: text('author_persona').notNull(),
	body: text('body').notNull(),
	postedAt: integer('posted_at', { mode: 'number' }).notNull(),
	authorUserId: text('author_user_id').references(() => user.id)
});

/** Reviewer check-in status per project/persona (authoritative server source). */
export const reviewerCheckin = sqliteTable(
	'reviewer_checkin',
	{
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		reviewerUserId: text('reviewer_user_id')
			.notNull()
			.references(() => user.id),
		persona: text('persona').notNull(),
		acceptedAt: integer('accepted_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.projectId, t.reviewerUserId] })
	})
);

/** Immutable event history for testing verdict changes (used by admin iteration analytics). */
export const testingVerdictEvent = sqliteTable('testing_verdict_event', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	itemId: text('item_id').notNull(),
	persona: text('persona').notNull(),
	verdict: text('verdict').notNull(),
	testingRound: integer('testing_round', { mode: 'number' }).notNull(),
	changedAt: integer('changed_at', { mode: 'number' }).notNull(),
	changedByUserId: text('changed_by_user_id').references(() => user.id)
});

/** Immutable event history for code-review verdict changes (used by admin iteration analytics). */
export const codeReviewVerdictEvent = sqliteTable('code_review_verdict_event', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	categoryId: text('category_id').notNull(),
	observationId: text('observation_id').notNull(),
	persona: text('persona').notNull(),
	verdict: text('verdict').notNull(),
	codeReviewRound: integer('code_review_round', { mode: 'number' }).notNull(),
	changedAt: integer('changed_at', { mode: 'number' }).notNull(),
	changedByUserId: text('changed_by_user_id').references(() => user.id)
});

export const projectComment = sqliteTable('project_comment', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id),
	authorId: text('author_id')
		.notNull()
		.references(() => user.id),
	parentId: text('parent_id'),
	body: text('body').notNull(),
	createdAt: integer('created_at', { mode: 'number' }).notNull()
});
