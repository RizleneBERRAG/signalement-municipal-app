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