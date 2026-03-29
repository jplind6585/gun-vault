# Gun Vault

**All-in-One Gun & Shooting App**

A comprehensive mobile app for competitive shooters, collectors, and gunsmiths. Built with React Native + Expo.

## Project Status

🚧 **In Development** - Week 1

### Current Features
- ✅ Gun Vault (card & table view)
- ✅ SQLite database (local-first)
- ✅ Dark theme design system
- ✅ Tab navigation structure

### In Progress
- 🔨 Add gun form
- 🔨 Gun detail screen
- 🔨 Session logging

### Planned Modules
- Arsenal (ammo inventory)
- Reloading Bench (Pro)
- Training Log
- Target Analysis
- Gunsmithing Workbench (Pro)
- Competition Tracker (Pro)
- And more...

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Tech Stack

- **React Native** + **Expo** - Cross-platform mobile
- **expo-sqlite** - Local-first database
- **expo-router** - File-based navigation
- **TypeScript** - Type safety

## Architecture

- **Local-first**: All data stored on device with SQLite
- **Offline-first**: Full functionality without internet
- **Optional cloud sync**: Supabase (Pro feature, planned)

## Product Philosophy

> "Data accumulation drives intelligence. Every session, every shot string, every environmental reading feeds an analytics engine that surfaces actionable recommendations."

## Documentation

See `GUN_APP_PROJECT_HANDOFF.md` for complete product specification.

## Development Principles

From handoff doc Section 20 - Hard Product Rules:

1. No affiliate links. Ever.
2. No registry language. Guns are "added to your vault," not "registered."
3. Guns are never deleted, only decommissioned.
4. Round count can only increase via logged sessions.
5. Recipe snapshots are immutable.
6. Biometric lock on by default.
7. Serial numbers stored locally only (unless cloud sync explicitly enabled).

## License

Private - All Rights Reserved
