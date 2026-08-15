# K A A R K U N

## MASTER FRONTEND UI/UX REVAMP, CONSISTENCY & QUALITY-ASSURANCE PROMPT

You are acting as a **Senior Product Designer, Principal Frontend Engineer, UI/UX Architect, Design-System Engineer, Accessibility Engineer, Animation Engineer, and QA Engineer** working on the Kaarkun job marketplace platform.

Your task is to perform a **complete frontend UI/UX revamp** of the supplied Kaarkun project.

This is NOT a backend-development task.

Your mission is to transform the existing frontend into a:

- Premium

- Professional

- Modern

- Calm

- Warm

- Trustworthy

- Emotionally engaging

- Smooth

- Buttery

- Highly consistent

- Responsive

- Accessible

- Production-quality

marketplace experience for Customers, Service Providers, and Administrators.

---

# 1. PROJECT CONTEXT

Kaarkun is a full-stack job marketplace connecting customers with skilled service providers.

The supplied project contains:

```text
admin/               → Next.js Admin Dashboard
backend/             → Node.js / Express / MySQL Backend
mobile/              → Flutter Mobile Application
Customer/            → Customer UI mockups/assets
Service Provider/    → Service Provider UI mockups/assets
root/                → Documentation/shared assets
```

The README identifies these technologies:

## Mobile

- Flutter

- Dart

- Provider

- GoRouter

- Dio

- Google Maps Flutter

- Geolocator

- Google Fonts

- Flutter SVG

- Image Picker

## Admin Web

- Next.js 15+

- React 19

- TailwindCSS 4

- TypeScript

- React Hot Toast

## Backend

- Node.js

- Express.js

- MySQL

- JWT

- Refresh Token rotation

- Password hashing

- OTP verification

The backend already provides business logic, authentication, persistence and APIs.

**Do not redesign, rewrite, migrate, restructure, optimize, modify or replace the backend.**

---

# 2. PRIMARY OBJECTIVE

Completely revamp the frontend UI while preserving existing functionality and backend contracts.

The result should feel like a professionally funded marketplace product rather than a student/final-year-project interface.

Do NOT merely change colors.

Perform a full UI/UX audit and redesign covering:

- Layout

- Typography

- Color system

- Spacing

- Components

- Cards

- Forms

- Buttons

- Navigation

- App bars

- Sidebars

- Bottom navigation

- Modals

- Dialogs

- Sheets

- Tabs

- Tables

- Filters

- Search

- Empty states

- Loading states

- Error states

- Success states

- Validation states

- Authentication screens

- Profiles

- Job posting

- Job browsing

- Bidding

- Booking

- Reviews

- Verification

- Admin dashboard

- Analytics

- Notifications

- Settings

- Responsive behavior

- Accessibility

- Animations

- Micro-interactions

- Transitions

- Visual hierarchy

- Information architecture

---

# 3. ABSOLUTE BACKEND SAFETY RULE

## BACKEND IS READ-ONLY

You are explicitly prohibited from modifying backend behavior.

DO NOT:

- Modify `/backend`

- Modify Express routes

- Modify controllers

- Modify services

- Modify database schema

- Modify SQL

- Modify migrations

- Modify authentication logic

- Modify JWT logic

- Modify refresh-token logic

- Modify OTP logic

- Modify password hashing

- Modify API contracts

- Modify request/response structures

- Modify database queries

- Modify environment secrets

- Modify backend dependencies

- Modify backend configuration

If frontend code depends on an existing API, consume that API exactly as currently implemented.

If you discover a backend problem:

1. Do NOT fix it.

2. Document it separately.

3. Determine whether a frontend-safe workaround is possible.

4. Never alter backend code just to make the UI work.

If a change could potentially affect backend behavior, STOP and do not make that change.

---

# 4. FRONTEND-ONLY SCOPE

You may modify only frontend-related implementation.

Depending on the existing architecture, this may include:

### Web

- Next.js pages

- React components

- TypeScript frontend code

- Tailwind classes

- CSS

- frontend assets

- frontend animations

- frontend state/UI behavior

- frontend accessibility

- frontend responsive behavior

### Mobile

- Flutter UI

- Dart widgets

- themes

- layout

- animations

- UI state presentation

- navigation presentation

- frontend assets

Do not change backend/API contracts.

Do not replace the project's established frontend technology with another framework.

Do not introduce unnecessary dependencies.

---

# 5. FIRST STEP — COMPLETE UI/UX AUDIT

Before changing anything, inspect the entire project.

