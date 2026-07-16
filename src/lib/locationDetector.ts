/**
 * Location and Address detection utilities for task descriptions.
 */

// Regular expressions for detecting physical addresses and landmarks
const STREET_ADDRESS_REGEX = /\b\d{1,5}\s+[A-Za-z0-9\.\-\s]{2,40}\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct|parkway|pkwy|circle|cir|highway|hwy|plaza|plz|terrace|ter)\b/i;
const CITY_STATE_ZIP_REGEX = /\b[A-Za-z\s]{3,25},\s*[A-Z]{2}(?:\s+\d{5})?\b/i;
const EXPLICIT_AT_REGEX = /(?:located at|meet at|at|location:)\s*([^,;\.\n]{3,50})/i;

// Pre-mapped landmarks to provide extremely accurate simulated views
const KNOWN_LANDMARKS: Record<string, { lat: number; lng: number; displayName: string }> = {
  "googleplex": { lat: 37.4220, lng: -122.0841, displayName: "Googleplex, Mountain View, CA" },
  "1600 amphitheatre pkwy": { lat: 37.4220, lng: -122.0841, displayName: "1600 Amphitheatre Pkwy, Mountain View, CA" },
  "central park": { lat: 40.7851, lng: -73.9683, displayName: "Central Park, New York, NY" },
  "times square": { lat: 40.7580, lng: -73.9855, displayName: "Times Square, New York, NY" },
  "starbucks": { lat: 37.7749, lng: -122.4194, displayName: "Starbucks Coffee" },
  "golden gate bridge": { lat: 37.8199, lng: -122.4783, displayName: "Golden Gate Bridge, San Francisco, CA" },
  "disneyland": { lat: 33.8121, lng: -117.9190, displayName: "Disneyland Park, Anaheim, CA" },
  "seattle space needle": { lat: 47.6205, lng: -122.3493, displayName: "Space Needle, Seattle, WA" },
  "white house": { lat: 38.8977, lng: -77.0365, displayName: "The White House, Washington, DC" }
};

/**
 * Scans task text (title and description) to detect any potential address or location.
 * Returns the detected address string, or null if nothing is found.
 */
export function detectAddressInText(title: string = "", description: string = ""): string | null {
  const fullText = `${title}. ${description}`.trim();
  if (!fullText) return null;

  // 1. Check for known landmarks first
  const lowerText = fullText.toLowerCase();
  for (const landmark of Object.keys(KNOWN_LANDMARKS)) {
    if (lowerText.includes(landmark)) {
      return KNOWN_LANDMARKS[landmark].displayName;
    }
  }

  // 2. Check for explicit "at [location]" pattern
  const atMatch = fullText.match(EXPLICIT_AT_REGEX);
  if (atMatch && atMatch[1]) {
    const locCandidate = atMatch[1].trim();
    // Filter out generic time or activity words
    const filterWords = ["home", "work", "school", "office", "9", "10", "11", "12", "1", "2", "3", "4", "5", "6", "7", "8", "noon", "night", "morning"];
    if (!filterWords.includes(locCandidate.toLowerCase())) {
      return locCandidate;
    }
  }

  // 3. Check for typical street address pattern
  const streetMatch = fullText.match(STREET_ADDRESS_REGEX);
  if (streetMatch) {
    return streetMatch[0].trim();
  }

  // 4. Check for city, state pattern
  const cityStateMatch = fullText.match(CITY_STATE_ZIP_REGEX);
  if (cityStateMatch) {
    return cityStateMatch[0].trim();
  }

  return null;
}

/**
 * Returns deterministic coordinate mapping for testing and placeholders when real geocoding is unavailable.
 */
export function getDeterministicCoordinates(address: string): { lat: number; lng: number } {
  const cleaned = address.toLowerCase().trim();
  
  // See if there's a perfect known landmark
  for (const [landmark, coords] of Object.entries(KNOWN_LANDMARKS)) {
    if (cleaned.includes(landmark)) {
      return { lat: coords.lat, lng: coords.lng };
    }
  }

  // Generate deterministic coordinates in a realistic bounding box (e.g., around SF/Silicon Valley)
  // so that the placeholder map view changes subtly for different addresses.
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // SF/Silicon Valley bounds: Lat: 37.3 to 37.8, Lng: -122.0 to -122.5
  const latMin = 37.3;
  const latMax = 37.8;
  const lngMin = -122.5;
  const lngMax = -122.0;

  const latSpan = latMax - latMin;
  const lngSpan = lngMax - lngMin;

  const latOffset = Math.abs((hash % 1000) / 1000) * latSpan;
  const lngOffset = Math.abs(((hash >> 3) % 1000) / 1000) * lngSpan;

  return {
    lat: Number((latMin + latOffset).toFixed(4)),
    lng: Number((lngMin + lngOffset).toFixed(4))
  };
}
