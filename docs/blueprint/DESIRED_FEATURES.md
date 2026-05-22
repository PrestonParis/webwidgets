### Product Overall

- Main Website
  - WebWidgets.me
  - http://webwidgets.you (Future Redirect)
- Handbag Mode
  - Web Extension
    - Cross-Site Cart/Product Saving
  - Overlay-Based Tab
    - Take Certain widgets with you
- Desktop and Mobile App
- Tutorials
- Custom Widgets
  - API Integration
- Unsorted Suggestions
  - Break Timer for Workouts
  - Remove Background

* Tree Diagram: Logo
* Literal Context Diagram (modifiable)
    * LLM History
* Live Resume
* Personal Documents
* Accessibility 
* Food Delivery
* Memorization
* Drawing, Graphic Design 
* Weight loss plan
* Not overwhelming
* Screen Viewer
* Code Editor, Terminal
* Collaboration/Workspace Sync
* Summarize data (tables)


### UI

### General

# Widget Customizations

---

## Mobility

- **Free movement** — Move widgets across the page with custom placement and overlap allowed.
- **Snap rules**
  - Free movement
  - Grid snapping
  - Edge magnetism
  - Smart alignment guides
  - Proximity grouping suggestions
- **Freezing / pinning modes** — Fixed placement with distinct pin behaviors.
  - Viewport pinned — stays on screen during scroll
  - Canvas pinned — fixed relative to workspace
  - Anchor pinned — follows another widget or object

---

## Visibility

- **Hide** — Widget hidden from view but still loaded.
- **Low-profile** — Privacy-catered minimal display mode.
- **Scheduled visibility** — Set time windows for when a widget appears or disappears.
- **Unpresent** — Widget not rendered at all; add back from home page or settings.
- **Widget states** — Explicit runtime lifecycle states beyond visible/hidden. Essential for performance at scale.
  - Active — fully interactive
  - Passive — displays updates, no interaction
  - Dormant — in memory but not updating
  - Suspended — fully paused, zero compute
  - Archived — layout + state saved, not loaded

---

## Privacy

- **Privacy layer** — Granular controls for sensitive content (finance, health, notes).
  - Blur content
  - Redact sensitive fields
  - Metadata-only display
  - Require interaction to reveal
  - Auto-hide after inactivity

---

## Organization

- **Foldering** — Moveable container; click to reveal all contained widgets. Supports nested folders.
- **Widget bucket** — Small side icon. Lesser-used widgets stored here, shown as a links list, removed from home screen display.

---

## Widget Relationships

- **Relationship graph** — Generalized system letting the engine reason about interactions. Glueing and weaving are specific instances of this.
  - Independent
  - Attached (glued)
  - Embedded (foldered)
  - Merged (woven)
  - Dependent — one requires another
  - Reactive — one responds to another
  - Mirrored — state sync
- **Glueing** — Widgets stick together without shared context or UI overlap. Literal off-white rectangle visible between them.
- **Weaving** — Widgets act as one for movement, with UI overlap and shared insights/context.

---

## Display

- **Cropping** — Custom crop of a widget; extract necessary context. Widget display changes accordingly.
- **Styling** — Color, size, opacity, brightness. Copy styling from another widget or folder.

---

## Automation & Temporal Logic

- **Temporal logic** — "If X → do Y" automation. Turns the dashboard into an adaptive environment, not static UI.
  - If stock drops → surface finance widget
  - If task deadline < 24h → enlarge widget
  - If recovery score low → prioritize recovery dashboard

---

## Scenes & Presets

- **Widget presets / scenes** — Named workspace states. Switching instantly restores layout, visibility, and active state.
  - Research mode
  - Coding mode
  - Recovery mode
  - Finance dashboard

---

## Versioning

- **Workspace versioning / undo tree** — Essential safety net for deep customization. Massively reduces friction.
  - Workspace snapshots
  - Widget-level history
  - Restore points
  - Branching experiments

#### Components

- Header
  - Home,
  - Settings -> Notifications
- Footer
  - Privacy Policy
  - Terms of Service
- Pages
  - Home Page
    - User Insights Section
    - User Suggestions Section (AI)
    - Find Tasks button that looks for dates and other important information and suggests things that the system can do automamtically
  - Settings Page
    - Lots of Customization Settings
    - Theme Settings
- Homepage Customizations

### Utility

- (Text Editor) App
  - Journal
    - Temporary Delete
  - Notes
    - Long-Form Transcription
    - Markdown Note Editor
    - Auto-Researcher
      - Notes Compilation
      - "On This Day" Historical Archive
    - (Audio) Brain Dump
  - General Editor
    - Long-Form Editor

* (Productivity) App
  - Smart Email Inbox (Filtered, Grouped)
    - AI Email-Based Insights and Actions
    - Weave Inboxes feature
  - To-Do and Reminders
    - Kanban Task Board
    - Reminders (+Notifs)
  - Calendar
    - Event Adding (Super Custom)
    - Calendar weave
  - Pomodoro / Deep Work Timer
* (Converter) App
  - Unit Conversion
  - Currency Converter
  - File Format Converter

- (General) App
  - Local Weather Forecast
  - Clock
    - World Clock
    - Time zones
  - File Storage
- Tracker(s) App
  - Health
    - Sleep Tracker
      - Quality
      - Duration
    - Injury
      - Injury and Soreness Heatmap
    - Biometric Trend Chart (HRV/RHR)
    - - Mood / Energy Logger
  - Recovery Tracker
    - Addiction Quitting
    - Low-Profile Mode (UI)
    - Sync: Mood Track
  - Workout Tracker
    - Volume Monitor
    - Goals
    - Highlight Muscles Targeted (Combine with Pain Monitor)
    - Transcribe workout
    - Form Debugging
      - Videos
      - AI feedback
  - Nutrition
    - Weight Tracker
    - BMI Calculator
    - Food Search
    - Meal Tracker
      - Add Foods, Meals
    - Food Reception
      - Allergy Checker
      - Low-Tox Scanner
      - Food Symptoms
  - Intake Tracker
    - Supplements List
    - Med Checklist
    - Reminders
  - Trending Music (X API)
    - Auto-Add Music
- (Finance) App
  - Net Worth
    - Portfolio
    - Subscription Auditor
    - Monthly Burn Rate Calculator
    * Dividend Income Forecast
    * Expense Category Pie Chart
      - From Excel
  * Asset Monitor
    - Traditional Stocks
    - Crypto
    - Utilities (Oil, etc.)
- Search Bar
  - Widget Search and Suggester
  - External Website/App Suggester

### Miscellaneous

- API Endpoint Tester
- Terminal / Command Cheat Sheet
- Database Schema Visualizer
- System Resource Monitor (CPU/RAM)
- Network Speed Test
- Cron Job Status Tracker
- Docker Container Manager
- Logs Streamer (FastAPI/Supabase)
- Canvas
- Chess Helper
  - Repertoire Generator
  - Move Trainer
  - Analysis Board
  -
- SVG Path Visualizer
- Photo Gallery / Vision Board

### External/Wrapper-Based

- GitHub Contribution Heatmap
- Obsidian Vault Explorer
- Wrapper Widget: External App Functionality + WebWidgets features
  - YouTube (video listener)