/**
 * Cross-Device Audio Utilities
 * Handles audio recording and playback for iOS, iPad, and Desktop
 * 
 * Key Features:
 * - iOS Safari compatible MediaRecorder (uses audio/mp4)
 * - Proper AudioContext handling for iOS (suspended state)
 * - User gesture-aware audio playback
 * - Unified TTS with OpenAI API + browser fallback
 * - Professional quality audio settings
 */

import axios from 'axios'
import { API_URL } from './config'

// ============================================
// DEVICE DETECTION
// ============================================

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// ============================================
// AUDIO CONTEXT MANAGEMENT
// ============================================

let globalAudioContext = null
let audioContextResumed = false

/**
 * Get or create a global AudioContext
 * Handles iOS suspended state properly
 */
export const getAudioContext = async () => {
  if (!globalAudioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      throw new Error('AudioContext not supported')
    }
    globalAudioContext = new AudioContextClass()
  }
  
  // Resume if suspended (required for iOS)
  if (globalAudioContext.state === 'suspended') {
    try {
      await globalAudioContext.resume()
      audioContextResumed = true
      console.log('🔊 AudioContext resumed successfully')
    } catch (err) {
      console.warn('⚠️ Could not resume AudioContext:', err)
    }
  }
  
  return globalAudioContext
}

/**
 * Resume AudioContext on user interaction
 * Call this on any user gesture (click, touch) to enable audio on iOS
 */
export const resumeAudioContext = async () => {
  if (globalAudioContext && globalAudioContext.state === 'suspended') {
    try {
      await globalAudioContext.resume()
      audioContextResumed = true
      console.log('🔊 AudioContext resumed on user gesture')
    } catch (err) {
      console.warn('⚠️ Could not resume AudioContext:', err)
    }
  }
}

/**
 * Initialize audio on first user interaction
 * Add this to a click/touch handler to enable audio on iOS
 */
export const initAudioOnUserGesture = () => {
  const initAudio = async () => {
    await getAudioContext()
    // Also "unlock" HTML5 Audio on iOS by playing a silent sound
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
    silentAudio.volume = 0.001
    try {
      await silentAudio.play()
      silentAudio.pause()
      console.log('🔓 Audio unlocked for iOS')
    } catch (e) {
      // Silent fail - this is expected if not in user gesture
    }
    // Remove listeners after first interaction
    document.removeEventListener('click', initAudio)
    document.removeEventListener('touchstart', initAudio)
  }
  
  document.addEventListener('click', initAudio, { once: true })
  document.addEventListener('touchstart', initAudio, { once: true })
}

// ============================================
// MEDIA RECORDER UTILITIES
// ============================================

/**
 * Get the best supported MIME type for recording
 * iOS Safari requires audio/mp4 or audio/aac
 */
export const getSupportedMimeType = () => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/wav'
  ]
  
  // On iOS, prefer mp4/aac
  if (isIOS()) {
    const iosTypes = ['audio/mp4', 'audio/aac', 'audio/wav']
    for (const type of iosTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`📱 iOS: Using ${type} for recording`)
        return type
      }
    }
  }
  
  // For other platforms, find the first supported type
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log(`🎤 Using ${type} for recording`)
      return type
    }
  }
  
  console.warn('⚠️ No supported MIME type found, using default')
  return ''
}

/**
 * Get file extension from MIME type
 */
export const getFileExtension = (mimeType) => {
  const extensions = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/ogg': 'ogg',
    'audio/ogg;codecs=opus': 'ogg',
    'audio/wav': 'wav'
  }
  return extensions[mimeType] || 'webm'
}

/**
 * Create a cross-platform MediaRecorder
 * Returns { recorder, mimeType, stream }
 */
export const createMediaRecorder = async (options = {}) => {
  const constraints = {
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: isIOS() ? 44100 : 48000, // iOS prefers 44.1kHz
      ...options.audioConstraints
    }
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    const mimeType = getSupportedMimeType()
    
    const recorderOptions = mimeType ? { mimeType } : {}
    const recorder = new MediaRecorder(stream, recorderOptions)
    
    console.log(`✅ MediaRecorder created with ${recorder.mimeType || 'default'} MIME type`)
    
    return {
      recorder,
      mimeType: recorder.mimeType || mimeType,
      stream
    }
  } catch (err) {
    console.error('❌ Error creating MediaRecorder:', err)
    throw err
  }
}

/**
 * Stop all tracks in a stream
 */
export const stopStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop()
      console.log(`🛑 Stopped track: ${track.kind}`)
    })
  }
}

