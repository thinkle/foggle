<script>
	let {
		position = 'center',
		maxWidth = 25,
		skew = undefined,
		compact = false,
		children
	} = $props();
</script>

<div
	class="speech-bubble"
	class:compact
	class:left={position === 'left'}
	class:right={position === 'right'}
	style:--max-width={maxWidth}
	style:--skew={skew}
>
	{@render children()}
</div>

<style>
	.speech-bubble {
		--triangle-size: 20px; /* Triangle size */
		--triangle-offset: 20px; /* Horizontal offset for triangle */

		font-size: 1.5rem;
		max-width: var(--max-width, 20rem);
		padding: 1rem;
		background: #242;
		color: #fff;
		border-radius: 2rem 4rem 3rem 3rem;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
		position: relative;
		text-align: center;
		transform: skewX(var(--skew, -8deg)); /* Optional skew */
		margin: 0.5rem;
	}

	.speech-bubble.compact {
		max-width: 34rem;
		font-size: inherit;
		margin: 0.25rem 0.4rem 0.5rem;
		padding: 0.55rem 0.9rem 0.65rem;
		border-radius: 0.9rem 1.35rem 1.1rem 0.8rem;
		text-align: left;
	}
	.speech-bubble.compact::before {
		content: '';
		position: absolute;
		top: -0.4rem;
		left: 1.6rem;
		width: 0.8rem;
		height: 0.5rem;
		background: #242;
		clip-path: polygon(12% 0, 100% 100%, 0 100%);
	}

	.speech-bubble.left::after,
	.speech-bubble.right::after {
		content: '';
		position: absolute;
		bottom: calc(var(--triangle-size) * -0.8); /* Place triangle just below bubble */
		width: 0;
		height: 0;
		border-left: var(--triangle-size) solid transparent;
		border-right: var(--triangle-size) solid transparent;
		border-top: var(--triangle-size) solid #242; /* Matches bubble background */
	}

	.speech-bubble.left::after {
		left: calc(var(--triangle-offset) * 1.5);
	}

	.speech-bubble.right::after {
		right: calc(var(--triangle-offset) * 1.5);
	}

	.speech-bubble.right {
		transform: skewX(calc(var(--skew, -8deg) * -1)); /* Reverse skew for right */
	}
</style>
