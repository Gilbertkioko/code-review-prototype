<script lang="ts">
	import Accordion from '$lib/ui/Accordion.svelte';
</script>

<div class="space-y-3">
	<Accordion title="Racetrack info-screens 🏁">
		<p>
			Beachside Racetrack is almost ready to open. The asphalt is laid, the reception and paddock are built,
			and the spectator area is finished. The track is in a very touristic location, which means strong
			interest from drivers and spectators, but also high pressure on staffing.
		</p>
		<p class="mt-3">
			Your job is to build a real-time race management and spectator information system so every role gets the
			information they need at the right moment.
		</p>
	</Accordion>

	<Accordion title="Functional requirements 📌" defaultOpen={true}>
		<p class="font-medium text-kood-text">The MVP must solve the track's biggest operating problems for these personas:</p>
		<ul class="mt-2 list-disc space-y-2 pl-5">
			<li><strong>Receptionist</strong> — configure upcoming race sessions, manage drivers, and assign cars.</li>
			<li><strong>Safety Official</strong> — start the race, control race mode, finish the race, and end the session.</li>
			<li><strong>Lap-line Observer</strong> — record lap line crossings for each car with large, easy buttons.</li>
			<li><strong>Race Driver</strong> — view the next race session, assigned car, lap progress, and lap times.</li>
			<li><strong>Spectator</strong> — see a real-time leaderboard, current race timer, flag status, and fastest laps.</li>
		</ul>
		<p class="mt-4 font-semibold text-kood-text">Key requirements:</p>
		<ul class="mt-2 list-disc space-y-2 pl-5">
			<li>Configure upcoming race sessions: add/remove sessions, add/remove/edit unique driver names, and assign cars.</li>
			<li>Start a race and switch race modes: Safe, Hazard, Danger, Finish.</li>
			<li>Track lap line crossings in real time and update fastest lap times per car.</li>
			<li>Show spectators the current leaderboard, remaining race time, and current flag status.</li>
			<li>Keep the previous race results visible until the next session starts.</li>
		</ul>
	</Accordion>

	<Accordion title="Expected outcome 🎯">
		<p class="font-medium text-kood-text">The finished system should include:</p>
		<ul class="mt-2 list-disc space-y-2 pl-5">
			<li>Node.js server with Socket.IO powering real-time updates.</li>
			<li>Employee interfaces protected by access keys via environment variables.</li>
			<li>Routes for each interface: /front-desk, /race-control, /lap-line-tracker, /leaderboard, /next-race, /race-countdown, /race-flags.</li>
			<li>Full-screen public displays for driver and spectator screens.</li>
			<li>Race timer that lasts 1 minute in dev mode and 10 minutes in production mode.</li>
			<li>All data synchronized live without polling.</li>
		</ul>
	</Accordion>

	<Accordion title="Technology requirements 💻">
		<ul class="mt-2 list-disc space-y-2 pl-5">
			<li>Server written in Node.js.</li>
			<li>Socket.IO used for real-time communication between interfaces.</li>
			<li>Server start command: <code>npm start</code>.</li>
			<li>Dev mode timer override: <code>npm run dev</code> makes races last 1 minute.</li>
			<li>No persistence is required for the MVP, but state should be retained if the server is restarted only if extra persistence is implemented.</li>
		</ul>
	</Accordion>

	<Accordion title="Interfaces & routes 📍">
		<p class="font-medium text-kood-text">Each interface must be available from a top-level route:</p>
		<ul class="mt-2 list-disc space-y-2 pl-5">
			<li><strong>/front-desk</strong> — Receptionist interface for session and driver management.</li>
			<li><strong>/race-control</strong> — Safety Official panel for race start, mode control, finish, and end session.</li>
			<li><strong>/lap-line-tracker</strong> — Lap-line Observer controls with large car-number buttons.</li>
			<li><strong>/leaderboard</strong> — Guest leader-board showing fastest lap rankings.</li>
			<li><strong>/next-race</strong> — Driver-facing next race screen with assigned cars.</li>
			<li><strong>/race-countdown</strong> — Timer display for race drivers and spectators.</li>
			<li><strong>/race-flags</strong> — Full-screen flag mode display for trackside screens.</li>
		</ul>
	</Accordion>

	<Accordion title="Security requirements 🔒">
		<p class="mt-2">
			Employee interfaces must request an access key before establishing a real-time connection.
			Each interface must have its own environment-backed key so only authorized users can control the system.
		</p>
		<ul class="mt-3 list-disc space-y-2 pl-5">
			<li>Server must refuse to start if required access keys are not defined.</li>
			<li>Incorrect key entry must wait 500ms before responding and show a clear error message.</li>
			<li>Interfaces must re-prompt after a failed key attempt.</li>
		</ul>
	</Accordion>

	<Accordion title="Bonus requirements 🎁">
		<p>
			You may implement additional features as long as they do not alter the default MVP behavior.
			Example bonuses include persistent storage, manual car selection by the receptionist, or a better full-screen display mode.
		</p>
		<p class="mt-3">
			If persistence is added, the server should restore the current race state after restart.
		</p>
	</Accordion>

	<Accordion title="Useful links 🔗">
		<ul class="list-disc space-y-2 pl-5">
			<li>Socket.IO docs: <a class="text-kood-accent underline" href="https://socket.io/docs" target="_blank" rel="noreferrer">socket.io/docs</a></li>
			<li>Node.js docs: <a class="text-kood-accent underline" href="https://nodejs.org/en/docs" target="_blank" rel="noreferrer">nodejs.org/en/docs</a></li>
			<li>Real-time web guide: <a class="text-kood-accent underline" href="https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API" target="_blank" rel="noreferrer">WebSockets API</a></li>
			<li>Race management concept: <a class="text-kood-accent underline" href="https://en.wikipedia.org/wiki/Motorsport" target="_blank" rel="noreferrer">Motorsport operations</a></li>
		</ul>
	</Accordion>

	<Accordion title="What you'll learn 🧠">
		<ul class="list-disc space-y-2 pl-5">
			<li>Building real-time applications with Socket.IO and Node.js.</li>
			<li>Designing multiple interfaces for distinct user roles.</li>
			<li>Implementing route-based public displays and secure employee controls.</li>
			<li>Managing timed sessions, state changes, and live leaderboard updates.</li>
		</ul>
	</Accordion>

	<Accordion title="Deliverables and Review Requirements 📁">
		<ul class="list-disc space-y-2 pl-5">
			<li>All source code and configuration files for the racetrack system.</li>
			<li>README with setup, environment variables, route descriptions, and a user guide.</li>
			<li>Instructions on how to open each interface from a public URL or local tunnel.</li>
			<li>During review, be ready to explain architecture, Socket.IO usage, and any design choices.</li>
		</ul>
	</Accordion>
</div>
