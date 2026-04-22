import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface PublicProfile {
  user_id: string;
  first_name: string | null;
  age_range: string | null;
  city: string | null;
  postal_code: string | null;
  bio: string | null;
  avatar_url: string | null;
  goals: string[] | null;
  interests: string[] | null;
  availabilities: Json | null;
}

interface ScoredProfile extends PublicProfile {
  score: number;
  compatibility: number; // 0-100 %
  distanceKm: number | null;
  commonGoals: string[];
  commonInterests: string[];
}

// Approximate distance from French postal codes (department prefix).
// Same postal code = ~0 km, same dept = ~15 km, neighboring dept = ~50 km, else ~150 km.
function approxDistanceKm(a?: string | null, b?: string | null): number | null {
  if (!a || !b) return null;
  if (a === b) return 0;
  const da = a.substring(0, 2);
  const db = b.substring(0, 2);
  if (da === db) return 15;
  const na = parseInt(da, 10);
  const nb = parseInt(db, 10);
  if (!isNaN(na) && !isNaN(nb) && Math.abs(na - nb) <= 1) return 50;
  return 150;
}

const MAX_RAW_SCORE = 250; // approximate cap used to normalize to %

export async function fetchSuggestions(userId: string, limit = 50): Promise<ScoredProfile[]> {
  // 1. Current user profile
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!myProfile) return [];

  const radiusKm = myProfile.radius_km ?? 25;

  // 2-4. Exclusions (interactions, blocks, matches) in parallel
  const [interactionsRes, blocksOutRes, blocksInRes, matchesRes] = await Promise.all([
    supabase.from("interactions").select("target_user_id, action").eq("user_id", userId),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", userId),
    supabase.from("blocks").select("blocker_id").eq("blocked_id", userId),
    supabase.from("matches").select("user1_id, user2_id").or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
  ]);

  const seenIds = new Set((interactionsRes.data || [])
    .filter((i) => i.action !== "later")
    .map((i) => i.target_user_id));

  const blockedIds = new Set([
    ...(blocksOutRes.data || []).map((b) => b.blocked_id),
    ...(blocksInRes.data || []).map((b) => b.blocker_id),
  ]);

  const matchedIds = new Set((matchesRes.data || []).map((m) =>
    m.user1_id === userId ? m.user2_id : m.user1_id
  ));

  // 5. Candidate profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, age_range, city, postal_code, bio, avatar_url, goals, interests, availabilities")
    .eq("onboarding_completed", true)
    .neq("user_id", userId);

  if (!profiles) return [];

  const candidates = profiles.filter((p) =>
    !seenIds.has(p.user_id) && !blockedIds.has(p.user_id) && !matchedIds.has(p.user_id)
  );

  // 6. Score & filter by radius
  const scored: ScoredProfile[] = [];
  for (const p of candidates) {
    const distance = approxDistanceKm(myProfile.postal_code, p.postal_code);

    // Hard radius filter (if both have a postal code)
    if (distance !== null && distance > radiusKm) continue;

    let score = 0;

    // Common goals (heavy weight)
    const myGoals = myProfile.goals || [];
    const theirGoals = p.goals || [];
    const commonGoals = myGoals.filter((g) => theirGoals.includes(g));
    score += commonGoals.length * 25;

    // Common interests
    const myInterests = myProfile.interests || [];
    const theirInterests = p.interests || [];
    const commonInterests = myInterests.filter((i) => theirInterests.includes(i));
    score += Math.min(commonInterests.length, 10) * 10;

    // Same city bonus
    if (myProfile.city && p.city && myProfile.city.toLowerCase() === p.city.toLowerCase()) {
      score += 30;
    }

    // Distance bonus (closer = better)
    if (distance !== null) {
      if (distance === 0) score += 25;
      else if (distance <= 15) score += 15;
      else if (distance <= 50) score += 5;
    }

    // Availability overlap
    const myAvail = (myProfile.availabilities || {}) as Record<string, string[]>;
    const theirAvail = (p.availabilities || {}) as Record<string, string[]>;
    let availOverlap = 0;
    for (const day of Object.keys(myAvail)) {
      if (theirAvail[day]) {
        availOverlap += (myAvail[day] || []).filter((s) => (theirAvail[day] || []).includes(s)).length;
      }
    }
    score += Math.min(availOverlap, 10) * 5;

    if (p.avatar_url) score += 5;
    if (p.bio) score += 5;

    const compatibility = Math.max(0, Math.min(100, Math.round((score / MAX_RAW_SCORE) * 100)));

    scored.push({
      ...p,
      score,
      compatibility,
      distanceKm: distance,
      commonGoals,
      commonInterests,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function recordInteraction(
  userId: string,
  targetUserId: string,
  action: "accept" | "pass" | "later"
): Promise<{ matched: boolean }> {
  await supabase
    .from("interactions")
    .upsert({
      user_id: userId,
      target_user_id: targetUserId,
      action,
    }, { onConflict: "user_id,target_user_id" });

  if (action === "accept") {
    const { data } = await supabase.rpc("check_and_create_match", {
      p_user_id: userId,
      p_target_user_id: targetUserId,
    });
    return { matched: !!data };
  }

  return { matched: false };
}
