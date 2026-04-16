# Teja Interactive Portfolio

An interactive developer portfolio built with Next.js and Supabase. This project extends beyond a traditional portfolio by introducing a hybrid identity system, real-time engagement tracking, and a dynamic leaderboard driven by user interaction and gameplay.

---

## Overview

This portfolio is designed as a system-driven experience rather than a static showcase. It tracks user behavior, supports optional authentication via GitHub, and integrates gameplay elements to create a more engaging and measurable environment.

The goal is to demonstrate how core systems—identity, state, and interaction—can be combined into a cohesive product.

---

## Core Features

### Hybrid Identity System

The application supports both guest and authenticated users:

* **Guest Users**

  * Assigned a `visitor_id` stored in localStorage
  * No login required
  * Engagement data is tracked and persisted

* **Authenticated Users (GitHub OAuth)**

  * Login via GitHub using Supabase Auth
  * Profile data (username, avatar) is retrieved
  * Guest data is merged into the authenticated account

This ensures continuity of data while keeping the barrier to entry low.

---

### Engagement Tracking

User interaction is tracked in real time:

* Time spent on the site (`active_seconds`)
* Clicks and interactions
* Session activity

All data is associated with a persistent identity (`visitor_id` or `user_id`).

---

### Leaderboard System

A dynamic leaderboard ranks users based on overall engagement.

#### Scoring Factors

* Time spent on the website
* Number of interactions
* Game performance

The score is calculated consistently at the database level.

#### Display

* Username (or visitor identifier)
* Avatar (for authenticated users)
* Score and engagement metrics

No sensitive information (such as email) is exposed.

---

### Blog System

A lightweight content system supports:

* Markdown-based posts
* Optional YouTube embeds
* Minimal, clean presentation

Used for updates, notes, or technical write-ups.

---

### Interactive Systems

The portfolio incorporates game-inspired interactions:

* Event-driven UI behavior
* Hidden mechanics and triggers
* Integrated text-based gameplay (Hamurabi)

These elements are designed to reflect a systems-oriented approach to development.

---

### GitHub Integration

* Displays recent repository activity
* Uses GitHub API
* Supports optional token for higher rate limits

---

## Architecture

### Frontend

* Next.js (App Router)
* Component-based structure
* Tailwind CSS for styling

### Backend

* Supabase (PostgreSQL + Auth)
* Row-level security policies
* API routes for:

  * Engagement tracking
  * Leaderboard updates
  * Identity merging

---

## Database Design

### Visitors

Stores identity and engagement data:

* `visitor_id`
* `user_id`
* `clicks`
* `active_seconds`
* `score` (computed)
* `display_name`
* `avatar_url`
* `github_username`

### Posts

* `title`
* `slug`
* `content`
* `youtube_url`
* `published`

### Global Stats

* Aggregated metrics such as total clicks

---

## Authentication Flow

1. User visits → assigned a `visitor_id`
2. Activity is tracked as a guest
3. User logs in via GitHub
4. Guest data is merged into the user account
5. Future activity is tied to the authenticated identity

---

## Privacy and Security

* No sensitive data is exposed publicly
* Authentication handled via Supabase
* Environment variables excluded from version control
* Row-level security enforced at the database level

---

## Tech Stack

* Next.js
* Supabase (PostgreSQL + Auth)
* Tailwind CSS
* GitHub API

---

## Purpose

This project is intended to demonstrate:

* Systems thinking in application and game design
* Integration of frontend and backend systems
* Real-time data tracking and aggregation
* Clean, scalable architecture
* Practical use of authentication and database design

---

## Future Improvements

* Expanded gameplay systems
* More advanced analytics
* Improved scoring model
* Additional authentication providers
* UI/UX refinements

---

## Notes

This is an actively evolving project focused on experimentation with systems, interaction, and user-driven data.
