<!-- src/routes/+page.svelte -->
<script lang="ts">
  import Button from '../components/Button.svelte';
  import Time from '../components/Time.svelte';
  import Humidity from '../components/Humidity.svelte';
  import ThermostatControl from '../components/ThermostatControl.svelte';

  let isAdjusting = false;
  let isTouched = false;
  let touchTimeout: number;

  function handleEnterAdjustMode() {
    isAdjusting = true;
  }

  function handleExitAdjustMode() {
    isAdjusting = false;
  }

  function handleTouch() {
    // Set touched state
    isTouched = true;
    
    // Clear any existing timeout
    if (touchTimeout) {
      clearTimeout(touchTimeout);
    }
    
    // Set new timeout to reset after 5 seconds
    touchTimeout = setTimeout(() => {
      isTouched = false;
    }, 5000);
  }

  // Handle both touch and mouse events for broader compatibility
  function handleInteraction(event: Event) {
    handleTouch();
  }

</script>

<style>
  .thermostat-container {
    /* Adjust this scale value to fit your specific screen */
    transform: scale(0.85);
    transform-origin: center;
    transition: transform 0.3s ease;
    
    /* Manual positioning - uncomment and adjust as needed */
    position: relative;
    top: -20px;
    left: 0px;
    
    /* Or use margin for offset positioning */
    /* margin-top: 20px; */
    /* margin-left: 50px; */
  }
</style>

<main class="flex justify-center items-center min-h-screen"       style="background-color: {isTouched ? '#9ba6ad' : '#84896b'}">
  <!-- Scalable container wrapper -->
  <div class="thermostat-container">
    <div 
      class="relative w-[800px] h-[480px] overflow-hidden transition-colors duration-300"
      style="background-color: {isTouched ? '#9ba6ad' : '#84896b'}"
      on:touchstart={handleInteraction}
      on:mousedown={handleInteraction}
      on:click={handleInteraction}
    >
    <!-- Background image for positioning reference -->
    <!-- <img 
      src="/background.jpg" 
      alt="Layout guide" 
      class="absolute inset-0 w-[800px] h-[480px] object-fill z-10 pointer-events-none"
    /> -->
    
    <!-- UI elements will go here -->
    <div class="absolute inset-0 z-20">
        <Time />
        <Humidity />

        <ThermostatControl 
          onEnterAdjustMode={handleEnterAdjustMode}
          onExitAdjustMode={handleExitAdjustMode}
        />

        {#if !isAdjusting}

          <Button 
              x={6} 
              y={290} 
              mainText="Menu"

          />
          <Button 
              x={205} 
              y={290} 
              mainText="Sched"
              textOptions={[
              {text: 'Hold', x: 30, y: 50},
              {text: 'Run', x: 90, y: 50},
              {text: 'ESM', x: 130, y: 50}
              ]}
          />
          <Button 
              x={405} 
              y={290} 
              mainText="Mode"
              textOptions={[
              {text: 'Off', x: 20, y: 25},
              {text: 'Heat', x: 120, y: 50},
              {text: 'Cool', x: 25, y: 50},

              {text: 'Auto', x: 78, y: 50},

              ]}
          />
          <Button 
              x={600} 
              y={290} 
              mainText="Fan"
              textOptions={[
              {text: 'Auto', x: 75, y: 50},
              {text: 'On', x: 130, y: 50},
              {text: 'Circ', x: 20, y: 25}
              ]}
          />
        {/if}
    </div>
  </div>
</div>
  
</main>