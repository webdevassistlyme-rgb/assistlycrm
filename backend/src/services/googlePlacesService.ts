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

export async function searchGooglePlaces(textQuery: string): Promise<GooglePlaceLead[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is required");
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri",
    },
    body: JSON.stringify({ textQuery }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Places request failed: ${message}`);
  }

  const data = (await response.json()) as { places?: GooglePlace[] };

  return (data.places || []).map((place) => ({
    googlePlaceId: place.id || "",
    businessName: place.displayName?.text || "Unnamed business",
    businessAddress: place.formattedAddress || "",
    phone: place.internationalPhoneNumber || place.nationalPhoneNumber || "",
    website: place.websiteUri || "",
  }));
}
