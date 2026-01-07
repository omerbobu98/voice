// API Configuration
// In development: uses localhost
// In production: uses VITE_API_URL environment variable

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
