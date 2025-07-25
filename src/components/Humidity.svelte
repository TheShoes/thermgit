<!-- src/components/Humidity.svelte -->
<script lang="ts">
  // Hard coded humidity value
  const humidity = 41;
</script>

<div class="absolute -top-2 left-1/2  transform -translate-x-1/2  font-['digital-7'] text-black text-[60px]">
  HUMIDITY {humidity}%
</div>