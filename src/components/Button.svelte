<!-- src/components/Button.svelte -->
<script lang="ts">
  export let x = 0;
  export let y = 0;
  export let mainText = 'Menu'; // Fixed text that doesn't change
  export let textOptions = [
    {text: '', x: 40, y: 120},
    {text: '', x: 130, y: 60},
    {text: '', x: 80, y: 140}
  ]; // Array of text options with their own positions
  
  let currentTextIndex = 0;
  let isActive = false;
  
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

  function handleClick() {
    console.log('👆 Button handleClick triggered');
    playBeep();
    isActive = true;
    currentTextIndex = (currentTextIndex + 1) % textOptions.length;
    
    // Reset rotation after animation
    setTimeout(() => {
      isActive = false;
    }, 300);
  }
</script>

<button 
  class="absolute w-[190px] h-[190px] flex items-center justify-center bg-transparent border-none cursor-pointer p-0 focus:outline-none "
  style="left: {x}px; top: {y}px;"
  on:click={handleClick}
>
  <!-- Button background image -->
  <img 
    src="/box1.png" 
    alt="Button" 
    class="w-full h-full object-contain"
  />
  
  <!-- Main text - fixed position (centered) -->
  <div class="absolute" style="left: 48px; top: 110px;">
    <span class="text-black italic font-bold text-[30px] text-center drop-shadow-lg">
      {mainText}
    </span>
  </div>
    
  <!-- Cycling text options - unique positions -->
  <div class="absolute" style="left: {textOptions[currentTextIndex].x}px; top: {textOptions[currentTextIndex].y}px;">
    <span class="text-black italic font-bold text-[20px] drop-shadow-lg">
      {textOptions[currentTextIndex].text}
    </span>
  </div>
</button>