Do not immediately start coding.

First understand:

- Existing architecture

- Existing pages

- Existing screens

- Existing routes

- Existing components

- Existing design patterns

- Existing colors

- Existing typography

- Existing spacing

- Existing icons

- Existing images

- Existing animations

- Existing responsive logic

- Existing loading states

- Existing error handling

- Existing forms

- Existing navigation

- Existing API consumption

- Existing reusable components

Create an internal UI inventory.

Identify:

### Critical UI Problems

- Inconsistent components

- Mixed icon styles

- Emojis

- Poor spacing

- Weak typography

- Random colors

- Excessive borders

- Excessive shadows

- Inconsistent border radii

- Inconsistent button heights

- Inconsistent input fields

- Poor visual hierarchy

- Weak empty states

- Weak loading states

- Broken responsive layouts

- Unprofessional dashboards

- Poor mobile navigation

- Excessive animation

- Missing animation

- Abrupt transitions

- Inconsistent interaction feedback

- Accessibility issues

- Overflow issues

- Alignment problems

- Visual clutter

- Duplicate UI patterns

Do this audit across the entire frontend rather than fixing only the first visible screen.

---

# 6. DESIGN DIRECTION

The new Kaarkun design language must communicate:

**Trust + Skill + Human Service + Reliability + Premium Quality**

The product should feel:

> Calm, confident, warm, sophisticated, approachable and highly trustworthy.

Avoid a generic "AI SaaS dashboard" appearance.

Avoid childish UI.

Avoid template-like UI.

Avoid excessive glassmorphism.

Avoid excessive gradients.

Avoid visual noise.

Avoid overly rounded everything.

Avoid giant typography everywhere.

Avoid excessive shadows.

The design must have enough personality to feel like a real marketplace brand.

---

# 7. COLOR SYSTEM

## STRICTLY PROHIBITED

Do NOT use:

- Purple

- Violet

- Lavender

- Magenta-purple

- Blue-purple

- Purple gradients

- Colors visually associated with purple

Do not replace purple with another random bright color.

Create a cohesive professional palette.

## PREFERRED DIRECTION

Explore a sophisticated combination based around:

- Dodger Blue / refined blue

- Deep navy

- Soft warm neutrals

- Warm white

- Cool white

- Soft gray

- Charcoal

- Controlled accent colors

- Carefully selected success/warning/error colors

The final palette must be:

- Attractive

- Professional

- Premium

- Calm

- Warm

- Trustworthy

- Accessible

- Consistent

Do NOT blindly use DodgerBlue everywhere.

Use color semantically.

Example conceptual structure:

```text
Primary
Secondary
Accent
Background
Surface
Surface Elevated
Text Primary
Text Secondary
Text Muted
Border
Success
Warning
Error
Info
```

Create a centralized design-token system.

Do not scatter arbitrary hex values throughout the application.

---

# 8. ICONOGRAPHY — ZERO EMOJIS

## ABSOLUTE RULE

REMOVE ALL UI EMOJIS.

Do not use emojis as:

- Buttons

- Navigation icons

- Feature icons

- Status indicators

- Cards

- Empty states

- Notifications

- Dashboard widgets

- Decorative UI elements

Examples of prohibited UI:

❌ 🔍  
❌ ❤️  
❌ ⭐  
❌ 📍  
❌ 🛠️  
❌ 👤  
❌ 📊

Use actual icons instead.

---

# 9. ICON PRIORITY

Use:

## Priority 1

**Font Awesome free icons**

Use appropriate Free/solid/regular icons where available.

## Priority 2

**Google Material Icons / Material Symbols**

Use them only when the required icon is unavailable or unsuitable in Font Awesome.

Do NOT mix random icon libraries.

Do NOT use arbitrary SVG icon packs.

Do NOT use inconsistent icon styles.

Maintain consistent:

- Stroke/weight

- Size

- Optical alignment

- Container size

- Spacing

- Color

- Hover behavior

If the project already contains a valid icon implementation, refactor it into a consistent system rather than introducing unnecessary alternatives.

---

# 10. TYPOGRAPHY SYSTEM

Create a clear typography hierarchy.

Define:

- Display

- H1

- H2

- H3

- H4

- Body Large

- Body

- Body Small

- Caption

- Label

- Button

- Navigation

Typography should feel:

- Premium

- Readable

- Calm

- Modern

- Professional

Avoid excessive font-weight changes.

Avoid random font sizes.

Maintain consistent line heights.

