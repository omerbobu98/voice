/**
 * AudioWorklet Processor for Real-Time Audio Streaming
 * Much better performance than ScriptProcessorNode (deprecated)
 * 
 * Features:
 * - Lower latency processing
 * - Runs in separate audio thread
 * - Better noise gate for cleaner audio
 * - Real-time gain control
 */

class AudioStreamProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferSize = 1600 // 100ms at 16kHz
    this.buffer = new Float32Array(0)
    this.sampleRate = 16000
    this.sourceSampleRate = 48000 // Browser default
    this.gain = 4.0 // Amplification factor
    this.noiseGate = 0.01 // Noise threshold
    
    // Listen for configuration messages from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'config') {
        this.sourceSampleRate = event.data.sourceSampleRate || 48000
        this.gain = event.data.gain || 4.0
        this.noiseGate = event.data.noiseGate || 0.01
      }
    }
  }
  
  /**
   * Resample audio from source sample rate to target sample rate
   * Using linear interpolation for quality
   */
  resample(inputData, inputRate, outputRate) {
    const ratio = inputRate / outputRate
    const outputLength = Math.floor(inputData.length / ratio)
    const output = new Float32Array(outputLength)
    
    for (let i = 0; i < outputLength; i++) {
      const srcPos = i * ratio
      const srcIdx = Math.floor(srcPos)
      const frac = srcPos - srcIdx
      
      if (srcIdx + 1 < inputData.length) {
        // Linear interpolation
        output[i] = inputData[srcIdx] * (1 - frac) + inputData[srcIdx + 1] * frac
      } else {
        output[i] = inputData[srcIdx] || 0
      }
    }
    
    return output
  }
  
  /**
   * Apply noise gate - silence audio below threshold
   */
  applyNoiseGate(data) {
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) < this.noiseGate) {
        data[i] = 0
      }
    }
    return data
  }
  
  /**
   * Apply gain with soft clipping to prevent distortion
   */
  applyGain(data) {
    for (let i = 0; i < data.length; i++) {
      let sample = data[i] * this.gain
      // Soft clipping using tanh for smoother limiting
      if (Math.abs(sample) > 0.8) {
        sample = Math.tanh(sample)
      }
      data[i] = Math.max(-1, Math.min(1, sample))
    }
    return data
  }
  
  /**
   * Main processing function - called for each audio frame
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0]
    if (!input || !input[0] || input[0].length === 0) {
      return true
    }
    
    const inputData = input[0]
    
    // Apply gain
    const gained = this.applyGain(new Float32Array(inputData))
    
    // Apply noise gate
    const gated = this.applyNoiseGate(gained)
    
    // Resample to 16kHz
    const resampled = this.resample(gated, this.sourceSampleRate, this.sampleRate)
    
    // Accumulate in buffer
    const newBuffer = new Float32Array(this.buffer.length + resampled.length)
    newBuffer.set(this.buffer)
    newBuffer.set(resampled, this.buffer.length)
    this.buffer = newBuffer
    
    // Send chunks when we have enough data
    while (this.buffer.length >= this.bufferSize) {
      const chunk = this.buffer.slice(0, this.bufferSize)
      this.buffer = this.buffer.slice(this.bufferSize)
      
      // Convert to Int16 PCM
      const pcmData = new Int16Array(chunk.length)
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]))
        pcmData[i] = Math.round(s * 32767)
      }
      
      // Send to main thread
      this.port.postMessage({
        type: 'audio',
        pcmData: pcmData.buffer
      }, [pcmData.buffer])
    }
    
    return true
  }
}

registerProcessor('audio-stream-processor', AudioStreamProcessor)
