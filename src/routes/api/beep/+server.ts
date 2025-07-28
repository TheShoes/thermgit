// src/routes/api/beep/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';

let buzzer: any = null;
let isBeeping = false;

// Initialize GPIO only on server-side
if (typeof process !== 'undefined' && process.versions?.node) {
  try {
    const { Gpio } = require('onoff');
    buzzer = new Gpio(76, 'out'); // Changed to GPIO 76 for passive buzzer
    buzzer.writeSync(0); // Start LOW
    console.log('Passive buzzer initialized on GPIO 76');
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error) {
      console.log('GPIO not available:', (error as { message: string }).message);
    } else {
      console.log('GPIO not available:', error);
    }
    buzzer = null; // Ensure buzzer is null on error
  }
}

// Function to create PWM signal for passive buzzer
function passiveBuzzerBeep(duration: number = 1000, frequency: number = 1000): Promise<void> {
  return new Promise((resolve) => {
    if (!buzzer || isBeeping) {
      console.log('Buzzer not available or already beeping');
      resolve();
      return;
    }

    isBeeping = true;
    console.log(`Beeping at ${frequency}Hz for ${duration}ms`);

    // Calculate half period in milliseconds (for PWM)
    const halfPeriodMs = Math.round(500 / frequency);
    
    let state = 0;
    const startTime = Date.now();

    // Create PWM by toggling GPIO rapidly
    const interval = setInterval(() => {
      if (Date.now() - startTime >= duration) {
        // Stop beeping
        clearInterval(interval);
        buzzer.writeSync(0); // Ensure it ends LOW
        isBeeping = false;
        console.log('Beep finished');
        resolve();
        return;
      }

      // Toggle state to create PWM
      state = state === 0 ? 1 : 0;
      buzzer.writeSync(state);
    }, halfPeriodMs);
  });
}

// Function for SOS pattern
function playSOSPattern(): Promise<void> {
  return new Promise(async (resolve) => {
    console.log('Playing SOS pattern...');
    
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
      
      console.log('SOS complete');
      resolve();
    } catch (error) {
      console.error('SOS pattern error:', error);
      resolve();
    }
  });
}

export const POST: RequestHandler = async ({ url }) => {
  try {
    if (!buzzer) {
      return json({ success: false, message: 'Buzzer not available' });
    }

    // Get parameters from request
    const duration = parseInt(url.searchParams.get('duration') || '1000');
    const frequency = parseInt(url.searchParams.get('frequency') || '1000');
    const pattern = url.searchParams.get('pattern');

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
    console.error('Buzzer error:', error);
    const errorMessage = (error && typeof error === 'object' && 'message' in error)
      ? (error as { message: string }).message
      : String(error);
    return json({ success: false, error: errorMessage }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    if (!buzzer) {
      return json({ success: false, message: 'Buzzer not available' });
    }

    // Get parameters from URL query
    const duration = parseInt(url.searchParams.get('duration') || '500');
    const frequency = parseInt(url.searchParams.get('frequency') || '1000');
    const pattern = url.searchParams.get('pattern');

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
    console.error('Buzzer error:', error);
    const errorMessage = (error && typeof error === 'object' && 'message' in error)
      ? (error as { message: string }).message
      : String(error);
    return json({ success: false, error: errorMessage }, { status: 500 });
  }
};

// Cleanup on process exit
if (typeof process !== 'undefined' && process.versions?.node && buzzer) {
  process.on('exit', () => {
    if (buzzer) {
      buzzer.writeSync(0);
      buzzer.unexport();
    }
  });
  
  process.on('SIGINT', () => {
    if (buzzer) {
      buzzer.writeSync(0);
      buzzer.unexport();
    }
    process.exit();
  });
}