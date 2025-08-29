
import { Language } from '../i18n';

/**
 * Realiza geocodificación inversa para obtener una dirección a partir de coordenadas GPS.
 * Utiliza la API Nominatim de OpenStreetMap.
 * @param latitude - La latitud.
 * @param longitude - La longitud.
 * @param lang - El código de idioma para la respuesta.
 * @returns Una promesa que se resuelve con la dirección formateada como string, o null si falla.
 */
export const reverseGeocode = async (latitude: number, longitude: number, lang: Language): Promise<string | null> => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept-Language': `${lang},en;q=0.9`,
            },
        });

        if (!response.ok) {
            console.error(`Error en la API de geocodificación: ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (data && data.display_name) {
            return data.display_name;
        } else {
            console.warn("La respuesta de geocodificación no contiene 'display_name'.", data);
            return "No se pudo determinar la dirección exacta.";
        }
    } catch (error) {
        console.error("Error al realizar la geocodificación inversa:", error);
        return null;
    }
};

/**
 * Realiza geocodificación para obtener coordenadas a partir de un nombre de lugar.
 * Utiliza la API Nominatim de OpenStreetMap.
 * @param locationName - El nombre del lugar a buscar.
 * @param lang - El código de idioma para la respuesta.
 * @returns Una promesa que se resuelve con las coordenadas {lat, lon}, o null si falla.
 */
export const geocodeLocationName = async (locationName: string, lang: Language): Promise<{ lat: string; lon: string } | null> => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept-Language': `${lang},en;q=0.9`,
            },
        });

        if (!response.ok) {
            console.error(`Error en la API de geocodificación: ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0 && data[0].lat && data[0].lon) {
            return { lat: data[0].lat, lon: data[0].lon };
        } else {
            console.warn("La respuesta de geocodificación no contiene coordenadas válidas.", data);
            return null;
        }
    } catch (error) {
        console.error("Error al realizar la geocodificación:", error);
        return null;
    }
};
