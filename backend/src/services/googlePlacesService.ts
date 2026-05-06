type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
};

export type GooglePlaceLead = {
  googlePlaceId: string;
  businessName: string;
  businessAddress: string;
  phone: string;
  website: string;
};

export type GooglePlacesSearchResult = {
  places: GooglePlaceLead[];
  nextPageToken: string;
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

export async function searchGooglePlaces(textQuery: string, pageToken = ""): Promise<GooglePlacesSearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is required");
  }

  const requestBody: { textQuery: string; pageSize: number; pageToken?: string } = {
    textQuery,
    pageSize: GOOGLE_PLACES_PAGE_SIZE,
  };

  if (pageToken) {
    requestBody.pageToken = pageToken;
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,nextPageToken",
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
    })),
    nextPageToken: data.nextPageToken || "",
  };
}

export async function searchAllGooglePlaces(textQuery: string): Promise<GooglePlacesSearchResult> {
  const placesByKey = new Map<string, GooglePlaceLead>();
  const seenPageTokens = new Set<string>();
  let nextPageToken = "";
  let pageCount = 0;

  do {
    const result = await searchGooglePlaces(textQuery, nextPageToken);

    result.places.forEach((place) => placesByKey.set(getPlaceDedupKey(place), place));

    pageCount += 1;

    if (!result.nextPageToken || seenPageTokens.has(result.nextPageToken)) {
      nextPageToken = "";
      break;
    }

    seenPageTokens.add(result.nextPageToken);
    nextPageToken = result.nextPageToken;
  } while (pageCount < GOOGLE_PLACES_MAX_PAGES && placesByKey.size < GOOGLE_PLACES_MAX_RESULTS);

  return {
    places: Array.from(placesByKey.values()).slice(0, GOOGLE_PLACES_MAX_RESULTS),
    nextPageToken,
  };
}