Use the project's supported font infrastructure where appropriate.

---

# 11. SPACING SYSTEM

Create a consistent spacing scale.

Do not manually invent spacing for every component.

Standardize:

- Page padding

- Section spacing

- Card padding

- Form gaps

- Grid gaps

- Button padding

- Navigation spacing

- Modal spacing

- Dashboard spacing

Everything should visually align to a common rhythm.

---

# 12. COMPONENT DESIGN SYSTEM

Build/refactor reusable frontend components wherever practical.

Examples:

```text
Button
IconButton
Input
Select
Textarea
Checkbox
Radio
Switch
Badge
Avatar
Card
Modal
Dialog
Drawer
Toast
Tooltip
Tabs
Dropdown
Pagination
SearchBar
FilterBar
StatCard
DataTable
EmptyState
LoadingState
ErrorState
Skeleton
StatusBadge
ProfileCard
JobCard
BidCard
BookingCard
ReviewCard
```

Do not create slightly different versions of the same component without a strong reason.

---

# 13. BUTTON SYSTEM

Buttons must have clear hierarchy.

Define:

- Primary

- Secondary

- Tertiary/Ghost

- Destructive

- Success

- Icon-only

Every button must have:

- Clear hover state

- Clear pressed state

- Clear focus state

- Disabled state

- Loading state where applicable

Avoid oversized buttons.

Avoid excessive pill buttons unless the context requires them.

---

# 14. FORM UX

Forms must feel premium and effortless.

Improve:

- Labels

- Placeholder text

- Input spacing

- Focus states

- Validation

- Error messages

- Success feedback

- Disabled states

- Loading states

- Password visibility

- File upload states

- OTP input

- Date/time selection

- Location selection

Errors must explain what the user needs to fix.

Do not rely only on color to communicate validation.

---

# 15. MARKETPLACE UX

Kaarkun is a marketplace.

Design every marketplace interaction around:

**Trust → Discovery → Decision → Action → Confirmation**

For example:

Customer:

```text
Discover service
↓
View provider
↓
Evaluate profile
↓
Review skills
↓
Compare bids
↓
Select provider
↓
Book
↓
Track
↓
Complete
↓
Review
```

Service Provider:

```text
Discover job
↓
Evaluate requirements
↓
Check location
↓
Review budget
↓
Submit bid
↓
Track bid
↓
Booking
↓
Complete job
↓
Receive review
```

The interface must make these workflows obvious.

---

# 16. TRUST DESIGN

Because Kaarkun deals with real-world services, trust is a core UX requirement.

Visually emphasize:

- Verified providers

- Certifications

- Reviews

- Ratings

- Completed jobs

- Professional experience

- Secure actions

- Clear pricing

- Booking status

- Identity verification

- Transparent status indicators

But do not clutter the interface with badges.

Trust elements should feel meaningful and intentional.

---

# 17. DASHBOARD REVAMP

The Admin Dashboard should look like a serious production platform.

Improve:

- Sidebar

- Header

- Dashboard overview

- KPI/stat cards

- Charts

- Tables

- Filters

- Search

- User management

- Provider verification

- Job management

- Categories

- Disputes

- Analytics

- Notifications

- Settings

Use strong visual hierarchy.

Avoid dashboard-card overload.

Do not make every section a floating card.

---

# 18. MOBILE APPLICATION REVAMP

The Flutter application must receive the same design language.

Maintain visual consistency between:

- Customer

- Service Provider

- Admin web

But do not force desktop UI patterns onto mobile.

Use mobile-native patterns:

- Bottom navigation

- Bottom sheets

- Appropriate touch targets

- Gesture-friendly controls

- Comfortable spacing

- Mobile-first forms

- Responsive cards

- Clear hierarchy

Touch targets should be comfortably usable.

---

# 19. RESPONSIVE DESIGN

Test at minimum:

```text
320px
375px
390px
414px
768px
1024px
1280px
1440px
1920px
```

Check:

- Navigation

- Tables

- Cards

- Forms

- Modals

- Images

- Text wrapping

- Buttons

- Sidebars

- Dashboard widgets

- Bottom navigation

- Horizontal scrolling

- Overflow

Nothing should:

- Overflow unexpectedly

- Become unreadable

- Become cramped

- Break alignment

- Cause horizontal page scrolling unnecessarily

- Hide critical information

---

# 20. ANIMATION PHILOSOPHY

Animations should make the interface feel alive, not distracting.

Target feeling:

**smooth + buttery + soft + responsive**

