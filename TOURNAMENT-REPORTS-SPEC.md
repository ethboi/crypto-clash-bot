# Crypto Clash Discord Bot — Tournament Reports Spec

## Overview

A new bot (or extension to the existing `TOURNAMENT` bot in `crypto-clash-bot`) that automatically posts tournament reports to Discord: **daily standings**, **tournament results/winners**, and **prize summaries**.

---

## Data Source

The bot fetches data from the **Crypto Clash Next.js API** (same MongoDB backend):

| Endpoint | Purpose |
|---|---|
| `GET /api/tournaments/{id}` | Tournament metadata (name, dates, status, prizes, weekNumber) |
| `GET /api/tournaments/{id}/leaderboard?limit=50` | Current standings (ranked participants with scores) |
| `GET /api/tournaments/{id}/scores` | Daily score breakdowns |
| `GET /api/tournaments/{id}/participants` | Participant details (cards, strategy, crypto, direction) |
| `GET /api/admin/tournaments` | List all tournaments (for finding active/recently ended) |

**Auth:** Bot uses an internal API key (`X-API-Key` header) or hits the DB directly via a shared `LeaderboardService` / MongoDB connection (same as the existing bot pattern).

**Recommendation:** Add a new `TournamentReportService` that connects directly to MongoDB (reuse the connection string from env) rather than going through HTTP — simpler, no auth headaches.

---

## Bot Features

### 1. 📊 Auto-Post: Daily Standings (During Active Tournament)

**Trigger:** Cron — every day at **00:30 UTC** (after daily scores are processed at midnight)

**Channel:** `#tournament-standings` (configurable via env `TOURNAMENT_STANDINGS_CHANNEL_ID`)

**Embed Content:**

```
🏆 [Tournament Name] — Day [X]/7 Standings

📈 Selected Crypto: Day [X] price changes
BTC: +2.3% | ETH: -1.1% | SOL: +5.7% | ...

🥇 1. PlayerName — 142.5 pts
🥈 2. PlayerName — 138.2 pts
🥉 3. PlayerName — 125.8 pts
4. PlayerName — 119.3 pts
5. PlayerName — 112.0 pts
...
(show top 25, or all if < 25 participants)

📊 Total Participants: 47
🔗 [View Full Leaderboard](https://cryptoclash.me/tournament/{id})
```

