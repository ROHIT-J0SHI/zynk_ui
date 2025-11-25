## Zynk HR Frontend Plan

### Scope
- Build the **HR-facing frontend** (single HR/People Ops role) parallel to the intern portal.
- Use **plain HTML + Tailwind CSS (CDN) + JavaScript**, with clean structure so we can plug in backend APIs later.
- Design UI so all data currently comes from **mock JSON/local state**, but all actions map cleanly to future REST endpoints for HR.

### Tech & Project Structure
- **Tech stack**
  - `hr-index.html` – entry/login for HR (mock HR login).
  - `hr-dashboard.html` – HR home with overview metrics and shortcuts.
  - `hr-interns.html` – intern directory & details.
  - `hr-leaves.html` – leave approval console.
  - `hr-invoices.html` – invoice management.
  - `hr-policies.html` – policy/FAQ editor used by Policy Buddy.
  - Reuse `assets/css/styles.css`, `assets/js/theme.js`.
  - `assets/js/app.js` – shared helpers: base URL, fake auth (intern + HR), utility functions, API abstraction.
  - `assets/js/mock-data.js` – temporary static data structures for HR side.
  - `assets/js/hr-dashboard.js`, `hr-interns.js`, `hr-leaves.js`, `hr-invoices.js`, `hr-policies.js` – page-specific logic.

- **Backend-ready API design (no actual calls yet)**
  - HR-facing fetch/post functions in `app.js` like:
    - `apiGet('/hr/summary')`
    - `apiGet('/hr/interns')`, `apiGet('/hr/interns/{id}')`
    - `apiGet('/hr/leaves')`, `apiPost('/hr/leaves/decision')`
    - `apiGet('/hr/invoices')`, `apiPost('/hr/invoices/generate')`
    - `apiGet('/hr/policies')`, `apiPost('/hr/policies')`
  - Today these use mock data; later they switch to real URLs like:
    - `/api/hr/interns`, `/api/hr/leaves`, `/api/hr/invoices`, `/api/hr/policies`, `/api/ai/policy-buddy/admin`.

### Visual & UX Design Direction
- **Overall style**
  - Same light, playful theme and pink `brand` palette as intern side.
  - Slightly more “control panel” vibe: more tables, filters, and status chips, but still friendly.

- **Layout pattern**
  - Sticky **left sidebar** with logo, role label (e.g. “HR Console”), navigation:
    - HR Dashboard, Interns, Leaves, Invoices, Policies.
  - **Top bar** with HR name, role, and optional date range/filters.
  - Main area uses **cards**, **metric tiles**, and **tables** with filters and bulk actions.

- **Reusable components**
  - Metric cards (Total interns, Pending leaves, Invoices this month).
  - Filter toolbar (search, dropdowns, date range, chips).
  - Approval buttons (Approve/Reject, Mark Paid, Publish/Unpublish).
  - Badge styles for statuses (Pending/Approved/Rejected, Paid/Unpaid).

### Pages & Features (HR Side)

#### 1. `hr-index.html` – Mock HR Login / Entry
- **UI**
  - Simple landing that clearly targets HR: logo, tagline (“Zynk HR Console”), short description.
  - Two main call-to-actions on main `index.html`:
    - “Enter Intern Portal” (existing).
    - “Enter HR Console” → goes to `hr-index.html` or directly to `hr-dashboard.html`.
- **JS behavior**
  - Clicking “Enter HR Console” stores a dummy HR object in `localStorage`:
    - e.g. `{ id: 'hr-001', name: 'HR Admin', role: 'HR' }`
  - Redirect to `hr-dashboard.html`.
  - Helpers: `getCurrentHr()`, `setCurrentHr()` in `app.js`.

#### 2. `hr-dashboard.html` – HR Overview
- **UI sections**
  - Welcome card: HR name, role, quick sentence about responsibilities.
  - KPI cards:
    - “Active interns”
    - “Pending leave requests”
    - “Invoices generated this month”
  - Recent activity list:
    - Recent approvals/rejections, policy updates, newly added interns (mock for now).
  - Shortcut cards:
    - Quick links to Interns, Leaves, Invoices, Policies pages.

- **JS behavior**
  - Load HR summary from `mock-data.js` via `apiGet('/hr/summary')`.
  - Compute counts using shared mock data:
    - `activeInternCount`, `pendingLeavesCount`, `invoicesThisMonth`.
  - Render recent activity list from a mock `HR_ACTIVITY` array.

#### 3. `hr-interns.html` – Intern Directory & Profiles
- **UI layout**
  - Left panel:
    - Search box (by name/email).
    - Filters: manager, status (Active/Completed).
    - List of interns (name, role, manager, start date, status).
  - Right detail panel for selected intern:
    - Profile summary (same fields as intern profile view).
    - Current leave balance snapshot.
    - Last invoice summary (month, amount, status).
    - Buttons: “Open full profile (as intern)”, “View all leaves”, “View invoices”.

- **JS behavior**
  - `apiGet('/hr/interns')` → returns array of intern summaries (derived from mock intern profiles).
  - `apiGet('/hr/interns/{id}')` → returns detailed intern profile, leaves, invoices.
  - Filters applied client-side on mock data.
  - Clicking list item updates right panel with selected intern data.

#### 4. `hr-leaves.html` – Leave Management & Approvals
- **UI layout**
  - Top filter bar:
    - Status chips: All, Pending, Approved, Rejected.
    - Type: Paid / Unpaid.
    - Date range picker (basic start/end dates or month selector).
  - Main table:
    - Columns: Intern name, Date, Type, Reason, Current status, Action buttons.
  - Side/bottom panel:
    - Selected intern’s leave stats:
      - Paid used / balance.
      - Unpaid total.
      - Short note or last invoice impact.

