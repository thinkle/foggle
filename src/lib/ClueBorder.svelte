<script lang="ts">
	import type { ClueMark } from './hardMode';

	let { mark }: { mark: ClueMark } = $props();
</script>

<span class="clue-border" data-mark={mark} aria-hidden="true"></span>

<style>
	.clue-border {
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		border: 2px solid #e5e7eb;
		border-radius: inherit;
		pointer-events: none;
		filter: drop-shadow(0 0 1px #101322);
	}
	.clue-border[data-mark='present'] {
		border-color: #ffb65f;
	}
	.clue-border[data-mark^='need-'] {
		border-color: #8bf1a2;
	}
	.clue-border[data-mark^='ban-'] {
		border-style: dashed;
	}
	.clue-border[data-mark$='-left'] {
		border-top: 0;
		border-right: 0;
		border-bottom: 0;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		border-left-width: 3px;
	}
	.clue-border[data-mark$='-right'] {
		border-top: 0;
		border-left: 0;
		border-bottom: 0;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-right-width: 3px;
	}
</style>