// ============================================
// AUDIO PLAYBACK UTILITIES
// ============================================

/**
 * Create and play audio with proper iOS handling
 * Returns a promise that resolves when playback starts
 */
export const playAudioUrl = async (url, options = {}) => {
  const {
    volume = 1,
    onEnded = () => {},
    onError = () => {},
    onTimeUpdate = () => {},
    onLoadedMetadata = () => {}
  } = options
  
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    
    // Set properties before loading
    audio.volume = volume
    audio.preload = 'auto'
    
    // For iOS - set playsinline
    audio.setAttribute('playsinline', 'true')
    audio.setAttribute('webkit-playsinline', 'true')
    
    // Event handlers
    audio.onended = () => {
      onEnded()
      resolve({ completed: true })
    }
    
    audio.onerror = (e) => {
      console.error('❌ Audio playback error:', e)
      onError(e)
      reject(e)
    }
    
    audio.ontimeupdate = () => {
      onTimeUpdate(audio.currentTime, audio.duration)
    }
    
    audio.onloadedmetadata = () => {
      onLoadedMetadata(audio.duration)
    }
    
    // Set source and try to play
    audio.src = url
    
    // Use play() with promise handling
    const playPromise = audio.play()
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('▶️ Audio playback started')
          resolve({ audio, playing: true })
        })
        .catch(err => {
          console.error('❌ Audio play() failed:', err)
          // On iOS, this often fails if not triggered by user gesture
          if (err.name === 'NotAllowedError') {
            console.warn('⚠️ Audio blocked - requires user interaction')
          }
          onError(err)
          reject(err)
        })
    } else {
      resolve({ audio, playing: true })
    }
  })
}

/**
 * Create an Audio element for later playback
 * Use this when you need control over when playback starts
 */
export const createAudioElement = (url) => {
  const audio = new Audio()
  audio.preload = 'auto'
  audio.setAttribute('playsinline', 'true')
  audio.setAttribute('webkit-playsinline', 'true')
  audio.src = url
  return audio
}

/**
 * Play an audio element with proper error handling
 * Returns promise that resolves when playback starts
 */
export const playAudioElement = async (audioElement) => {
  if (!audioElement) {
    throw new Error('No audio element provided')
  }
  
  // Resume AudioContext if needed (iOS)
  await resumeAudioContext()
  
  try {
    await audioElement.play()
    console.log('▶️ Audio element playback started')
    return true
  } catch (err) {
    console.error('❌ Audio element play() failed:', err)
    if (err.name === 'NotAllowedError') {
      console.warn('⚠️ Playback blocked - requires user gesture')
    }
    throw err
  }
}

// ============================================
// TEXT-TO-SPEECH UTILITIES
// ============================================

/**
 * Play text using OpenAI TTS API with browser fallback
 * This is the recommended way to play TTS across all devices
 */
export const playTTS = async (text, options = {}) => {
  const {
    voice = 'nova',
    hd = true,
    speed = 0.9,
    onStart = () => {},
    onEnd = () => {},
    onError = () => {},
    authHeaders = {}
  } = options
  
  if (!text || !text.trim()) {
    console.warn('⚠️ Empty text provided to TTS')
    return null
  }
  
  try {
    // Try OpenAI TTS first
    const response = await axios.post(`${API_URL}/api/tts`, {
      text: text.trim(),
      voice,
      hd,
      speed
    }, { headers: authHeaders })
    
    if (response.data?.audio_url) {
      const audioUrl = `${API_URL}${response.data.audio_url}`
      console.log('🔊 Playing OpenAI TTS audio')
      
      onStart()
      
      const audio = createAudioElement(audioUrl)
      audio.onended = onEnd
      audio.onerror = (e) => {
        console.error('❌ TTS audio error:', e)
        onError(e)
        // Try browser fallback on error
        playBrowserTTS(text, { onStart, onEnd, onError })
      }
      
      try {
        await playAudioElement(audio)
        return audio
      } catch (playErr) {
        // If play fails, try browser TTS
        console.warn('⚠️ OpenAI TTS playback failed, trying browser TTS')
        return playBrowserTTS(text, { onStart, onEnd, onError })
      }
    }
  } catch (err) {
    console.warn('⚠️ OpenAI TTS failed, falling back to browser TTS:', err.message)
  }
  
  // Fallback to browser TTS
  return playBrowserTTS(text, { onStart, onEnd, onError })
}

/**
 * Play text using browser's SpeechSynthesis API
 * Used as fallback when OpenAI TTS is unavailable
 */
