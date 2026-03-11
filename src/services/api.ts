import axios from "axios"
import { Incident, ApiResponse } from "../types"

// Création d'une instance axios
const api = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
})

// Fonction pour envoyer un incident
export const submitIncident = async (
  data: Incident
): Promise<ApiResponse<any>> => {
  try {

    const response = await api.post("/posts", data)

    return {
      success: true,
      data: response.data
    }

  } catch (error: any) {

    return {
      success: false,
      error: error.message || "Erreur inconnue"
    }

  }
}