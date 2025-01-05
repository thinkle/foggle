<script>
    let {position = 'center', maxWidth = 25, children} = $props();
  </script>
  
  <div class="speech-bubble" class:left={position === "left"} class:right={position === "right"}
  style:--max-width={maxWidth}>
    {@render children()}
  </div>
  
  <style>
    .speech-bubble {
      --triangle-size: 20px; /* Triangle size */
      --triangle-offset: 20px; /* Horizontal offset for triangle */
  
      font-size: 1.5rem;
      max-width: var(--max-width,20rem);
      padding: 1rem;
      background: #242;
      color: #fff;
      border-radius: 2rem 4rem 3rem 3rem;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
      position: relative;
      text-align: center;
      transform: skewX(var(--skew, -15deg)); /* Optional skew */
      margin: 0.5rem;
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
      transform: skewX(calc(var(--skew, -15deg) * -1)); /* Reverse skew for right */

    }
  </style>