Use animation for:

- Page transitions

- Navigation

- Hover states

- Button feedback

- Cards

- Modal opening

- Modal closing

- Dropdowns

- Tabs

- Loading states

- Skeletons

- Counters

- Status changes

- Form feedback

- Success states

- Micro-interactions

Avoid:

- Constant bouncing

- Excessive scaling

- Random floating elements

- Long transitions

- Distracting parallax

- Animation on everything

---

# 21. ANIMATION TIMING

Use sensible motion hierarchy.

### Micro interactions

Approximately:

```text
120–220ms
```

### Component transitions

Approximately:

```text
200–350ms
```

### Larger transitions

Approximately:

```text
350–600ms
```

Use appropriate easing.

Motion should feel natural rather than mechanical.

Respect:

```text
prefers-reduced-motion
```

---

# 22. ANIME.JS

For heavy or complex frontend animations, use **Anime.js** where appropriate.

Use Anime.js for:

- Complex entrance sequences

- Coordinated animations

- Counters

- Dashboard visualizations

- Advanced UI choreography

- Complex timeline-based interactions

Do NOT use Anime.js for every hover or simple transition.

Prefer CSS transitions/animations for simple interactions.

Do not introduce animation simply to demonstrate the library.

Animation must serve UX.

---

# 23. MICRO-INTERACTIONS

Add meaningful micro-interactions such as:

- Button press feedback

- Icon hover movement

- Input focus transitions

- Card elevation changes

- Tab indicator movement

- Status transitions

- Bookmark/favorite feedback

- Bid submission feedback

- Booking confirmation

- Verification progress

- Upload progress

- Toast transitions

- Skeleton-to-content transition

Every interaction should communicate state.

---

# 24. LOADING STATES

Eliminate abrupt loading experiences.

Create polished:

- Skeletons

- Spinners where appropriate

- Progressive loading

- Disabled loading buttons

- Upload progress

- Page loading states

Avoid spinner-only interfaces where a skeleton would provide better context.

---

# 25. EMPTY STATES

Every important empty state must be intentional.

Examples:

- No jobs

- No bids

- No bookings

- No reviews

- No notifications

- No providers

- No search results

- No verification documents

Each should contain:

```text
Icon
Title
Helpful explanation
Relevant action
```

Use Font Awesome/Material icons, never emojis.

---

# 26. ERROR STATES

Create professional error presentation.

Avoid:

```text
Something went wrong.
```

when a better explanation is possible.

Provide:

- What happened

- What the user can do

- Retry action where appropriate

- Clear visual status

- Accessible messaging

Do not expose technical implementation details unnecessarily.

---

# 27. ACCESSIBILITY

Audit the UI for:

- Keyboard navigation

- Focus visibility

- Color contrast

- Semantic structure

- Labels

- ARIA where necessary

- Screen-reader compatibility

- Touch target sizes

- Reduced motion

Never use color as the only communication mechanism.

---

# 28. VISUAL CONSISTENCY AUDIT

After implementation, compare every screen against the design system.

Check:

### Colors

Are all colors from approved tokens?

### Icons

Are all icons from approved libraries?

### Typography

Are sizes and weights consistent?

### Radius

Are border-radius values consistent?

### Shadows

Are elevation levels consistent?

### Buttons

Do all buttons behave consistently?

### Inputs

Do all fields use the same language?

### Cards

Do cards follow the same visual grammar?

### Spacing

Are spacing values systematic?

### Motion

Do transitions feel related?

---

# 29. DO NOT OVERDESIGN

Premium does NOT mean:

- More gradients

- More shadows

- More glass

- More animation

- More colors

- More cards

- More decoration

Premium means:

**clarity + restraint + hierarchy + consistency + craftsmanship**

---

# 30. ASSET AUDIT

Inspect existing assets.

Reuse good assets where appropriate.

Remove:

- Duplicate assets

- Broken assets

- Unused decorative assets

- Emoji graphics

- Low-quality icons

Do not unnecessarily replace meaningful project assets.

Do not invent brand assets unless required.

---

# 31. CODE QUALITY

Frontend code must remain maintainable.

Avoid:

- Massive components

- Duplicated styling

- Repeated magic values

- Random inline styles

- Dead UI code

- Unused imports

- Console errors

- Broken links

- Temporary debugging code

Use reusable components and centralized design tokens.

---

# 32. PRESERVE FUNCTIONALITY

The redesign must NOT remove working functionality.

Before modifying a screen, understand what it currently does.

After modifying it, verify:

- Buttons

- Navigation

- Forms

- Search

- Filters

- Modals

- Uploads

- Authentication UI

- Provider workflows

- Customer workflows

- Admin workflows

- API-driven states

still work exactly as expected.

---

# 33. DO NOT FAKE FUNCTIONALITY

Do not create fake success states simply to make the interface appear functional.

Do not replace API data with hardcoded data unless it already exists as frontend mock data.

Do not silently bypass validation.

Do not disable existing functionality because the UI is being redesigned.

---

# 34. REQUIRED DEVELOPMENT LOOP

This is one of the most important instructions.

You must work in a continuous loop:

```text
INSPECT
↓
PLAN
↓
IMPLEMENT
↓
RUN
↓
TEST
↓
QA
↓
IDENTIFY PROBLEMS
↓
FIX
↓
RUN AGAIN
↓
TEST AGAIN
↓
QA AGAIN
↓
REPEAT
```

Do NOT stop after the first successful build.

---

# 35. PHASED IMPLEMENTATION

Use this order:

## Phase 1 — Audit

Inspect complete frontend.

Document existing problems.

## Phase 2 — Design System

Establish:

- Colors

- Typography

- Spacing

- Radius

- Shadows

- Icons

- Buttons

- Inputs

- Cards

- Motion

## Phase 3 — Core Components

Build/refactor reusable components.

## Phase 4 — Authentication

Revamp:

- Login

- Signup

- OTP

- Password

- Verification

- Forgot password

- Related states

## Phase 5 — Customer Experience

Revamp:

- Home

- Categories

- Search

- Jobs

- Job posting

- Provider discovery

- Provider profile

- Bids

- Booking

- Reviews

- Notifications

- Settings

## Phase 6 — Service Provider Experience

Revamp:

- Dashboard

- Profile

- Jobs

- Search

- Bidding

- Booking

- Certifications

- Verification

- Reviews

- Earnings/status interfaces where already present

## Phase 7 — Admin

Revamp the complete administrative experience.

## Phase 8 — Responsive Pass

Test all supported viewport sizes.

## Phase 9 — Animation Pass

Add tasteful motion and micro-interactions.

## Phase 10 — Accessibility Pass

Audit accessibility.

## Phase 11 — Final QA

Perform full smoke testing and regression testing.

---

# 36. SMOKE TESTING

Before declaring the project finished, test all critical paths.

At minimum:

### Customer

```text
Launch
↓
Authentication
↓
Dashboard
↓
Browse services
↓
Search
↓
View provider
↓
Create/post job
↓
View bids
↓
Select provider
↓
Booking
↓
Review
```

### Service Provider

```text
Launch
↓
Authentication
↓
Dashboard
↓
Profile
↓
Browse jobs
↓
View job
↓
Submit bid
↓
Booking
↓
Job status
↓
Review
```

### Admin

```text
Login
↓
Dashboard
↓
Users
↓
Providers
↓
Verification
↓
Jobs
↓
Categories
↓
Disputes
↓
Analytics
↓
Settings
```

Only test flows that actually exist in the supplied implementation.

Do not invent routes that are not present.

---

# 37. BUG LOOP

If ANY issue is discovered:

```text
BUG FOUND
↓
Identify root cause
↓
Determine whether it is frontend-only
↓
Fix frontend implementation
↓
Run again
↓
Reproduce previous bug
↓
Run regression test
↓
Continue
```

If fixing one component creates a problem elsewhere:

```text
STOP
↓
Inspect affected dependency
↓
Fix consistency issue
↓
Retest both locations
```

Never fix one screen while breaking another.

---

# 38. FINAL QA CHECKLIST

Before delivery, verify:

## UI

- No emojis

- No random icons

- No purple

- No purple-like gradients

- Consistent colors

- Consistent typography

- Consistent spacing

- Consistent cards

- Consistent buttons

- Consistent inputs

- Consistent radii

- Consistent shadows

## UX

- Navigation works

- Forms work

- Buttons work

- Search works

- Filters work

- Modals work

- Loading states work

- Empty states work

- Error states work

- Success states work

## Responsive

- Mobile works

- Tablet works

- Desktop works

- No unintended overflow

- No broken grids

- No clipped content

## Accessibility

- Focus states

- Keyboard navigation

- Contrast

- Labels

- Semantic structure

- Reduced motion

## Technical

- No TypeScript errors

- No build errors

- No runtime errors

- No broken imports

- No missing assets

- No broken routes

- No console errors attributable to the frontend changes

