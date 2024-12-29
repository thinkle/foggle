<script lang="ts">
	import Word from "./Word.svelte";

  let {word,invalid} = $props();
</script>

<div class:invalid={invalid} class="current-guess">      
    {#key word}<Word {word} answer={""} /> {/key}
</div>

<style>
    .current-guess {
        min-height: var(--ltr-height,3rem);
    }
.invalid {
    animation: shake 0.5s;
    border: 1px solid red;
}
@keyframes shake {
    0% { transform: translate(0, 0); }
    10%, 20% { transform: translate(-10px, 0); }
    30%, 50%, 70%, 90% { transform: translate(10px, 0); }
    40%, 60%, 80% { transform: translate(-10px, 0); }
    100% { transform: translate(0, 0); }
}
</style>