**Embed color:** Gold (#FFD700)

---

### 2. 🏆 Auto-Post: Tournament Results & Winners

**Trigger:** Cron — checks every **15 minutes** for tournaments that just moved to `ended` status and have been finalized (results exist in `tournamentResults` collection). Or hook into the finalize-results admin action.

**Channel:** `#tournament-results` (configurable via env `TOURNAMENT_RESULTS_CHANNEL_ID`)

**Embed Content:**

```
🏆 [Tournament Name] — Final Results!

🥇 1st Place: PlayerName — 987.3 pts
   → 🎁 3 Patron NFTs + 40,000 $CLASH

🥈 2nd Place: PlayerName — 945.1 pts
   → 🎁 2 Patron NFTs + 25,000 $CLASH

🥉 3rd Place: PlayerName — 912.8 pts
   → 🎁 1 Patron NFT + 15,000 $CLASH

4th-5th Place:
   4. PlayerName — 889.2 pts → 7,500 $CLASH
   5. PlayerName — 871.0 pts → 7,500 $CLASH

6th-10th Place:
   6-10. [names] → 3,000 $CLASH each

11th-50th Place:
   11-50. → 1,500 $CLASH each

📊 Total Participants: 47
💰 Total Prize Pool: 185,000 $CLASH + 6 Patron NFTs
🔗 [View Details](https://cryptoclash.me/tournament/{id})
```

**Embed color:** Green (#00FF7F) for results

---

### 3. 🔔 Auto-Post: Tournament Lifecycle Alerts

**Channel:** `#tournament-announcements` (configurable via env `TOURNAMENT_ANNOUNCE_CHANNEL_ID`)

| Event | Message |
|---|---|
| Tournament Created | ⚔️ New tournament **[Name]** starts [date]! Lock your cards before [lockDate]. |
| Lock Period Ends | 🔒 Cards are LOCKED for **[Name]**! The battle begins now. [X] participants entered. |
| Tournament Ends | 🏁 **[Name]** has ended! Results being finalized... |
| Results Finalized | 🏆 Results are in! Check #tournament-results |

---

### 4. Slash Commands

| Command | Description |
|---|---|
| `/standings` | Show current tournament standings (ephemeral or public) |
| `/tournament` | Show active tournament info (name, day, time remaining, participants) |
| `/results [tournament_name]` | Show results for a specific or most recent ended tournament |
| `/prizes` | Show prize structure for current tournament |
| `/mystats [wallet]` | Show a player's position and score in current tournament |

---

## Architecture

```
crypto-clash-bot/src/
├── services/
│   └── TournamentReportService.ts    # MongoDB queries for tournament data
├── templates/
│   └── tournamentReport.ts           # Discord embed builders
├── schedule/
│   └── tournamentSchedule.ts         # Cron jobs for auto-posting
├── discord/
│   ├── handlers/
│   │   └── tournament.ts             # Slash command handlers (replace stubs)
│   └── setup/
│       └── tournamentBot.ts          # Wire up commands + scheduled posts
```

### New Service: `TournamentReportService`

```typescript
interface TournamentReportService {
  getActiveTournament(): Promise<Tournament | null>
  getRecentlyFinalized(): Promise<Tournament[]>  // ended + finalized in last 24h
  getLeaderboard(tournamentId: string, limit?: number): Promise<LeaderboardEntry[]>
  getTournamentResults(tournamentId: string): Promise<TournamentResult[]>
  getPrizeBreakdown(tournamentId: string): Promise<PrizeBreakdown>
  getParticipantStats(tournamentId: string, userId: string): Promise<ParticipantStats | null>
  getDailyPriceChanges(tournamentId: string, day: number): Promise<PriceChanges>
}
```

### LeaderboardEntry (for Discord)

```typescript
interface LeaderboardEntry {
  rank: number
  userId: string          // wallet address
  displayName?: string    // ENS or Discord username if linked
  totalScore: number
  cardCount: number
  selectedCrypto: string
  direction: 'up' | 'down'
}
```

---

## Environment Variables

```env
# Existing
MONGODB_URI=...
TOURNAMENT_BOT_TOKEN=...

# New
TOURNAMENT_STANDINGS_CHANNEL_ID=
TOURNAMENT_RESULTS_CHANNEL_ID=
TOURNAMENT_ANNOUNCE_CHANNEL_ID=
CRYPTO_CLASH_API_URL=https://cryptoclash.me   # for links in embeds
DAILY_STANDINGS_CRON=0 30 0 * * *             # 00:30 UTC daily
```

---

## Prize Structure (Default)

| Position | Patron NFTs | $CLASH |
|---|---|---|
| 1st | 3 | 40,000 |
| 2nd | 2 | 25,000 |
| 3rd | 1 | 15,000 |
| 4th-5th | 0 | 7,500 |
| 6th-10th | 0 | 3,000 |
| 11th-50th | 0 | 1,500 |

---

## Implementation Order

1. **`TournamentReportService`** — MongoDB queries (leaderboard, results, active tournament)
2. **`tournamentReport.ts` templates** — Discord embed builders for all report types
3. **`tournamentSchedule.ts`** — Cron jobs (daily standings + finalization checker)
4. **Slash commands** — Replace stubs in `tournamentBot.ts`
5. **Lifecycle alerts** — Hook into tournament status changes

---

## Notes

- Display names: Currently wallet addresses. Consider adding Discord ID linking (future) or just truncate addresses (`0x1234...abcd`).
- The bot already has the `TOURNAMENT` bot token and client — just needs the actual logic wired in.
- All times in UTC to match tournament processing.
- Rate limit: Don't post more than 1 standings update per day unless manually triggered.
- Consider a "tournament day summary" that includes top movers (biggest score gains that day).
