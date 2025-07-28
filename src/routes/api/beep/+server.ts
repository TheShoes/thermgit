// src/routes/api/beep/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';

let buzzer: any = null;
let isBeeping = false;
let initializationPromise: Promise<void> | null = null;

// Lazy initialization function
async function initializeBuzzer() {
  if (buzzer !== null || initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        const { Gpio } = await import('onoff');
        buzzer = new Gpio(76, 'out');
        buzzer.writeSync(0); // Start LOW
        console.log('✓ Passive buzzer initialized on GPIO 76');
      } catch (error) {
        if (error && typeof error === 'object' && 'message' in error) {
          console.log('✗ GPIO not available:', (error as { message: string }).message);
        } else {
          console.log('✗ GPIO not available:', error);
        }
        buzzer = null;
      }
    } else {
      console.log('✗ Not running in Node.js environment');
      buzzer = null;
    }
  })();

  return initializationPromise;
}

// Function to create PWM signal for passive buzzer
function passiveBuzzerBeep(duration: number = 1000, frequency: number = 1000): Promise<void> {
  return new Promise((resolve) => {
    console.log(`🔊 Attempting beep: ${frequency}Hz for ${duration}ms`);
    
    if (!buzzer) {
      console.log('✗ Buzzer not available');
      resolve();
      return;
    }

    if (isBeeping) {
      console.log('⚠️ Already beeping, skipping');
      resolve();
      return;
    }

    isBeeping = true;
    console.log(`🎵 Starting beep at ${frequency}Hz for ${duration}ms`);

    // Calculate half period in milliseconds (for PWM)
    const halfPeriodMs = Math.max(1, Math.round(500 / frequency));
    
    let state = 0;
    let toggleCount = 0;
    const startTime = Date.now();
    const expectedToggles = Math.floor(duration / halfPeriodMs);

    // Create PWM by toggling GPIO rapidly
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed >= duration) {
        // Stop beeping
        clearInterval(interval);
        buzzer.writeSync(0); // Ensure it ends LOW
        isBeeping = false;
        console.log(`✓ Beep finished (${toggleCount} toggles in ${elapsed}ms)`);
        resolve();
        return;
      }

      // Toggle state to create PWM
      state = state === 0 ? 1 : 0;
      buzzer.writeSync(state);
      toggleCount++;
    }, halfPeriodMs);
  });
}

// Function for SOS pattern
async function playSOSPattern(): Promise<void> {
  console.log('📡 Playing SOS pattern...');
  
  try {
    // S - short beeps (3x)
    for (let i = 0; i < 3; i++) {
      await passiveBuzzerBeep(200, 1500);
      await new Promise(r => setTimeout(r, 100)); // Short pause
    }
    
    await new Promise(r => setTimeout(r, 200)); // Medium pause
    
    // O - long beeps (3x)
    for (let i = 0; i < 3; i++) {
      await passiveBuzzerBeep(600, 1500);
      await new Promise(r => setTimeout(r, 100)); // Short pause
    }
    
    await new Promise(r => setTimeout(r, 200)); // Medium pause
    
    // S - short beeps (3x)
    for (let i = 0; i < 3; i++) {
      await passiveBuzzerBeep(200, 1500);
      await new Promise(r => setTimeout(r, 100)); // Short pause
    }
    
    console.log('✓ SOS complete');
  } catch (error) {
    console.error('✗ SOS pattern error:', error);
  }
}

export const POST: RequestHandler = async ({ url }) => {
  console.log('🔔 POST /api/beep called');
  
  try {
    // Initialize buzzer if not already done
    await initializeBuzzer();
    
    if (!buzzer) {
      console.log('✗ Buzzer initialization failed');
      return json({ success: false, message: 'Buzzer not available' });
    }

    // Get parameters from request
    const duration = parseInt(url.searchParams.get('duration') || '1000');
    const frequency = parseInt(url.searchParams.get('frequency') || '1000');
    const pattern = url.searchParams.get('pattern');

    console.log(`📋 Parameters: duration=${duration}, frequency=${frequency}, pattern=${pattern || 'none'}`);

    // Handle different patterns
    if (pattern === 'sos') {
      // Don't await - let it play in background
      playSOSPattern();
      return json({ 
        success: true, 
        message: 'Playing SOS pattern',
        frequency: 1500,
        pattern: 'SOS'
      });
    } else {
      // Regular beep
      await passiveBuzzerBeep(duration, frequency);
      return json({ 
        success: true, 
        message: `Beeped for ${duration}ms at ${frequency}Hz`,
        duration,
        frequency,
        gpio: 76
      });
    }
  } catch (error) {
    console.error('✗ Buzzer error:', error);
    const errorMessage = (error && typeof error === 'object' && 'message' in error)
      ? (error as { message: string }).message
      : String(error);
    return json({ success: false, error: errorMessage }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  console.log('🔔 GET /api/beep called');
  
  try {
    // Initialize buzzer if not already done
    await initializeBuzzer();
    
    if (!buzzer) {
      console.log('✗ Buzzer initialization failed');
      return json({ success: false, message: 'Buzzer not available' });
    }

    // Get parameters from URL query
    const duration = parseInt(url.searchParams.get('duration') || '500');
    const frequency = parseInt(url.searchParams.get('frequency') || '1000');
    const pattern = url.searchParams.get('pattern');

    console.log(`📋 Parameters: duration=${duration}, frequency=${frequency}, pattern=${pattern || 'none'}`);

    // Handle different patterns
    if (pattern === 'sos') {
      // Don't await - let it play in background
      playSOSPattern();
      return json({ 
        success: true, 
        message: 'Playing SOS pattern',
        frequency: 1500,
        pattern: 'SOS'
      });
    } else if (pattern === 'test') {
      // Play different frequencies
      setTimeout(async () => {
        await passiveBuzzerBeep(300, 500);  // Low
        await new Promise(r => setTimeout(r, 200));
        await passiveBuzzerBeep(300, 1000); // Medium
        await new Promise(r => setTimeout(r, 200));
        await passiveBuzzerBeep(300, 2000); // High
      }, 0);
      
      return json({ 
        success: true, 
        message: 'Playing test tones (low, medium, high)',
        pattern: 'test'
      });
    } else {
      // Regular beep
      await passiveBuzzerBeep(duration, frequency);
      return json({ 
        success: true, 
        message: `Beeped for ${duration}ms at ${frequency}Hz`,
        duration,
        frequency,
        gpio: 76
      });
    }
  } catch (error) {
    console.error('✗ Buzzer error:', error);
    const errorMessage = (error && typeof error === 'object' && 'message' in error)
      ? (error as { message: string }).message
      : String(error);
    return json({ success: false, error: errorMessage }, { status: 500 });
  }
};

// Cleanup on process exit
process?.on?.('exit', () => {
  if (buzzer) {
    console.log('🧹 Cleaning up buzzer on exit');
    buzzer.writeSync(0);
    buzzer.unexport();
  }
});

process?.on?.('SIGINT', () => {
  if (buzzer) {
    console.log('🧹 Cleaning up buzzer on SIGINT');
    buzzer.writeSync(0);
    buzzer.unexport();
  }
  process.exit();
});