// Coordonnées GPS d'un lieu
export interface Coordinates {
  latitude: number
  longitude: number
}

// Structure d’un incident signalé par un agent
export interface Incident {
  id?: string
  description: string
  photoUri: string
  location: Coordinates
  timestamp: number
}

// Réponse générique d'une API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}