export const playBrowserTTS = (text, options = {}) => {
  const {
    lang = 'en-US',
    rate = 0.9,
    pitch = 1,
    volume = 1,
    onStart = () => {},
    onEnd = () => {},
    onError = () => {}
  } = options
  
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.error('❌ SpeechSynthesis not supported')
      onError(new Error('SpeechSynthesis not supported'))
      reject(new Error('SpeechSynthesis not supported'))
      return
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(lang.split('-')[0]) && v.localService === false
    ) || voices.find(v => v.lang.startsWith(lang.split('-')[0]))
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    utterance.onstart = () => {
      console.log('🗣️ Browser TTS started')
      onStart()
    }
    
    utterance.onend = () => {
      console.log('✅ Browser TTS ended')
      onEnd()
      resolve()
    }
    
    utterance.onerror = (e) => {
      console.error('❌ Browser TTS error:', e)
      onError(e)
      reject(e)
    }
    
    // iOS Safari bug workaround - need small delay
    setTimeout(() => {
      window.speechSynthesis.speak(utterance)
    }, 10)
    
    // iOS Safari bug - speech can stop after ~15 seconds
    // This workaround keeps it alive
    if (isIOS()) {
      const keepAlive = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(keepAlive)
          return
        }
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }, 14000)
      
      utterance.onend = () => {
        clearInterval(keepAlive)
        onEnd()
        resolve()
      }
    }
  })
}

/**
 * Stop any ongoing TTS playback
 */
export const stopTTS = () => {
  window.speechSynthesis.cancel()
}

// ============================================
// AUDIO RECORDING HELPER CLASS
// ============================================

/**
 * CrossDeviceRecorder - A helper class for cross-platform audio recording
 * 
 * Usage:
 * const recorder = new CrossDeviceRecorder()
 * await recorder.start()
 * const blob = await recorder.stop()
 */
export class CrossDeviceRecorder {
  constructor(options = {}) {
    this.onDataAvailable = options.onDataAvailable || (() => {})
    this.onStop = options.onStop || (() => {})
    this.onError = options.onError || (() => {})
    this.onStart = options.onStart || (() => {})
    
    this.recorder = null
    this.stream = null
    this.mimeType = null
    this.chunks = []
    this.isRecording = false
  }
  
  async start() {
    try {
      const { recorder, mimeType, stream } = await createMediaRecorder()
      
      this.recorder = recorder
      this.stream = stream
      this.mimeType = mimeType
      this.chunks = []
      
      this.recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data)
          this.onDataAvailable(e.data)
        }
      }
      
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType })
        this.onStop(blob, this.mimeType)
        stopStream(this.stream)
      }
      
      this.recorder.onerror = (e) => {
        console.error('❌ Recorder error:', e)
        this.onError(e)
      }
      
      // Use timeslice for more frequent data (better for streaming)
      this.recorder.start(100) // Get data every 100ms
      this.isRecording = true
      this.onStart()
      
      console.log('🎤 Recording started')
      return true
    } catch (err) {
      console.error('❌ Failed to start recording:', err)
      this.onError(err)
      throw err
    }
  }
  
  stop() {
    return new Promise((resolve) => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        resolve(null)
        return
      }
      
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType })
        stopStream(this.stream)
        this.isRecording = false
        this.onStop(blob, this.mimeType)
        console.log('🛑 Recording stopped')
        resolve(blob)
      }
      
      this.recorder.stop()
    })
  }
  
  pause() {
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.pause()
      console.log('⏸️ Recording paused')
    }
  }
  
  resume() {
    if (this.recorder && this.recorder.state === 'paused') {
      this.recorder.resume()
      console.log('▶️ Recording resumed')
    }
  }
  
  getBlob() {
    return new Blob(this.chunks, { type: this.mimeType })
  }
  
  getFileExtension() {
    return getFileExtension(this.mimeType)
  }
}

// ============================================
// INITIALIZATION
// ============================================

// Auto-initialize audio on first user interaction
if (typeof window !== 'undefined') {
  initAudioOnUserGesture()
}

export default {
  // Device detection
  isIOS,
  isSafari,
  isMobile,
  
  // AudioContext
  getAudioContext,
  resumeAudioContext,
  initAudioOnUserGesture,
  
  // MediaRecorder
  getSupportedMimeType,
  getFileExtension,
  createMediaRecorder,
  stopStream,
  CrossDeviceRecorder,
  
  // Audio playback
  playAudioUrl,
  createAudioElement,
  playAudioElement,
  
  // TTS
  playTTS,
  playBrowserTTS,
  stopTTS
}
