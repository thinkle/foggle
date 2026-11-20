<script lang="ts">
	import type { ClueMark } from './hardMode';

	let { mark }: { mark: ClueMark } = $props();
</script>

<span class="ring" data-mark={mark} aria-hidden="true"></span>

<style>
	.ring {
		position: absolute;
		inset: 1px;
		border: 2px solid #e5e7eb;
		border-radius: 50%;
		pointer-events: none;
		filter: drop-shadow(0 0 1px #101322);
	}
	.ring[data-mark='present'] {
		border-color: #ffb65f;
	}
	.ring[data-mark^='need-'] {
		border-color: #8bf1a2;
	}
	.ring[data-mark^='ban-'] {
		border-style: dashed;
	}
	.ring[data-mark$='-left'] {
		clip-path: inset(0 50% 0 0);
	}
	.ring[data-mark$='-right'] {
		clip-path: inset(0 0 0 50%);
	}
</style>
