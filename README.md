# 4chanbot

A Discord bot that monitors 4chan boards (like `/gif/`, `/w/`, etc.) for threads containing specific keywords, then downloads and posts videos (WebM, MP4, GIF) to a specified Discord channel.

## Features

-   **Multi-Board Support**: Monitor multiple boards simultaneously.
-   **Keyword Monitoring**: Scans catalogs for user-defined keywords.
-   **Media Mirroring**: Downloads video files and uploads them to Discord.
-   **Duplicate Prevention**: Tracks seen posts `history.json` to avoid reposts.
-   **Slash Commands**: Manage keywords, boards, and admins directly from Discord.
-   **Dockerized**: Easy deployment with Docker Compose.

## Setup

1.  **Clone the repository**.
2.  **Create Configuration**:
    Copy `.env.example` to `.env` and fill in your details:
    ```bash
    DISCORD_TOKEN=your_bot_token
    DISCORD_CHANNEL_ID=target_channel_id
    DISCORD_CLIENT_ID=your_application_id
    DISCORD_OWNER_ID=your_user_id
    ```

## Running the Bot

### Using Docker (Recommended)

This method automatically registers slash commands and handles restart policies.

```bash
docker-compose up -d --build
```

### Running Locally

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Register commands (run once):
    ```bash
    npm run deploy
    ```
3.  Start the bot:
    ```bash
    node index.js
    ```

## Usage

Use the `/4chan` slash command to manage the bot:

-   `/4chan add <keyword>`: Add a new keyword.
-   `/4chan list`: List keywords and boards.
-   `/4chan board add <board>`: Add a board to monitor (e.g. `w`, `wg`, `gif`).

## Permissions

The bot requires the following permissions in the target channel:
-   View Channel
-   Send Messages
-   Attach Files
-   Embed Links
