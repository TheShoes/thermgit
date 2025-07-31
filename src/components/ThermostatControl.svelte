<!-- src/components/ThermostatControl.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Button from './Button.svelte';
  
  // Props to communicate with parent
  export let onEnterAdjustMode: () => void = () => {};
  export let onExitAdjustMode: () => void = () => {};
  
  let currentTemp = 72; // Actual house temperature
  let targetTemp = 72;  // What we want it to be
  let isAdjusting = false;
  let tempInterval: number;
  
  function startTempUpdates() {
    tempInterval = setInterval(() => {
      if (!isAdjusting) {
        // Check if we have a target to reach
        if (currentTemp < targetTemp) {
          currentTemp += 1; // Heating up to reach target
        } else if (currentTemp > targetTemp) {
          currentTemp -= 1; // Cooling down to reach target
        }
        // If currentTemp === targetTemp, do nothing (hold at target)
      }
    }, 1000);
  }
  
    async function playBeep() {
    try {
      console.log('🔔 Button clicked - sending beep request...');
      
      const response = await fetch('/api/beep?duration=200&frequency=2000', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('📡 Beep response:', result);
      
      if (result.success) {
        console.log('✓ Beep played successfully:', result.message);
      } else {
        console.error('✗ Beep failed:', result.message);
      }
    } catch (error) {
      console.error('✗ Beep request error:', error);
    }
  }

  function handleUpClick() {
    playBeep();
    if (!isAdjusting) {
      isAdjusting = true;
      onEnterAdjustMode();
      
    }
    targetTemp += 1;
  }
  
  function handleDownClick() {
          playBeep();

    if (!isAdjusting) {
      isAdjusting = true;
      onEnterAdjustMode();
    }
    targetTemp -= 1;
  }
  
  function handleDone() {
    // Go back to showing actual house temp and let it work toward target
    isAdjusting = false;
    onExitAdjustMode();
    playBeep();
  }
  
  onMount(() => {
    startTempUpdates();
    
    return () => {
      clearInterval(tempInterval);
    };
  });
</script>

<!-- Temperature Display (center) -->
<div class="absolute left-1/2 top-1/2 transform -mt-10 -translate-x-1/2 -translate-y-1/2 ">
  <div class="text-center relative">
    <!-- Temperature number -->
    <div class="text-black text-[220px] font-['digital-7']">
      {isAdjusting ? targetTemp : currentTemp}
    </div>
    
    <!-- Italic F positioned separately -->
    <div class="absolute text-black italic font-bold text-4xl" style="top: 80px; right: -30px;">
      F
    </div>
  </div>
</div>

<!-- Heating Indicator (only shows when heating) -->
{#if !isAdjusting && currentTemp < targetTemp}
  <div class="absolute text-black italic font-bold text-2xl" style="left: 570px; top: 120px;">
    Heating
  </div>
{/if}

<!-- Cooling Indicator (only shows when cooling) -->
{#if !isAdjusting && currentTemp > targetTemp}
  <div class="absolute text-black italic font-bold text-2xl" style="left: 570px; top: 150px;">
    Cooling
  </div>
{/if}

<!-- Up Arrow Button (right side, top) -->
<button 
  class="absolute w-[130px] h-[130px] bg-transparent border-none cursor-pointer p-0 focus:outline-none"
  style="right: 15px; top: 180px;"
  on:click={handleDownClick}
>
  <img 
    src="/box2.png" 
    alt="Up Arrow" 
    class="w-full h-full object-contain"
  />
</button>

<!-- Down Arrow Button (right side, bottom) -->
<button 
  class="absolute w-[130px] h-[130px] bg-transparent border-none cursor-pointer p-0 focus:outline-none"
  style="right: 15px; top: -4px;"
  on:click={handleUpClick}
>
  <img 
    src="/box2.png" 
    alt="Down Arrow" 
    class="w-full h-full object-contain"
    style="transform: rotate(180deg);"
  />
</button>

<!-- Target Temperature Display (between buttons) -->
{#if !isAdjusting}
<div class="absolute text-black text-[88px] text-center font-['digital-7']" style="right: 25px; top: 90px; width: 110px;">
    {targetTemp}
</div>
{/if}

<!-- Done Button using Button component -->
{#if isAdjusting}
  <div on:click={handleDone}>
    <Button 
      x={6} 
      y={290} 
      mainText="Done"
      textOptions={[
        {text: '', x: 40, y: 120},
        {text: '', x: 130, y: 60},
        {text: '', x: 80, y: 140}
      ]}
    />
  </div>
{/if}