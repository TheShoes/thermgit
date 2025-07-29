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
        buzzer.writeSync(1); // Start HIGH (OFF for PNP transistor)
        console.log('✓ Buzzer with transistor driver initialized on GPIO 76');
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

// Simple transistor buzzer beep - no PWM needed!
function passiveBuzzerBeep(duration: number = 200, frequency?: number): Promise<void> {
  return new Promise((resolve) => {
    console.log(`🔊 Transistor buzzer beep for ${duration}ms`);
    
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
    
    // PNP transistor: LOW = ON, HIGH = OFF
    buzzer.writeSync(0); // Turn buzzer ON
    console.log(`🎵 Buzzer ON for ${duration}ms`);
    
    // Turn OFF after duration
    setTimeout(() => {
      buzzer.writeSync(1); // Turn buzzer OFF
      isBeeping = false;
      console.log(`✓ Buzzer OFF`);
      resolve();
    }, duration);
  });
}

// Alternative method with rapid switching for tone generation
function toneBuzzerBeep(duration: number = 200, frequency: number = 2000): Promise<void> {
  return new Promise((resolve) => {
    console.log(`🔊 Tone beep: ${frequency}Hz for ${duration}ms`);
    
    if (!buzzer || isBeeping) {
      console.log('✗ Buzzer not available or busy');
      resolve();
      return;
    }

    isBeeping = true;

    // Calculate timing for tone generation
    const periodMs = 1000 / frequency;
    const onTimeMs = periodMs / 2;
    const offTimeMs = periodMs / 2;
    
    let cycles = 0;
    const totalCycles = Math.floor(duration / periodMs);
    
    const doCycle = () => {
      if (cycles >= totalCycles) {
        buzzer.writeSync(1); // Ensure OFF state
        isBeeping = false;
        console.log(`✓ Tone beep finished (${cycles} cycles)`);
        resolve();
        return;
      }
      
      // ON phase (LOW for PNP)
      buzzer.writeSync(0);
      setTimeout(() => {
        // OFF phase (HIGH for PNP)
        buzzer.writeSync(1);
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
      await passiveBuzzerBeep(200);
      await new Promise(r => setTimeout(r, 100)); // Short pause
    }
    
    await new Promise(r => setTimeout(r, 200)); // Medium pause
    
    // O - long beeps (3x)
    for (let i = 0; i < 3; i++) {
      await passiveBuzzerBeep(600);
      await new Promise(r => setTimeout(r, 100)); // Short pause
    }
    
    await new Promise(r => setTimeout(r, 200)); // Medium pause
    
    // S - short beeps (3x)
    for (let i = 0; i < 3; i++) {
      await passiveBuzzerBeep(200);
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
    const duration = parseInt(url.searchParams.get('duration') || '200');
    const frequency = parseInt(url.searchParams.get('frequency') || '2000');
    const pattern = url.searchParams.get('pattern');
    const method = url.searchParams.get('method') || 'simple';

    console.log(`📋 Parameters: duration=${duration}, frequency=${frequency}, pattern=${pattern || 'none'}, method=${method}`);

    // Handle different patterns
    if (pattern === 'sos') {
      // Don't await - let it play in background
      playSOSPattern();
      return json({ 
        success: true, 
        message: 'Playing SOS pattern',
        pattern: 'SOS',
        method: 'simple'
      });
    } else if (method === 'tone') {
      // Use tone generation method
      await toneBuzzerBeep(duration, frequency);
      return json({ 
        success: true, 
        message: `Tone beeped for ${duration}ms at ${frequency}Hz`,
        duration,
        frequency,
        gpio: 76,
        method: 'tone'
      });
    } else {
      // Default simple beep
      await passiveBuzzerBeep(duration);
      return json({ 
        success: true, 
        message: `Beeped for ${duration}ms`,
        duration,
        gpio: 76,
        method: 'simple'
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
    const duration = parseInt(url.searchParams.get('duration') || '200');
    const frequency = parseInt(url.searchParams.get('frequency') || '2000');
    const pattern = url.searchParams.get('pattern');
    const method = url.searchParams.get('method') || 'simple';

    console.log(`📋 Parameters: duration=${duration}, frequency=${frequency}, pattern=${pattern || 'none'}, method=${method}`);

    // Handle different patterns
    if (pattern === 'sos') {
      // Don't await - let it play in background
      playSOSPattern();
      return json({ 
        success: true, 
        message: 'Playing SOS pattern',
        pattern: 'SOS',
        method: 'simple'
      });
    } else if (pattern === 'test') {
      // Play test sequence with both methods
      setTimeout(async () => {
        console.log('Testing simple method:');
        await passiveBuzzerBeep(200);  // Short
        await new Promise(r => setTimeout(r, 300));
        await passiveBuzzerBeep(400);  // Medium
        await new Promise(r => setTimeout(r, 300));
        await passiveBuzzerBeep(600);  // Long
        
        await new Promise(r => setTimeout(r, 500));
        
        console.log('Testing tone method:');
        await toneBuzzerBeep(200, 800);   // Low tone
        await new Promise(r => setTimeout(r, 300));
        await toneBuzzerBeep(200, 1500);  // Medium tone
        await new Promise(r => setTimeout(r, 300));
        await toneBuzzerBeep(200, 2500);  // High tone
      }, 0);
      
      return json({ 
        success: true, 
        message: 'Playing test sequence with both methods',
        pattern: 'test'
      });
    } else if (method === 'tone') {
      // Use tone generation method
      await toneBuzzerBeep(duration, frequency);
      return json({ 
        success: true, 
        message: `Tone beeped for ${duration}ms at ${frequency}Hz`,
        duration,
        frequency,
        gpio: 76,
        method: 'tone'
      });
    } else {
      // Default simple beep
      await passiveBuzzerBeep(duration);
      return json({ 
        success: true, 
        message: `Beeped for ${duration}ms`,
        duration,
        gpio: 76,
        method: 'simple'
      });
    }
  } catch (error) {
    console.error('✗ Buzzer error:', error);
    const errorMessage = (error && typeof error === 'object' && 'message' in error)
      ? (error as { method: string }).message
      : String(error);
    return json({ success: false, error: errorMessage }, { status: 500 });
  }
};

// Cleanup on process exit
process?.on?.('exit', () => {
  if (buzzer) {
    console.log('🧹 Cleaning up buzzer on exit');
    buzzer.writeSync(1); // Turn OFF (HIGH for PNP)
    buzzer.unexport();
  }
});

process?.on?.('SIGINT', () => {
  if (buzzer) {
    console.log('🧹 Cleaning up buzzer on SIGINT');
    buzzer.writeSync(1); // Turn OFF (HIGH for PNP)
    buzzer.unexport();
  }
  process.exit();
});