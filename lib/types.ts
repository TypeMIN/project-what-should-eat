export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type AppUser = {
  id: number;
  loginId: string;
  displayName: string;
  birthYear: number;
  gender: Gender;
};

export type PlaceCandidate = {
  id: string;
  name: string;
  category: string;
  distanceMeters: number;
  address: string;
  roadAddress: string;
  placeUrl: string;
  latitude: number;
  longitude: number;
};

export type RegionResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type DecisionHistory = {
  id: number;
  place: PlaceCandidate;
  participants: Pick<AppUser, "id" | "loginId" | "displayName">[];
  decidedAt: string;
};
