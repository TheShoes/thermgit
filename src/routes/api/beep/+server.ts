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

// Function for passive buzzer with optimized PWM
function passiveBuzzerBeep(duration: number = 200, frequency: number = 2000): Promise<void> {
  return new Promise((resolve) => {
    console.log(`🔊 Passive buzzer beep: ${frequency}Hz for ${duration}ms`);
    
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
    
    // Calculate period in microseconds for better precision
    const periodMicros = 1000000 / frequency;
    const halfPeriodMicros = periodMicros / 2;
    
    // Use setTimeout with precise timing
    let state = 0;
    let cycles = 0;
    const totalCycles = Math.floor((duration * 1000) / periodMicros); // duration in microseconds / period
    const startTime = Date.now();
    
    const toggle = () => {
      if (cycles >= totalCycles) {
        buzzer.writeSync(0); // End on LOW
        isBeeping = false;
        const elapsed = Date.now() - startTime;
        console.log(`✓ Passive buzzer finished (${cycles} cycles in ${elapsed}ms)`);
        resolve();
        return;
      }
      
      state = state === 0 ? 1 : 0;
      buzzer.writeSync(state);
      cycles++;
      
      // Schedule next toggle with precise timing
      setTimeout(toggle, halfPeriodMicros / 1000); // Convert microseconds to milliseconds
    };
    
    toggle();
  });
}

// Alternative simpler beep function with fixed duty cycle
function simpleBuzzerBeep(duration: number = 150, frequency: number = 2000): Promise<void> {
  return new Promise((resolve) => {
    console.log(`🔊 Simple beep: ${frequency}Hz for ${duration}ms`);
    
    if (!buzzer || isBeeping) {
      console.log('✗ Buzzer not available or busy');
      resolve();
      return;
    }

    isBeeping = true;

    // Calculate timing for 50% duty cycle
    const periodMs = 1000 / frequency;
    const onTimeMs = periodMs / 2;
    const offTimeMs = periodMs / 2;
    
    let cycles = 0;
    const totalCycles = Math.floor(duration / periodMs);
    
    const doCycle = () => {
      if (cycles >= totalCycles) {
        buzzer.writeSync(0);
        isBeeping = false;
        console.log(`✓ Simple beep finished (${cycles} cycles)`);
        resolve();
        return;
      }
      
      // ON phase
      buzzer.writeSync(1);
      setTimeout(() => {
        // OFF phase
        buzzer.writeSync(0);
        setTimeout(() => {
          cycles++;
          doCycle();
        }, offTimeMs);
      }, onTimeMs);
    };
    
    doCycle();
  });
}
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
    const duration = parseInt(url.searchParams.get('duration') || '150');
    const frequency = parseInt(url.searchParams.get('frequency') || '2000');
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
    const duration = parseInt(url.searchParams.get('duration') || '150');
    const frequency = parseInt(url.searchParams.get('frequency') || '2000');
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
      // Play different frequencies with both methods
      setTimeout(async () => {
        console.log('Testing high-precision method:');
        await passiveBuzzerBeep(200, 800);  // Low
        await new Promise(r => setTimeout(r, 300));
        await passiveBuzzerBeep(200, 1500); // Medium
        await new Promise(r => setTimeout(r, 300));
        await passiveBuzzerBeep(200, 2500); // High
        
        await new Promise(r => setTimeout(r, 500));
        
        console.log('Testing simple method:');
        await simpleBuzzerBeep(200, 800);   // Low
        await new Promise(r => setTimeout(r, 300));
        await simpleBuzzerBeep(200, 1500);  // Medium
        await new Promise(r => setTimeout(r, 300));
        await simpleBuzzerBeep(200, 2500);  // High
      }, 0);
      
      return json({ 
        success: true, 
        message: 'Playing test tones with both methods',
        pattern: 'test'
      });
    } else if (pattern === 'simple') {
      // Use the simpler method
      await simpleBuzzerBeep(duration, frequency);
      return json({ 
        success: true, 
        message: `Simple beeped for ${duration}ms at ${frequency}Hz`,
        duration,
        frequency,
        gpio: 76,
        method: 'simple'
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