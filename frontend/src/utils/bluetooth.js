/**
 * StationAI Bluetooth and Audio Connectivity Driver
 * Coordinates Shokz OpenComm 2 pairings, auto-reconnections, and fallbacks.
 */

class BluetoothAudioDriver {
  constructor() {
    this.device = null;
    this.connected = false;
    this.autoReconnect = true;
    this.connectionListeners = [];
    this.reconnectTimer = null;
  }

  // Add listeners to notify UI screens of connection status
  onStatusChange(callback) {
    this.connectionListeners.push(callback);
    callback(this.connected);
  }

  notifyListeners() {
    this.connectionListeners.forEach(cb => cb(this.connected));
  }

  /**
   * Scans and pairs a Bluetooth headset (optimized for Shokz OpenComm 2).
   * Web Bluetooth API compatible.
   */
  async pairHeadset() {
    console.log("Scanning for Shokz headset devices...");
    try {
      // In mobile Native React Native: uses react-native-ble-plx.
      // In Web browsers: uses navigator.bluetooth.requestDevice.
      if (typeof navigator !== 'undefined' && navigator.bluetooth) {
        this.device = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: 'Shokz' },
            { namePrefix: 'OpenComm' }
          ],
          optionalServices: ['battery_service', 'device_information']
        });
        
        // Connect to GATT Server
        const server = await this.device.gatt.connect();
        this.connected = true;
        this.notifyListeners();
        
        // Play audio chime beep to verify connection
        this.playConnectionBeep();
        
        // Listen for disconnect events to trigger range auto-reconnection
        this.device.addEventListener('gattserverdisconnected', () => this.handleDisconnect());
        return { success: true, name: this.device.name };
      } else {
        // Mock connection simulation for prototype demonstration
        await new Promise(resolve => setTimeout(resolve, 800));
        this.connected = true;
        this.notifyListeners();
        this.playConnectionBeep();
        return { success: true, name: "Shokz OpenComm 2 (Demonstration)" };
      }
    } catch (error) {
      console.warn("Bluetooth pairing failed: ", error);
      this.connected = false;
      this.notifyListeners();
      throw new Error("Pairing failed. Ensure headset is in pairing mode.");
    }
  }

  /**
   * Handles unexpected disconnects, attempting to auto-reconnect within 10 seconds.
   */
  handleDisconnect() {
    this.connected = false;
    this.notifyListeners();
    console.warn("Headset disconnected. Reconnect sequence initiated...");

    if (this.autoReconnect) {
      // Prompt phone speaker fallback immediately while scanning
      this.triggerPhoneSpeakerFallback();
      
      // Attempt reconnection every 3 seconds, up to 10 seconds total
      let attempts = 0;
      this.reconnectTimer = setInterval(async () => {
        attempts++;
        console.log(`Auto-reconnection attempt #${attempts}...`);
        
        if (attempts > 3) {
          clearInterval(this.reconnectTimer);
          console.warn("Headset auto-reconnection timed out. Trainee remains on phone speaker.");
          return;
        }

        try {
          if (this.device && this.device.gatt) {
            await this.device.gatt.connect();
            clearInterval(this.reconnectTimer);
            this.connected = true;
            this.notifyListeners();
            this.playConnectionBeep();
            console.info("Headset auto-reconnected successfully!");
          }
        } catch (e) {
          // Retry
        }
      }, 3000);
    }
  }

  /**
   * Emits a standard verification chime to the paired headset.
   */
  playConnectionBeep() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitched A5 pitch beep
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15); // Beep for 150ms
      } catch (e) {
        console.warn("Audio Context beep failed: ", e);
      }
    }
  }

  triggerPhoneSpeakerFallback() {
    console.log("Gracefully falling back to mobile phone speaker driver.");
  }

  disconnectHeadset() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.connected = false;
    this.notifyListeners();
  }
}

export const bluetoothDriver = new BluetoothAudioDriver();
export default bluetoothDriver;
