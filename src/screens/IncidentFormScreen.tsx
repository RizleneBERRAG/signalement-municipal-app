import { useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import * as Calendar from "expo-calendar";
import { submitIncident } from "../services/api";
import { Coordinates, Incident } from "../types";

export default function IncidentFormScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Autorisation nécessaire</Text>
        <Text style={styles.permissionText}>
          L’application a besoin d’accéder à la caméra pour signaler un incident.
        </Text>

        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Autoriser la caméra</Text>
        </Pressable>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();

      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setShowCamera(false);
      }
    } catch (error) {
      console.error("Erreur photo :", error);
      Alert.alert("Erreur", "Impossible de prendre la photo.");
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission refusée", "La localisation a été refusée.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error("Erreur localisation :", error);
      Alert.alert("Erreur", "Impossible de récupérer la position.");
    }
  };

  const addEventToCalendar = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission refusée", "L'accès au calendrier a été refusé.");
      return;
    }

    const defaultCalendar = await Calendar.getDefaultCalendarAsync();

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    await Calendar.createEventAsync(defaultCalendar.id, {
      title: "🔧 Suivi Intervention",
      startDate,
      endDate,
      notes: description || "Incident municipal signalé.",
      location: location
        ? `${location.latitude}, ${location.longitude}`
        : undefined,
      timeZone: "Europe/Paris",
    });
  };

  const handleSubmit = async () => {
    if (!photoUri || !location) {
      Alert.alert(
        "Champs manquants",
        "La photo et la position GPS sont obligatoires."
      );
      return;
    }

    const incident: Incident = {
      description,
      photoUri,
      location,
      timestamp: Date.now(),
    };

    try {
      setLoading(true);

      const response = await submitIncident(incident);
      console.log("Réponse serveur :", response);

      if (!response.success) {
        throw new Error(response.error || "Erreur réseau");
      }

      await addEventToCalendar();

      Alert.alert("Succès", "Incident envoyé avec succès.");

      setDescription("");
      setPhotoUri(null);
      setLocation(null);
    } catch (error) {
      console.error("Erreur envoi :", error);
      Alert.alert("Erreur", "Impossible d'envoyer l'incident.");
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} />

        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraTitle}>Mode Caméra</Text>

          <View style={styles.cameraActions}>
            <Pressable style={styles.primaryButton} onPress={takePhoto}>
              <Text style={styles.primaryButtonText}>Prendre la photo</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.secondaryButtonText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Signalement Municipal</Text>
          <Text style={styles.subtitle}>
            Photographiez, localisez et transmettez un incident terrain.
          </Text>
        </View>

        <View style={styles.actionsBlock}>
          <Pressable
            style={[styles.actionButton, styles.actionButtonBlue]}
            onPress={() => setShowCamera(true)}
          >
            <Text style={styles.actionButtonText}>📷 Ouvrir la caméra</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.actionButtonGreen]}
            onPress={getLocation}
          >
            <Text style={styles.actionButtonText}>📍 Récupérer la position GPS</Text>
          </Pressable>
        </View>

        {photoUri && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Preuve photo</Text>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />

            <Pressable style={styles.secondaryButtonWide} onPress={retakePhoto}>
              <Text style={styles.secondaryButtonText}>Reprendre</Text>
            </Pressable>
          </View>
        )}

        {location && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Position GPS</Text>
            <Text style={styles.infoText}>Latitude : {location.latitude}</Text>
            <Text style={styles.infoText}>Longitude : {location.longitude}</Text>

            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={location}
                title="Lieu de l'incident"
                description="Position relevée"
              />
            </MapView>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Décrivez l’incident..."
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <Pressable
          style={[
            styles.actionButton,
            styles.actionButtonPurple,
            (!photoUri || !location || loading) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!photoUri || !location || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>📤 Envoyer le signalement</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#F4F7FB",
  },
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: "#F4F7FB",
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#162033",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#5B6475",
    textAlign: "center",
    lineHeight: 22,
  },
  actionsBlock: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  actionButtonBlue: {
    backgroundColor: "#377DFF",
  },
  actionButtonGreen: {
    backgroundColor: "#22B573",
  },
  actionButtonPurple: {
    backgroundColor: "#7A5AF8",
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#162033",
    marginBottom: 14,
  },
  infoText: {
    fontSize: 15,
    color: "#4C5565",
    marginBottom: 6,
  },
  previewImage: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    marginBottom: 14,
  },
  map: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    marginTop: 12,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#D7DCE5",
    borderRadius: 14,
    padding: 14,
    textAlignVertical: "top",
    backgroundColor: "#FAFBFD",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F4F7FB",
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#162033",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#5B6475",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#377DFF",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7DCE5",
  },
  secondaryButtonWide: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7DCE5",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#162033",
    fontSize: 16,
    fontWeight: "600",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cameraTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#162033",
    marginBottom: 14,
    textAlign: "center",
  },
  cameraActions: {
    gap: 10,
  },
});