- **JS behavior**
  - `apiGet('/hr/leaves')` → flattens all leave requests across interns.
  - For each row, Approve/Reject:
    - `apiPost('/hr/leaves/decision', { id, decision })`.
    - Update mock data status + recompute balances.
  - Status and type filters apply on the client.
  - When selecting a row, fetch intern-specific stats (from same mock structures).

#### 5. `hr-invoices.html` – Invoice Management
- **UI layout**
  - Filter controls:
    - Month/year selector.
    - Intern dropdown (All, specific intern).
    - Status: Generated / Paid / Pending.
  - Invoice list/table:
    - Columns: Intern, Month, Invoice number, Amount, Status, Actions.
  - Right/Bottom preview:
    - Reuse intern invoice card layout to preview selected invoice.
    - Action buttons: “Mark as Paid (future backend)”, “Download PDF” (reuse existing PDF export).

- **JS behavior**
  - `apiGet('/hr/invoices')` → list of all invoices from `MOCK_INVOICES` with HR-facing fields.
  - `apiPost('/hr/invoices/generate', { internId, month, year })`:
    - Calls same `mockGenerateInvoice` used on intern side, but for a chosen intern.
  - Filter + select behavior purely client-side for now.
  - Use invoice JSON to populate preview card.

#### 6. `hr-policies.html` – Policy & FAQ Management
- **UI layout**
  - Sections:
    - “Leave Policy”
    - “Stipend & Invoices”
    - “General & Code of Conduct”
  - Each section:
    - Editable title + textarea for policy text.
  - Policy Buddy FAQ:
    - Simple list of Q&A entries:
      - Question input.
      - Answer textarea.
    - Add/Edit/Delete in the UI.

- **JS behavior**
  - `apiGet('/hr/policies')` → returns `MOCK_POLICIES` (policy sections + FAQ entries).
  - `apiPost('/hr/policies', body)` → saves updated policies/FAQ to `localStorage` via mock.
  - Adjust (later) `mockAskPolicyBuddy(question)` to:
    - First look into HR-defined FAQ (best matches).
    - Fall back to generic hardcoded answers if nothing matches.

### JS Architecture & Backend Integration Hooks (HR)
- **`app.js` additions**
  - HR auth:
    - `getCurrentHr()` / `setCurrentHr()` using `localStorage` (similar to intern).
  - HR API routes inside `apiGet` / `apiPost`:
    - Map HR paths to mock functions:
      - `mockFetchHrSummary()`
      - `mockFetchHrInterns()`, `mockFetchHrInternById(id)`
      - `mockFetchHrLeaves()`, `mockDecideLeave(payload)`
      - `mockFetchHrInvoices()`, `mockGenerateHrInvoice(payload)`
      - `mockFetchPolicies()`, `mockSavePolicies(payload)`

- **`mock-data.js` additions**
  - `MOCK_HR_USER` – HR profile object.
  - `MOCK_INTERNS` – directory of intern profiles (can reuse existing intern mock + add a small list).
  - `MOCK_HR_LEAVES_VIEW` – flattened view of intern leaves with intern metadata.
  - `MOCK_HR_INVOICES_VIEW` – invoices plus HR-specific fields (status, markedPaid flag).
  - `MOCK_POLICIES` – structure with sections + FAQ entries.
  - Functions:
    - `mockFetchHrSummary()`
    - `mockFetchHrInterns()`, `mockFetchHrInternById(id)`
    - `mockFetchHrLeaves()`, `mockDecideLeave({ id, decision })`
    - `mockFetchHrInvoices()`, `mockGenerateHrInvoice({...})`
    - `mockFetchPolicies()`, `mockSavePolicies(updated)`

### Implementation Phases
1. **Skeleton setup**
   - Create HR HTML files with Tailwind CDN and shared layout (sidebar + topbar + content).
   - Add HR navigation and basic route wiring (links between HR pages).

2. **Shared layout & theme**
   - Reuse pink brand palette and glassmorphism cards via `theme.js` + `styles.css`.
   - Ensure both intern and HR UIs feel like the same product.

3. **Mock data & API layer**
   - Extend `mock-data.js` with HR mocks (intern directory, cross-intern leaves, invoices, policies).
   - Extend `app.js` `apiGet`/`apiPost` to use these mocks for `/hr/...` paths.

4. **HR Dashboard**
   - Implement metrics cards and recent activity feed wired to mock HR summary.

5. **Intern directory & leave approvals**
   - Implement `hr-interns.html` + `hr-interns.js` for list + detail view.
   - Implement `hr-leaves.html` + `hr-leaves.js` for approval workflow.

6. **Invoices module (HR)**
   - Implement filter + list + preview, and generation for any intern using shared generator + PDF export.

7. **Policies & Policy Buddy integration**
   - Implement CRUD UI for policies and FAQ on `hr-policies.html`.
   - Update Policy Buddy mock to read from HR-defined policies/FAQ so backend can later plug in a real AI/RAG backend easily.

8. **How We’ll Connect to Backend Later**
   - Replace `/hr/...` mock handlers in `app.js` with real `fetch` calls to Spring Boot.
   - Keep UI logic the same: pages only call `apiGet('/hr/...')` and `apiPost('/hr/...')`.
   - Extend auth handling to differentiate intern vs HR (JWT/roles) but leave UI contracts unchanged.
