import { promises as fs } from "node:fs";
import path from "node:path";

import profileData from "@/data/profiles.json";

import type {
  Database,
  MatchRecord,
  Profile,
  PublicMatch,
  PublicProfile,
  SwipeDirection,
} from "@/lib/types";

/**
 * This app assumes a single logged-in user, as allowed by the assignment.
 * Keeping a user id in the write helpers makes the intent explicit and leaves
 * room for real auth later.
 */
export const CURRENT_USER_ID = "current-user";

export const profiles = profileData as Profile[];

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "db.json");

const emptyDatabase: Database = {
  swipes: [],
  matches: [],
};

/**
 * Serialises writes so two rapid swipes can never read the same snapshot and
 * overwrite each other. Reads wait for queued writes to settle first.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Database>;
  return Array.isArray(candidate.swipes) && Array.isArray(candidate.matches);
}

async function readDatabase(): Promise<Database> {
  try {
    const raw = await fs.readFile(databasePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return isDatabase(parsed) ? parsed : { swipes: [], matches: [] };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return structuredClone(emptyDatabase);
    throw error;
  }
}

async function writeDatabase(database: Database): Promise<void> {
  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(databasePath, JSON.stringify(database, null, 2), "utf8");
}

export async function readStore(): Promise<Database> {
  await writeQueue;
  return readDatabase();
}

function updateStore<T>(mutate: (database: Database) => T | Promise<T>): Promise<T> {
  const operation = writeQueue.then(async () => {
    const database = await readDatabase();
    const result = await mutate(database);
    await writeDatabase(database);
    return result;
  });

  // Keep the queue alive even if a mutation fails.
  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function toPublicProfile(profile: Profile): PublicProfile {
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    photo: profile.photo,
    city: profile.city,
    college: profile.college,
    bio: profile.bio,
    interests: profile.interests,
  };
}

function findProfile(profileId: string): Profile | undefined {
  return profiles.find((profile) => profile.id === profileId);
}

function toPublicMatch(profile: Profile, match: MatchRecord): PublicMatch {
  return {
    profile: toPublicProfile(profile),
    matchedAt: match.matchedAt,
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getFeed(): Promise<PublicProfile[]> {
  const database = await readStore();
  const swiped = new Set(database.swipes.map((swipe) => swipe.profileId));

  return profiles
    .filter((profile) => !swiped.has(profile.id))
    .map(toPublicProfile);
}

export async function getMatches(): Promise<PublicMatch[]> {
  const database = await readStore();

  return database.matches
    .map((match) => {
      const profile = findProfile(match.profileId);
      return profile ? toPublicMatch(profile, match) : null;
    })
    .filter((match): match is PublicMatch => match !== null)
    .sort(
      (a, b) =>
        new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime(),
    );
}

export type SwipeResult = {
  matched: boolean;
  match: PublicMatch | null;
  alreadySwiped: boolean;
};

export async function recordSwipe(
  profileId: string,
  direction: SwipeDirection,
): Promise<SwipeResult> {
  const profile = findProfile(profileId);
  if (!profile) {
    throw new ApiError("Profile not found.", 404);
  }

  return updateStore((database) => {
    const existingSwipe = database.swipes.find(
      (swipe) => swipe.profileId === profileId,
    );

    if (existingSwipe) {
      // Idempotent: a retried request can never create a second match or
      // change the outcome of the first swipe.
      const existingMatch = database.matches.find(
        (match) => match.profileId === profileId,
      );

      return {
        matched: Boolean(existingMatch),
        match: existingMatch ? toPublicMatch(profile, existingMatch) : null,
        alreadySwiped: true,
      };
    }

    const createdAt = new Date().toISOString();

    database.swipes.push({
      profileId,
      direction,
      createdAt,
    });

    if (direction === "like" && profile.likedYou) {
      const matchRecord: MatchRecord = {
        profileId,
        matchedAt: createdAt,
      };

      database.matches.push(matchRecord);

      return {
        matched: true,
        match: toPublicMatch(profile, matchRecord),
        alreadySwiped: false,
      };
    }

    return {
      matched: false,
      match: null,
      alreadySwiped: false,
    };
  });
}
