# WebWidgets Vision

Target: Fully functional Website App V1 completed by August 25, 2026

# Core Purpose

- WebWidgets is a productivity platform for all users
  - Users are: Individuals, Students, Employees, Professionals, Content Creators, Software Developers, Teams, Households, Organizations, Administrators, WebWidgets Contributors, and Agents
- WebWidgets lets users curate the platform based on their needs
  - The user states what they want to accomplish and the system assembles the exact environment required to help them do it. This means widgets, workflows, data sources, automations, predictions, and actions

# Tech Stack

- Next.js (TypeScript), Python (FastAPI), Supabase and Go implemented
  - Specific specs and file structure outlined in
    [/ARCHITECTURE.md](../../ARCHITECTURE.md) (the former `ARCHITECTURE.md`
    in this directory is now just a pointer to that file)

# Platforms

- Website (Current Focus): WebWidgets.me is the primary domain.
  - Future redirect: webwidgets.you -> webwidgets.me
- Web Extension: "Backpack/Handbag Mode"
  - Cross-site cart and product saving
  - Overlay-based tab: bring selected widgets to any site
  - The workspace follows the user
- Desktop App
  - Same as website but modified to include additional device-based context and exclude non-desktop features
- Mobile App
  - Same as website but modified to include additional device-based context and exclude non-mobile features
- CLI
  - Downloadable CLI that reaches API endpoints and emulates website functionality from terminal

# Broad Development Plan

1. All Widgets / Features
2. Hypermodern UI
3. ML Predictions
4. Widget-Based Actions
5. Automation of Widget Actions
6. Hyper-Personalization of All of the Above
7. Security
8. Deployment

## Refinement Between Every Step

- Remove duplicate logic, fix all errors yielded with `npm run check`

## 1. All Widgets / Features

- The goal is breadth first, depth later
- All features listed in [FEATURE_LIST.md](FEATURE_LIST.md) implemented

## 2. Hypermodern UI

- The goal is a modern, hyper-customizable, adaptive UI
- All features listed in [UI.md](UI.md) implemented

## 3. ML Predictions

- The predictions needed to determine what widget-based actions are available and gneral predictions needed for the app
- All features listed in [PREDICTION_LIST.md](PREDICTION_LIST.md) implemented

## 4. Widget-Based Actions

- This stage is for Manual implementations of all actions that can be automated in later stages
- All features listed in [WIDGET_ACTIONS.md](WIDGET_ACTIONS.md) implemented

## 5. Automation of Widget Actions

- This is where all actions created in Stage 4 have the ability to be automated
- Automation guide in [AUTOMATION_GUIDE.md](AUTOMATION_GUIDE.md) implemented

## 6. Hyper-Personalization

- Niche features, personalizations and automations implemented
- All features listed in [PERSONALIZE.md](PERSONALIZE.md) implemented

## 7. Security

- All current and future data encrypted, secured and all security features added
- All features listed in [SECURITY.md](SECURITY.md) implemented

## 8. Deployment

- Deploy the website and fix any issues that arise or are flagged by users
- Deployment done according to [DEPLOYMENT.md](DEPLOYMENT.md)

# Current State

- See [/ROADMAP.md](../../ROADMAP.md) for the actual, evidence-based maturity
  assessment. It found the codebase does not map cleanly onto a single
  "current stage" of the plan above — some later-stage work (ML predictions,
  personalization, production deployment) already exists, while stage 7
  (Security) remains largely a checklist. Don't rely on a single stage
  number to describe where the project is; use ROADMAP.md's per-system table
  instead.
