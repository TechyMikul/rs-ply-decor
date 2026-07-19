# Project Rules for Antigravity & AI Agents (RS PLY DECOR)

## Automatic Git Workflow Rules (CRITICAL)
1. **BEFORE STARTING WORK**: Always run `git pull origin main` in the terminal to fetch any new updates made by collaborators on GitHub.
2. **AUTOMATIC VERSIONING**: Increment the build version tag (e.g., `v1.0.1` -> `v1.0.2`) in `website/index.html` whenever code changes are made.
3. **AFTER COMPLETING WORK**: Automatically stage, commit, and push all changes to GitHub:
   ```bash
   git add .
   git commit -m "Auto-sync: Updated website features and bumped version [version_number]"
   git push origin main
   ```

## Design System Rules
- **NO BLUE COLOR**: Never use blue tones on this website. Use Midnight Obsidian Violet (`#12091f` / `#1a0f2e`), Pearl White (`#ffffff`), Warm Teak Wood (`#8c5225`), and Metallic Gold (`#d4af37`).
- **Strict Alternating Sections**: Dark Violet -> Light Pearl White -> Dark Violet -> Light Pearl White.
- **Pure White Expanding/Shrinking Header**: White header background (`#ffffff`), logo image initially 3x size (`110px`) shrinking to sleek compact size (`44px`) on scroll.
