<<<<<<< HEAD
=======
export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Incident = {
  id?: string;
  description: string;
  photoUri: string;
  location: Coordinates;
  timestamp: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

>>>>>>> 33413da8c315e01b6702cad332c74326ad3f60a3
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
<<<<<<< HEAD
}
=======
}

>>>>>>> 33413da8c315e01b6702cad332c74326ad3f60a3
