// src/routes/api/beep/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';

let buzzer: any = null;

// Initialize GPIO only on server-side
if (typeof process !== 'undefined' && process.versions?.node) {
  try {
    const { Gpio } = require('onoff');
    buzzer = new Gpio(18, 'out');
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error) {
      console.log('GPIO not available:', (error as { message: string }).message);
    } else {
      console.log('GPIO not available:', error);
    }
  }
}

export const POST: RequestHandler = async () => {
  try {
    if (buzzer) {
      // Make a beep sound
      buzzer.writeSync(1); // Turn on buzzer
      setTimeout(() => {
        buzzer.writeSync(0); // Turn off buzzer
      }, 200); // 200ms beep duration
      
      return json({ success: true, message: 'Beep!' });
    } else {
      return json({ success: false, message: 'Buzzer not available' });
    }
  } catch (error) {
    console.error('Buzzer error:', error);
    const errorMessage = (error && typeof error === 'object' && 'message' in error)
      ? (error as { message: string }).message
      : String(error);
    return json({ success: false, error: errorMessage }, { status: 500 });
  }
};