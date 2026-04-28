<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { setContext } from 'svelte';
	import {
		appStateStorageKey,
		getApp,
		hydrateAppStateForAccount
	} from '$lib/appState.svelte';
	import { AUTH_SESSION, type SessionUser } from '$lib/auth-context';
	import { realtimeClientLog } from '$lib/realtimeDebug';
	import { connectRealtimeSse, isRealtimeSseEnabled } from '$lib/realtimeSse';
	import { cancelDebouncedInvalidateAll, scheduleDebouncedInvalidateAll } from '$lib/realtimeInvalidate';
	import { getRealtimeSocket } from '$lib/socket';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AcademyModal from '$lib/ui/AcademyModal.svelte';

	let { children, data } = $props();

	const auth = $state<{ sessionUser: SessionUser | null }>({ sessionUser: null });
	$effect(() => {
		auth.sessionUser = data.sessionUser;
	});
	setContext(AUTH_SESSION, auth);

	const app = getApp();

	/** Per-account `localStorage` — avoid mixing prototype UI when switching users in one browser. */
	let lastHydratedAccountSig: string | undefined = undefined;
	$effect(() => {
		if (!browser) return;
		const sig = data.sessionUser?.id ?? '';
		if (sig === lastHydratedAccountSig) return;
		lastHydratedAccountSig = sig;
		hydrateAppStateForAccount(data.sessionUser?.id ?? null);
	});

	/**
	 * Production (e.g. Vercel): long interval so `/socket.io` 404 + poll fallback does not wipe the UI every few seconds.
	 * Dev: shorter interval when the socket is down.
	 */
	const POLL_FALLBACK_MS = import.meta.env.PROD ? 45_000 : 5_000;

	/** Socket.IO when a Node server attaches it (dev / `node server.js`); polling fallback if the socket never connects. */
	let pollTimer: ReturnType<typeof setInterval> | undefined;
	let bootTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (!browser) return;
		const socket = getRealtimeSocket();
		const sessionUser = data.sessionUser;

		const bumpImmediate = (source: string) => {
			realtimeClientLog('invalidateAll()', { source });
			void invalidateAll();
		};
		const bumpFromSocket = (source: string) => {
			realtimeClientLog('scheduleDebouncedInvalidateAll', { source });
			scheduleDebouncedInvalidateAll(source);
		};
		const bumpFromSse = (source: string) => {
			realtimeClientLog('scheduleDebouncedInvalidateAll', { source });
			scheduleDebouncedInvalidateAll(source);
		};

		const armPoll = () => {
			if (pollTimer) return;
			realtimeClientLog('polling fallback ON — socket not usable', { everyMs: POLL_FALLBACK_MS });
			pollTimer = setInterval(() => bumpImmediate('poll:fallback'), POLL_FALLBACK_MS);
		};
		const disarmPoll = () => {
			if (pollTimer) {
				clearInterval(pollTimer);
				pollTimer = undefined;
				realtimeClientLog('polling fallback OFF');
			}
		};

		/**
		 * No Socket.IO client (env disabled or torn down after failures): HTTP poll + optional in-process SSE
		 * (`/api/realtime`). SSE only delivers when POST and GET share one Node process (dev / `node server.js`); on
		 * multi-instance hosts use poll or add Redis-backed fan-out later.
		 */
		if (!socket) {
			if (!sessionUser) {
				return () => {
					cancelDebouncedInvalidateAll();
					disarmPoll();
				};
			}
			armPoll();
			const sseConn =
				isRealtimeSseEnabled() ? connectRealtimeSse((src) => bumpFromSse(src)) : null;
			return () => {
				sseConn?.close();
				cancelDebouncedInvalidateAll();
				disarmPoll();
			};
		}

		const onWorkspace = () => bumpFromSocket('socket:workspace:invalidate');
		const onReview = () => bumpFromSocket('socket:review:invalidate');
		const onReviewerReassigned = (payload: { reason?: string }) => {
			const msg =
				typeof payload?.reason === 'string' && payload.reason.trim().length > 0
					? payload.reason
					: 'You were replaced on this review project by an admin.';
			alert(msg);
			bumpFromSocket('socket:reviewer:reassigned');
		};
		socket.on('workspace:invalidate', onWorkspace);
		socket.on('review:invalidate', onReview);
		socket.on('reviewer:reassigned', onReviewerReassigned);

		/** Rooms are per socket connection — must run on every `connect` (reload, reconnect, wake from sleep). */
		const syncSessionRooms = () => {
			if (!sessionUser) {
				realtimeClientLog('syncSessionRooms skipped (no sessionUser)');
				return;
			}
			realtimeClientLog('emit joinUser', sessionUser.id.slice(0, 8) + '…', sessionUser.role);
			socket.emit('joinUser', sessionUser.id);
			if (sessionUser.role === 'admin') {
				realtimeClientLog('emit joinRole admin');
				socket.emit('joinRole', 'admin');
			}
		};

		const onConnect = () => {
			realtimeClientLog('socket connected', socket.id);
			disarmPoll();
			syncSessionRooms();
		};
		const onDisconnect = (reason: string) => {
			realtimeClientLog('socket disconnect', reason);
			armPoll();
		};
		const onConnectError = (err: unknown) => {
			const msg = err instanceof Error ? err.message : String(err);
			realtimeClientLog('socket connect_error', msg);
			armPoll();
		};

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);
		socket.on('connect_error', onConnectError);

		realtimeClientLog('socket state', {
			connected: socket.connected,
			id: socket.id,
			hasSession: !!sessionUser
		});

		if (socket.connected) syncSessionRooms();
		else {
			bootTimer = setTimeout(() => {
				if (!socket.connected) {
					realtimeClientLog('socket still disconnected after 2.5s — arming poll');
					armPoll();
				}
			}, 2500);
		}

		return () => {
			socket.off('workspace:invalidate', onWorkspace);
			socket.off('review:invalidate', onReview);
			socket.off('reviewer:reassigned', onReviewerReassigned);
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
			socket.off('connect_error', onConnectError);
			cancelDebouncedInvalidateAll();
			disarmPoll();
			if (bootTimer) clearTimeout(bootTimer);
		};
	});

	// `$effect` cannot live at module scope in `.svelte.ts`; persist here during component init.
	$effect(() => {
		if (!browser) return;
		const snap = {
			role: app.role,
			phase: app.phase,
			projectStarted: app.projectStarted,
			submittedForReview: app.submittedForReview,
			testingRound: app.testingRound,
			testingItems: app.testingItems,
			categorySessions: app.categorySessions,
			codeReviewRound: app.codeReviewRound,
			standupItems: app.standupItems,
			standupWhen: app.standupWhen,
			standupVoiceChannel: app.standupVoiceChannel,
			standupTakeaways: app.standupTakeaways,
			standupTakeawayMessages: app.standupTakeawayMessages,
			sandraRatings: app.sandraRatings,
			reviewerRatings: app.reviewerRatings,
			xpMock: app.xpMock,
			leaderboardNote: app.leaderboardNote,
			reviewerAssignmentAccepted: app.reviewerAssignmentAccepted
		};
		localStorage.setItem(appStateStorageKey(data.sessionUser?.id ?? null), JSON.stringify(snap));
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<AcademyModal />
