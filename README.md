# Crypto Clash Bot

Multi-bot Discord system for Crypto Clash featuring price display bots and leaderboard functionality.

## Bots

| Bot | Purpose |
|-----|---------|
| BTC | Bitcoin price display |
| ETH | Ethereum price display |
| SOL | Solana price display |
| LINK | Chainlink price display |
| HYPE | Hyperliquid price display |
| CLASH | Main bot - commands & leaderboard auto-post |
| TOURNAMENT | Tournament functionality |

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Discord bot tokens:

```bash
cp .env.example .env
```

### 3. Register Slash Commands

Register Discord slash commands (run once per bot, or when commands change):

```bash
npm run deploy-commands
```

### 4. Run

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Commands

| Command | Description |
|---------|-------------|
| `/leaderboard` | View trading leaderboard |
| `/winners` | View top profitable traders |
| `/losers` | View bottom traders (rekt board) |
| `/help` | Show help message |

## Scheduled Jobs

- **Price Updates**: Every 1 minute (configurable via `PRICE_UPDATE_INTERVAL`)
- **Leaderboard Post**: Every 3 hours to configured channel (configurable via `LEADERBOARD_UPDATE_HOURS`)

## Environment Variables

See `.env.example` for all configuration options.

## Project Structure

```
src/
├── app.ts                 # Entry point
├── bot.ts                 # Bot initialization
├── config/                # Configuration
├── constants/             # Branding & URLs
├── core/                  # BotManager & ManagedBot
├── discord/
│   ├── handlers/          # Command handlers
│   └── setup/             # Bot setup functions
├── schedule/              # Scheduled jobs
├── services/              # Price & Leaderboard services
├── templates/             # Discord embed templates
└── utils/                 # Utility functions
```

## License

MIT
