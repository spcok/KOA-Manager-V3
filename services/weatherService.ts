
// Using Open-Meteo (Free, No Key Required)
// Defaulting to Kent, UK coordinates
const LAT = 51.2787;
const LON = 0.5217;

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  humidity: number;
  pressure: number;
  description: string;
}

export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  precipProb: number;
  description: string;
  sunrise: string;
  sunset: string;
  uvIndex: number;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  weatherCode: number;
  precipProb: number;
  description: string;
  windSpeed: number;
  windDirection: number;
  windGust: number;
}

export interface FullWeatherData {
  current: WeatherData;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  isStale?: boolean;
}

export interface RegionalLocation {
    name: string;
    lat: number;
    lon: number;
    isBase?: boolean;
}

export interface RegionalWeatherData {
    location: RegionalLocation;
    temp: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
    description: string;
}

// Cache mechanism
let weatherCache: {
    data: FullWeatherData | null;
    timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const getWeatherDescription = (code: number): string => {
  if (code === 0) return 'Clear sky';
  if (code >= 1 && code <= 3) return 'Partly cloudy';
  if (code >= 45 && code <= 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Overcast';
};

export const getCurrentWeather = async (): Promise<WeatherData | null> => {
  const fullData = await getFullWeather();
  return fullData ? fullData.current : null;
};

export const getRegionalWeather = async (locations: RegionalLocation[]): Promise<RegionalWeatherData[]> => {
    if (locations.length === 0) return [];
    
    try {
        const lats = locations.map(l => l.lat).join(',');
        const lons = locations.map(l => l.lon).join(',');
        
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&wind_speed_unit=mph&timezone=auto`
        );

        if (!response.ok) throw new Error('Regional weather fetch failed');
        const data = await response.json();

        // Open-Meteo returns array of results if multiple coords, or single object if one.
        // However, the "batch" format is actually a list of response objects if sent as bulk, 
        // BUT standard comma separation actually returns single object with arrays for values.
        
        const results: RegionalWeatherData[] = [];
        
        // Handle the array-based response structure from comma-separated query
        if (data.current) {
             // If only one location, it returns scalars, if multiple, it returns arrays? 
             // Actually Open-Meteo returns an array of objects if multiple coords are requested via multiple params,
             // but comma separated is treated as a list.
             // Let's verify structure: It returns an array of response objects.
             const dataArray = Array.isArray(data) ? data : [data];
             
             dataArray.forEach((d: any, index: number) => {
                 if (index < locations.length) {
                     results.push({
                         location: locations[index],
                         temp: d.current.temperature_2m,
                         weatherCode: d.current.weather_code,
                         windSpeed: d.current.wind_speed_10m,
                         windDirection: d.current.wind_direction_10m,
                         description: getWeatherDescription(d.current.weather_code)
                     });
                 }
             });
        } else if (Array.isArray(data)) {
             data.forEach((d: any, index: number) => {
                 if (index < locations.length && d.current) {
                     results.push({
                         location: locations[index],
                         temp: d.current.temperature_2m,
                         weatherCode: d.current.weather_code,
                         windSpeed: d.current.wind_speed_10m,
                         windDirection: d.current.wind_direction_10m,
                         description: getWeatherDescription(d.current.weather_code)
                     });
                 }
             });
        }

        return results;
    } catch (e) {
        console.error("Regional Weather Error", e);
        return [];
    }
};

export const getFullWeather = async (): Promise<FullWeatherData | null> => {
  const now = Date.now();
  
  // Return cache if it's still fresh
  if (weatherCache.data && (now - weatherCache.timestamp < CACHE_DURATION)) {
      return weatherCache.data;
  }

  // Check for basic connectivity
  if (!navigator.onLine) {
    console.warn("Weather: Device is offline. Using cached data.");
    if (weatherCache.data) {
        return { ...weatherCache.data, isStale: true };
    }
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    // Updated URL to include wind_gusts_10m in both current and hourly
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,relative_humidity_2m,surface_pressure&wind_speed_unit=mph&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error(`Weather API responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.current || !data.daily || !data.hourly) {
        throw new Error("Weather API returned incomplete data structure.");
    }

    const current: WeatherData = {
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      windGust: data.current.wind_gusts_10m,
      windDirection: data.current.wind_direction_10m,
      humidity: data.current.relative_humidity_2m,
      pressure: data.current.surface_pressure,
      description: getWeatherDescription(data.current.weather_code)
    };

    const daily: DailyForecast[] = data.daily.time.map((time: string, index: number) => ({
      date: time,
      maxTemp: data.daily.temperature_2m_max[index],
      minTemp: data.daily.temperature_2m_min[index],
      weatherCode: data.daily.weather_code[index],
      precipProb: data.daily.precipitation_probability_max[index],
      description: getWeatherDescription(data.daily.weather_code[index]),
      sunrise: data.daily.sunrise[index],
      sunset: data.daily.sunset[index],
      uvIndex: data.daily.uv_index_max[index]
    }));

    const hourly: HourlyForecast[] = data.hourly.time.map((time: string, index: number) => {
        return {
            time: time,
            temp: data.hourly.temperature_2m[index],
            weatherCode: data.hourly.weather_code[index],
            precipProb: data.hourly.precipitation_probability[index],
            description: getWeatherDescription(data.hourly.weather_code[index]),
            windSpeed: data.hourly.wind_speed_10m[index],
            windDirection: data.hourly.wind_direction_10m[index],
            windGust: data.hourly.wind_gusts_10m[index]
        };
    });

    const result = { current, daily, hourly, isStale: false };
    
    // Update cache
    weatherCache = {
        data: result,
        timestamp: now
    };

    return result;
  } catch (error: any) {
    console.error("Weather Service Error:", error.message || error);
    
    // Fallback to cache on error
    if (weatherCache.data) {
        console.info("Weather: API error, serving last cached data.");
        return { ...weatherCache.data, isStale: true };
    }
    return null;
  }
};
