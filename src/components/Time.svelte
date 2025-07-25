<!-- src/components/Time.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  let currentTime = '';
  let ampm = '';
  let interval: number;
  
  function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    currentTime = `${displayHours}:${minutes.toString().padStart(2, '0')}`;
  }
  
  onMount(() => {
    updateTime();
    interval = setInterval(updateTime, 1000);
    
    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="absolute -top-2 left-9 text-[60px] font-['digital-7'] drop-shadow-lg text-black flex items-end gap-2">
  <span>{currentTime}</span>
  <div class="flex flex-col ml-2">
    <span class="text-[25px] rounded-t font-bold font-mono -mt-20 {ampm === 'AM' ? 'text-black' : 'text-transparent'}">AM</span>
    <span class="text-[25px] rounded-b font-bold font-mono  -mt-3 {ampm === 'PM' ? 'text-black' : 'text-transparent'}">PM</span>
  </div>
</div>