# Project Cleanup Plan

## Overview
This plan outlines files to delete and keep to maintain a clean, production-ready codebase while preserving all functionality.

## 🗑️ FILES TO DELETE

### 1. Debugging/Issue Files (Root Level)
**These are temporary files created during development troubleshooting:**
- `FIXED_websocket_context.jsx` - Fixed version for debugging WebSocket issues
- `main_jsx_strictmode_issue.jsx` - StrictMode issue demonstration file  
- `websocket_context_mounting_issues.jsx` - WebSocket mounting debugging file
- `analysis_websocket_mounting.md` - WebSocket analysis document

### 2. Development Documentation
**Internal documentation that shouldn't be in production:**
- `MIGRATION_GUIDE.md` - Internal migration documentation
- `ICP-DEV-GUIDE.md` - Developer setup guide
- `FRONTEND_ENV_EXAMPLE.md` - Environment variable examples
- `src/docs/` (entire folder) - Contains API docs and HeroUI component docs
  - `src/docs/API.md`
  - `src/docs/AUTHFLOW/authFlowOldApp.md`
  - `src/docs/HEROUI/` (6 files: Button.md, DRAWER.md, Dropdown.md, Input.md, Modal.md, ScrollShadow.md)

### 3. Alternative/Duplicate Configuration Files
**Redundant configuration files:**
- `package-proxy.json` - Alternative package.json (not used by main app)
- `okx-proxy-server.js` - Standalone proxy server (separate from main app)

### 4. Development Scripts
**Shell scripts used only in development:**
- `auto-dev.sh` - Development automation script
- `dev-setup.sh` - Development setup script  
- `icp_demo.sh` - ICP demo script

### 5. Test Files
**Test and integration files:**
- `test-frontend-integration.js` - Frontend integration tests
- `src/pages/Tests.jsx` - Test page (contains 4 test components)
- `src/components/ICPTestPage.jsx` - ICP testing component
- `src/components/PrivacyFilterTest.jsx` - Privacy filter testing
- `src/components/TradingTest.jsx` - Trading integration testing
- `src/components/ui/ChatMigrationTest.jsx` - Chat migration testing

### 6. Unused Assets (Public Folder)
**Game-like assets that are not referenced in code:**

#### Planet/Space Assets (11 files):
- `dryhotplanet-lvl1.png`
- `dryvenuslikeplanet-lvl2.png` 
- `exoplanetl-lvl3.png`
- `iceplanet-lvl4.png`
- `lava_planet-lvl5.png`
- `machine_world-lvl6.png`
- `moon-lvl7.png`
- `neptunlikeplanet-lvl8.png`
- `shattered_planet-lvl9.png`
- `sphereplanet-lvl10.png`
- `sun-lvl11.png`

#### Rocket Assets (11 files):
- `rocket.png`, `rocket 2.png`, `rocket 3.png`
- `rocket4.png` through `rocket11.png`

#### Game Objects (8 files):
- `BADGUY.png`
- `boss.png`
- `laser_store.png`
- `laser.png`
- `life.png`
- `Missile Icon.png`
- `Missile Icon 2.png`
- `shield.png`
- `spaceship.png`
- `tractor beam.png`

#### Miscellaneous Unused (3 files):
- `rotating-asteroid-hand-drawn-in-photoshop-after-effects-v0-8fpmswc0avmb1.png`
- `save_svg.svg`
- `vite.svg` (Vite default icon, not used)

### 7. Unused/Duplicate Source Assets
**Duplicate or unused assets in src/:**
- `src/COIN GEKO.png` - Duplicate image (typo in name)
- `src/assets/react.svg` - React default icon (not used)
- `src/assets/companion 1.png` - Unused companion image
- `src/assets/videos/freepik__smooth-flowing-abstract-animation-vivid-green-and-__19642.mp4` - Unused video
- `src/assets/videos/OLVIS D APP INTOS.mp4` - Unused intro video
- `src/components/ui/-tARhcx7_400x400.png` - Random image file in components
- `src/components/ui/change now .png` - CoinGecko logo duplicate
- `src/api/services/coinstats-2.png` - Image file in wrong location

### 8. Unused Components
**Components that appear to be unused or development-only:**
- `src/components/AgreggateRadios.jsx` - Unused radio component
- `src/components/AgentDataViews/TwitterUsername.jsx` - Unused Twitter component
- `src/components/WalletAuthModal.jsx` - Potentially unused wallet modal
- `src/pages/About.jsx` - About page (not in main routing)
- `src/pages/LandingPage.jsx` - Landing page (not in main routing)

### 9. Miscellaneous Archive Files
**Archive/backup files:**
- `olivia_icp_backend.zip` - Zipped backup of ICP backend

---

## ✅ FILES TO KEEP

### Core Application Files
- `package.json` - Main package configuration
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint configuration
- `index.html` - Main HTML file
- `README.md` - Project documentation

