# How to Extract Gun Silhouettes (5 minutes)

Your gun silhouettes EPS file is ready in this folder!

## Quick Steps to Extract Individual Silhouettes:

### Using Preview.app (Built into macOS):

1. **Open the EPS file**:
   ```
   open "gun silhouettes.eps"
   ```
   (It will open in Preview.app)

2. **For each gun you want**:
   - Click the "Selection Tool" (rectangular cursor icon)
   - Draw a box around one gun silhouette
   - Press `Cmd+C` to copy
   - Press `Cmd+N` to create new file
   - Press `Cmd+V` to paste
   - File > Export > Format: PNG
   - Save as: `ar15.png` (or appropriate name)

3. **Repeat for each gun type** you want. Suggested names:
   - `ar15.png` - AR-15/M4 style rifle
   - `ar10.png` - AR-10 style rifle
   - `ak47.png` - AK-47 style rifle
   - `glock.png` - Glock pistol
   - `1911.png` - 1911 pistol
   - `sig.png` - Sig Sauer pistol
   - `beretta.png` - Beretta pistol
   - `smith-wesson.png` - S&W M&P pistol
   - `revolver.png` - Revolver
   - `pump-shotgun.png` - Pump action shotgun
   - `auto-shotgun.png` - Semi-auto shotgun
   - `bolt-action.png` - Bolt action rifle
   - `milsurp.png` - M1 Garand / Enfield / Mosin
   - `pistol-generic.png` - Generic pistol fallback
   - `rifle-generic.png` - Generic rifle fallback
   - `shotgun-generic.png` - Generic shotgun fallback

### Alternative - Faster Method:

I can also use an online tool to split them. But manual gives you the most control over which guns to include.

## After Extracting:

Save all PNG files to this folder (`/web/public/silhouettes/`), then refresh your browser. The app will automatically use them!

## Current Status:

- ✅ Code is ready
- ✅ Mapping logic configured
- ⏳ Waiting for PNG files in this folder
- Currently showing initials as fallback
