const { Gpio } = require('onoff');

console.log('Testing GPIO 76...');

try {
  const buzzer = new Gpio(76, 'out');
  console.log('GPIO 76 initialized successfully');
  
  // Quick beep test
  let state = 0;
  let count = 0;
  const interval = setInterval(() => {
    state = state === 0 ? 1 : 0;
    buzzer.writeSync(state);
    count++;
    
    if (count > 2000) {
      clearInterval(interval);
      buzzer.writeSync(0);
      buzzer.unexport();
      console.log('Test complete!');
    }
  }, 1);
  
} catch (error) {
  console.error('GPIO error:', error.message);
}
EOF