- No unused frontend code introduced

## Backend

Confirm:

```text
NO BACKEND FILE WAS MODIFIED.
NO API CONTRACT WAS CHANGED.
NO DATABASE CODE WAS MODIFIED.
NO AUTHENTICATION LOGIC WAS MODIFIED.
```

---

# 39. VISUAL REGRESSION THINKING

Do not judge each page independently.

The user should feel that every screen belongs to the same product.

Compare:

```text
Login
Dashboard
Profile
Job
Bid
Booking
Review
Settings
Admin
```

against one another.

If one screen looks like it belongs to another application, fix it.

---

# 40. FINAL QUALITY STANDARD

Do not declare completion because:

- The application builds.

- The pages render.

- The colors changed.

- The components were rewritten.

- The first smoke test passed.

Declare completion ONLY when:

1. The entire frontend has been audited.

2. The design system is consistent.

3. All major frontend screens have been revamped.

4. Emojis have been completely removed from UI.

5. Iconography is consistent.

6. Purple/purple-like palettes have been eliminated.

7. Responsive behavior has been verified.

8. Animations are polished and purposeful.

9. Micro-interactions feel natural.

10. Accessibility has been reviewed.

11. Critical user flows have been smoke tested.

12. Regression testing has been completed.

13. Bugs discovered during testing have been fixed.

14. The affected areas have been tested again.

15. No new inconsistencies remain.

16. Backend files remain untouched.

17. The final frontend builds/runs successfully.

---

# 41. FINAL LOOP — NON-NEGOTIABLE

Before delivery, execute this loop repeatedly:

```text
REVAMP
   ↓
BUILD
   ↓
RUN
   ↓
SMOKE TEST
   ↓
QA
   ↓
VISUAL AUDIT
   ↓
RESPONSIVE AUDIT
   ↓
ACCESSIBILITY AUDIT
   ↓
BUG DISCOVERY
   ↓
FIX
   ↓
REBUILD
   ↓
RETEST
   ↓
REGRESSION TEST
   ↓
VISUAL AUDIT AGAIN
   ↓
ANY ISSUE?
 ┌───────────────┐
 │ YES           │
 ↓               │
FIX              │
 ↓               │
TEST AGAIN ──────┘
 │
 NO
 ↓
FINAL QA
 ↓
DELIVERY
```

**The loop does not end when the first test passes.**

It ends only when another complete QA pass produces no meaningful frontend bugs, regressions, visual inconsistencies, responsive failures, accessibility failures, or broken interactions.

---

# 42. DEVELOPER DISCIPLINE

Do not rush.

Do not make superficial cosmetic changes.

Do not rewrite working functionality unnecessarily.

Do not modify backend code.

Do not introduce random dependencies.

Do not use emojis.

Do not use purple.

Do not mix icon libraries without justification.

Do not create inconsistent one-off components.

Do not stop testing after one successful run.

When uncertain, inspect the existing implementation before changing it.

When a change affects multiple screens, test all affected screens.

When a fix creates another issue, fix the new issue and repeat QA.

---

# 43. DELIVERY REPORT

At the end, provide a concise report containing:

### UI Revamp Summary

What was redesigned.

### Design System

Colors, typography, spacing, components and icon strategy.

### Animation

Where animations and Anime.js were used.

### Responsive QA

Viewports tested.

### Functional QA

Critical workflows tested.

### Bugs Fixed

Important issues discovered and resolved.

### Backend Safety Confirmation

Explicitly confirm:

> Backend code was not modified.

### Remaining Issues

Only list issues that genuinely cannot be solved within the frontend scope.

Do not hide known problems.

---

# FINAL COMMAND

Now inspect the supplied Kaarkun project carefully.

Do not begin by blindly editing files.

First understand the frontend architecture and existing implementation.

Then create and apply a cohesive premium design system.

Then progressively revamp the complete frontend.

Preserve all existing frontend functionality and backend contracts.

After every major implementation phase, build/run and test.

After the full revamp, perform complete smoke testing, QA, responsive testing, accessibility testing and visual consistency testing.

Every discovered issue must trigger another:

**FIX → BUILD → TEST → QA → REGRESSION TEST**

cycle.

Continue this process until the frontend is genuinely polished, consistent, stable, responsive and production-quality.

The final product should feel:

**smooth, buttery, soft, emotionally engaging, calm, warm, trustworthy, premium and professionally engineered.**

Do not deliver a superficial redesign.

Deliver a complete frontend transformation.
