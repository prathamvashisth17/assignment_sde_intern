export type SwipeDirection = "like" | "pass";

export type Profile = {
  id: string;
  name: string;
  age: number;
  photo: string;
  city: string;
  college?: string;
  bio: string;
  interests: string[];
  /** Seed-only field. Never sent to the client unless it becomes a mutual match. */
  likedYou?: boolean;
};

/** A profile as exposed by the API. deliberately stripped of `likedYou`. */
export type PublicProfile = Omit<Profile, "likedYou">;

export type SwipeRecord = {
  profileId: string;
  direction: SwipeDirection;
  createdAt: string;
};

export type MatchRecord = {
  profileId: string;
  matchedAt: string;
};

export type Database = {
  swipes: SwipeRecord[];
  matches: MatchRecord[];
};

export type PublicMatch = {
  profile: PublicProfile;
  matchedAt: string;
};
