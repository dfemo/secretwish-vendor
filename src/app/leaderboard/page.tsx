"use client";

import { MyLeaderboard } from "@/shared/ui/leaderboard";

/** Where this store stands by orders fulfilled among approved vendors; other stores stay anonymous. */
export default function LeaderboardPage() {
  return (
    <MyLeaderboard
      path="/vendor/leaderboard"
      title="Leaderboard"
      description="Orders you've fulfilled (delivered, or handed to the SecretWish hub) compared with other SecretWish vendors. Other stores aren't named."
      score={(n) => `${n.toLocaleString()} fulfilled`}
      secondary={(n) => `${n}% on time`}
      next={(n) => `Fulfil ${n} more order${n === 1 ? "" : "s"} to move up a place.`}
      empty="Fulfil your first order to join the leaderboard."
    />
  );
}
