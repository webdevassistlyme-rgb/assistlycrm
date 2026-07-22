type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

export type GooglePlaceLead = {
  googlePlaceId: string;
  businessName: string;
  businessAddress: string;
  phone: string;
  website: string;
  latitude?: number;
  longitude?: number;
};

export type GooglePlacesSearchResult = {
  places: GooglePlaceLead[];
  nextPageToken: string;
};

export type GooglePlacesPagedSearchResult = GooglePlacesSearchResult & {
  pageCount: number;
};

export type GooglePlacesLocationBias = {
  circle: {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  };
};

type GooglePlacesSearchOptions = {
  pageToken?: string;
  locationBias?: GooglePlacesLocationBias;
};

const GOOGLE_PLACES_PAGE_SIZE = 20;
const GOOGLE_PLACES_MAX_RESULTS = 10000;
const GOOGLE_PLACES_MAX_PAGES = Math.ceil(GOOGLE_PLACES_MAX_RESULTS / GOOGLE_PLACES_PAGE_SIZE);

function normalizePlaceValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getPlaceDedupKey(place: GooglePlaceLead) {
  if (place.googlePlaceId) {
    return `place:${place.googlePlaceId}`;
  }

  return `business:${normalizePlaceValue(place.businessName)}|${normalizePlaceValue(place.businessAddress)}`;
}

export async function geocodeLocation(address: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is required");
  }

  const geocodeUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  geocodeUrl.searchParams.set("address", address);
  geocodeUrl.searchParams.set("key", apiKey);

  const response = await fetch(geocodeUrl);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google geocode request failed: ${message}`);
  }

  const data = (await response.json()) as {
    status?: string;
    results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
  };
  const location = data.results?.[0]?.geometry?.location;

  if (data.status && data.status !== "OK") {
    return null;
  }

  if (typeof location?.lat !== "number" || typeof location?.lng !== "number") {
    return null;
  }

  return {
    latitude: location.lat,
    longitude: location.lng,
  };
}

export async function reverseGeocodeLocality(coordinates: { latitude: number; longitude: number }) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is required");
  }

  const geocodeUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  geocodeUrl.searchParams.set("latlng", `${coordinates.latitude},${coordinates.longitude}`);
  geocodeUrl.searchParams.set("result_type", "locality|postal_town|administrative_area_level_3");
  geocodeUrl.searchParams.set("key", apiKey);

  const response = await fetch(geocodeUrl);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google reverse geocode request failed: ${message}`);
  }

  const data = (await response.json()) as {
    status?: string;
    results?: Array<{
      address_components?: Array<{
        long_name?: string;
        short_name?: string;
        types?: string[];
      }>;
    }>;
  };

  if (data.status && data.status !== "OK") {
    return null;
  }

  const components = data.results?.[0]?.address_components || [];
  const locality = components.find((component) => component.types?.includes("locality")) ||
    components.find((component) => component.types?.includes("postal_town")) ||
    components.find((component) => component.types?.includes("administrative_area_level_3"));
  const state = components.find((component) => component.types?.includes("administrative_area_level_1"));

  if (!locality?.long_name) {
    return null;
  }

  return {
    city: locality.long_name,
    state: state?.short_name || "",
  };
}

export async function searchGooglePlaces(textQuery: string, options: GooglePlacesSearchOptions | string = ""): Promise<GooglePlacesSearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is required");
  }

  const searchOptions = typeof options === "string" ? { pageToken: options } : options;
  const requestBody: { textQuery: string; pageSize: number; pageToken?: string; locationBias?: GooglePlacesLocationBias } = {
    textQuery,
    pageSize: GOOGLE_PLACES_PAGE_SIZE,
  };

  if (searchOptions.pageToken) {
    requestBody.pageToken = searchOptions.pageToken;
  }

  if (searchOptions.locationBias) {
    requestBody.locationBias = searchOptions.locationBias;
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.location,nextPageToken",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Places request failed: ${message}`);
  }

  const data = (await response.json()) as { places?: GooglePlace[]; nextPageToken?: string };

  return {
    places: (data.places || []).map((place) => ({
      googlePlaceId: place.id || "",
      businessName: place.displayName?.text || "Unnamed business",
      businessAddress: place.formattedAddress || "",
      phone: place.internationalPhoneNumber || place.nationalPhoneNumber || "",
      website: place.websiteUri || "",
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
    })),
    nextPageToken: data.nextPageToken || "",
  };
}

export async function searchGooglePlacesPages(textQuery: string, maxPages = GOOGLE_PLACES_MAX_PAGES, options: Omit<GooglePlacesSearchOptions, "pageToken"> = {}): Promise<GooglePlacesPagedSearchResult> {
  const placesByKey = new Map<string, GooglePlaceLead>();
  const seenPageTokens = new Set<string>();
  let nextPageToken = "";
  let pageCount = 0;
  const pageLimit = Math.max(1, Math.min(Math.round(maxPages), GOOGLE_PLACES_MAX_PAGES));

  do {
    const result = await searchGooglePlaces(textQuery, { ...options, pageToken: nextPageToken });

    result.places.forEach((place) => placesByKey.set(getPlaceDedupKey(place), place));

    pageCount += 1;

    if (!result.nextPageToken || seenPageTokens.has(result.nextPageToken)) {
      nextPageToken = "";
      break;
    }

    seenPageTokens.add(result.nextPageToken);
    nextPageToken = result.nextPageToken;
  } while (pageCount < pageLimit && placesByKey.size < GOOGLE_PLACES_MAX_RESULTS);

  return {
    places: Array.from(placesByKey.values()).slice(0, GOOGLE_PLACES_MAX_RESULTS),
    nextPageToken,
    pageCount,
  };
}

export async function searchAllGooglePlaces(textQuery: string): Promise<GooglePlacesSearchResult> {
  return searchGooglePlacesPages(textQuery, GOOGLE_PLACES_MAX_PAGES);
}