### Essential Source Files
- `src/main.jsx` - Application entry point
- `src/App.jsx` - Main App component
- `src/App.css` - App styles
- `src/index.css` - Global styles

### Core Pages (Used in Routing)
- `src/pages/Home.jsx` - Main dashboard
- `src/pages/Login.jsx` - Authentication page
- `src/pages/ICPSetup.jsx` - ICP setup page
- `src/pages/QrCode.jsx` - QR code page

### Essential Components
- `src/components/layout/` (3 files) - Layout components
- `src/components/auth/` (3 files) - Authentication components  
- `src/components/features/home/` (2 files) - Home page features
- `src/components/ui/` (27 essential files) - UI components (excluding test components)
- `src/components/ErrorBoundary.jsx` - Error handling

### Context Providers (All Essential)
- `src/contexts/AuthContext.jsx` - Authentication state
- `src/contexts/ChatContext.jsx` - Chat state
- `src/contexts/InternetIdentityContext.jsx` - ICP identity management
- `src/contexts/WebSocketContext.jsx` - WebSocket connection management

### API Layer (All Essential)
- `src/api/config/` (9 files) - API configurations
- `src/api/services/` (18 files) - Service layer
- `src/api/types/` (6 files) - Type definitions
- `src/api/index.js` - API exports

### Authentication System
- `src/auth/` (8 files) - Authentication utilities and components

### Hooks (All Essential)
- `src/hooks/` (7 files) - Custom React hooks

### Utilities
- `src/utils/` (3 files) - Utility functions
- `src/tools/index.js` - Tool definitions
- `src/data/notifications.js` - Notification data

### Used Assets
**Public Assets (11 files):**
- `background-video.mp4` - Used in Login page
- `OLIVIA FOR PHONE .mp4` - Used in LandingPage
- `Olivia-ai-LOGO.png` - Main logo (used in 6+ components)
- `Olivia-ai-LOGO 2.png` - Alternative logo
- `olivia-logo-white.png` - White variant logo
- `Olivia_pose_front.png` - Character image
- `OliviaAdvertPose.png` - Character pose
- `OliviaPose.png` - Character pose
- `qr-code-olivia.png` - QR code image
- `lurky-character.png` - Lurky character
- `THINKING ICON.gif` - Thinking animation
- `tonconnect-manifest.json` - TON Connect configuration
- Social media icons (TON, X/Twitter logos) - 7 files
- Blockchain icons (matchain, toncoin) - 3 files

**Source Assets (8 files):**
- `src/assets/coingecko-icon.png` - Used in FloatingCoinGeckoBubble
- `src/assets/hedera-logo.png` - Used in FloatingHederaBubble  
- `src/assets/icp-logo.jpg` - Used in multiple components
- `src/assets/lurky-character.png` - Used in FloatingLurkyBubble
- `src/assets/logos/` (2 files) - Olivia logos
- `src/assets/images/` (3 files) - Character images
- `src/assets/videos/OLIVIA FOR PHONE .mp4` - Video asset

---

## 📊 CLEANUP SUMMARY

### Files to Delete: **~85 files**
- 4 debugging files (root level)
- 4 documentation files
- 2 alternative config files  
- 3 shell scripts
- 5 test files
- ~33 unused game assets
- 8 unused/duplicate assets
- 4 unused components
- 1 archive file
- ~21 documentation files in src/docs/

### Files to Keep: **~85 files**
- 7 configuration files
- 4 core source files
- 4 essential pages
- ~40 essential components
- 4 context providers
- ~33 API files
- 8 auth files
- 7 hooks
- 4 utility files
- ~30 used assets

### Storage Savings: **~50-100MB**
- Primarily from unused video files and game assets
- Cleaner project structure
- Faster build times
- Easier maintenance

---

## 🚀 RECOMMENDED DELETION ORDER

1. **Start with obvious debug files** (4 files in root)
2. **Remove documentation** (src/docs/ folder)
3. **Clean unused assets** (public/ game assets)
4. **Remove test components** (test pages and components)
5. **Clean duplicate assets** (scattered image files)
6. **Final cleanup** (unused components, scripts)

---

## ⚠️ SAFETY NOTES

- **Backup before deletion** - Create a backup of the project
- **Test after each step** - Ensure the app still runs properly
- **Check imports** - Some unused files might be imported somewhere
- **Verify asset usage** - Double-check that assets aren't dynamically loaded
- **Keep git history** - Use git to track changes for easy rollback

---

## 🎯 EXPECTED RESULT

After cleanup:
- **Cleaner codebase** with only production-necessary files
- **Faster builds** due to fewer files to process
- **Easier maintenance** with less clutter
- **Same functionality** - all features preserved
- **Professional structure** ready for production deployment

The project will maintain 100% of its current functionality while being significantly cleaner and more maintainable.
