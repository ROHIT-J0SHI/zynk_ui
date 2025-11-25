## Zynk Intern Frontend Plan

### Scope
- Build only the **intern-facing frontend** first (playful "intern vibes").
- Use **plain HTML + Tailwind CSS (CDN) + JavaScript** with clean structure so we can plug in backend APIs later.
- Design UI so all data currently comes from **mock JSON/local state**, but all actions map cleanly to future REST endpoints.

### Tech & Project Structure
- **Tech stack**
  - `index.html` – entry/login (for now, simple role selection / mock login).
  - `intern-dashboard.html` – intern home with key cards + Policy Buddy chat.
  - `intern-profile.html`.
  - `intern-leaves.html`.
  - `intern-invoices.html`.
  - `assets/css/` (optional custom styles if needed).
  - `assets/js/app.js` – shared helpers: base URL, fake auth, utility functions.
  - `assets/js/mock-data.js` – temporary static data structures.
  - `assets/js/intern-dashboard.js`, `intern-profile.js`, `intern-leaves.js`, `intern-invoices.js` – page-specific logic.

- **Backend-ready API design (no actual calls yet)**
  - Plan fetch/post functions in `app.js` like `apiGet(path)`, `apiPost(path, body)` that **today use mock data**, later switch to `fetch` with real URLs like `/api/intern/profile`, `/api/intern/leaves`, `/api/intern/invoices`, `/api/ai/policy-buddy`.

### Visual & UX Design Direction
- **Overall style**
  - Light theme, playful colors (soft gradients, rounded cards, subtle glassmorphism panels).
  - Use Tailwind for spacing, typography, and layout (`flex`, `grid`, `gap`, etc.).

- **Layout pattern**
  - Sticky **left sidebar** with logo, navigation (Dashboard, Profile, Leaves, Invoices).
  - **Top bar** with greeting, current month, and avatar.
  - Main area uses **cards** for information, with subtle shadows and hover effects.

- **Reusable components**
  - Card container classes for dashboards.
  - Primary/secondary button classes.
  - Form control styles for inputs, selects, and textareas.

### Pages & Features (Intern Side)

#### 1. `index.html` – Mock Login / Entry
- Simple landing page that feels like a product: hero, short tagline, "Enter Intern Portal" button.
- For hackathon, clicking the button stores a dummy intern object in `localStorage` and redirects to `intern-dashboard.html`.

#### 2. `intern-dashboard.html` – Intern Home + Policy Buddy
- **UI sections**
  - Welcome card: intern name, internship period, current month, quick stats (stipend, remaining paid leaves, next invoice status).
  - Announcements strip/card: shows a few active announcements (mock for now).
  - Quick stats cards: "Paid leaves left", "Unpaid leaves", "Next invoice", etc.
  - **Policy Buddy chat panel**:
    - Chat-style UI: message bubbles (user vs AI), scrollable area.
    - Input box + "Ask" button.

- **JS behavior**
  - Load intern profile and leave data from `mock-data.js`.
  - Compute and display quick stats on load.
  - Chat component:
    - For now, respond with canned or rule-based messages.
    - Expose `askPolicyBuddy(question)` which later will call `/api/ai/policy-buddy` and display response.

#### 3. `intern-profile.html` – Onboarding & Details
- **UI layout**
  - Multi-section form in cards: Personal Info, Internship Details, Stipend Info, Documents (PAN/Aadhaar numbers, bank details, address, signature upload placeholder).
  - Use progress indicator or section titles for better UX.

- **JS behavior**
  - On load, prefill from `mock-data.js`.
  - Validate fields client-side (basic required, formats for account/PAN style).
  - On "Save", call a dummy `saveProfile(data)` that currently stores to `localStorage` and later will POST to `/api/intern/profile`.

#### 4. `intern-leaves.html` – Leave Management
- **UI layout**
  - Top summary cards: "Paid leave balance", "Paid used", "Unpaid total".
  - Leave request form: date picker (single date), reason textarea, submit button.
  - Table/list of leave requests with status, type (PAID/UNPAID), date, reason.

- **JS behavior**
  - Load existing leaves from `mock-data.js` / `localStorage`.
  - Render balances based on simple JS logic mirroring final policy (1 paid/month, carry-forward).
  - On request submit, add a new entry with status `Pending` in mock data, and recompute balances.
  - Expose endpoints-to-be like `requestLeave(body)` → later POST `/api/intern/leaves`.

#### 5. `intern-invoices.html` – Automated Invoice UI
- **UI layout**
  - Month/year selector (dropdowns or calendar-like).
  - Summary card showing: billing period (From/Till), working days, paid/unpaid leaves, calculated stipend.
  - Invoice preview card styled similar to current invoice template (logo, intern details, line items, totals).
  - "Download PDF" button.

- **JS behavior**
  - When month/year is selected:
    - Validate that it is within internship period (using mock profile data).
    - Compute `months_since_join` and display a 3-digit invoice number.
    - Compute working days based on calendar + mock leave data.
    - Compute final stipend and show all details.
  - Implement a wrapper for `jsPDF` + `html2canvas` to export the invoice card as PDF (wired on click, using mock data for now).
  - Prepare a function `generateInvoice(month, year)` that later will call `/api/intern/invoices`.

### JS Architecture & Backend Integration Hooks
- **`app.js`**
  - `getCurrentIntern()` / `setCurrentIntern()` using `localStorage`.
  - `apiGet(path)` / `apiPost(path, body)` currently returning Promises that resolve mock data; later swapped for real `fetch` calls.
  - Utility functions: date formatting, working day calculator, invoice number calculator.

- **`mock-data.js`**
  - Static intern profile object, leaves array, announcements array, sample invoices.
  - Small layer that mimics REST responses (e.g., `mockFetchProfile()`, `mockFetchLeaves()`), so swapping to real backend later is easy.

### Implementation Phases
1. **Skeleton setup**
   - Create basic HTML files with Tailwind CDN and a shared playground layout (sidebar + topbar + content area).
2. **Shared layout & theme**
   - Finalize color palette, typography, and card/button styles with Tailwind utility classes.
   - Implement responsive behavior (mobile: collapsible sidebar, stacked cards).
3. **Dashboard + Policy Buddy**
   - Implement dashboard cards and announcements.
   - Build chat UI and wire to a mock `askPolicyBuddy` function.
4. **Profile (Onboarding)**
   - Implement full profile form with validations and save-to-local behavior.
5. **Leaves module**
   - Implement leave balances, list, and request form using mock data.
6. **Invoices module**
   - Implement month/year selection, calculations, preview card, and PDF export.
7. **API abstraction layer**
   - Replace direct mock calls with `apiGet`/`apiPost` functions so backend connection becomes a simple implementation swap.

### How We’ll Connect to Backend Later
- Replace `mock-data.js` calls inside `apiGet`/`apiPost` with real `fetch` to Spring Boot endpoints.
- Keep UI logic the same: pages will call `apiGet('/intern/profile')`, etc., so no major refactor is needed.
- Add simple auth handling (JWT or session) by attaching a token from `localStorage` to all `fetch` requests.