// Core app helpers and backend-ready API abstraction for Zynk

const STORAGE_KEYS = {
  currentIntern: "internflow.currentIntern",
  profileOverride: "internflow.profile",
  leavesOverride: "internflow.leaves",
  currentHr: "internflow.currentHr",
  auth: "internflow.auth",
  policies: "internflow.policies",
  hrInterns: "internflow.hr.interns",
  announcements: "internflow.announcements",
};

function safeGetLocalStorage(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("LocalStorage read failed", e);
    return null;
  }
}

function safeSetLocalStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("LocalStorage write failed", e);
  }
}

// Backend base URL (Spring Boot runs on port 1234 as per API docs)
const API_BASE_URL =
  window.API_BASE_URL || "http://localhost:1234/api";
window.API_BASE_URL = API_BASE_URL;

// Auth helpers (JWT stored in localStorage)
function getAuthSession() {
  return safeGetLocalStorage(STORAGE_KEYS.auth);
}

function setAuthSession(auth) {
  if (!auth || !auth.token) return;
  safeSetLocalStorage(STORAGE_KEYS.auth, auth);
}

function getAuthToken() {
  const auth = getAuthSession();
  return auth && auth.token ? auth.token : null;
}

function getCurrentIntern() {
  const stored = safeGetLocalStorage(STORAGE_KEYS.currentIntern);
  if (stored) return stored;
  return MOCK_PROFILE ? { ...MOCK_PROFILE } : null;
}

function setCurrentIntern(intern) {
  if (!intern) return;
  safeSetLocalStorage(STORAGE_KEYS.currentIntern, intern);
}

function getCurrentHr() {
  const stored = safeGetLocalStorage(STORAGE_KEYS.currentHr);
  if (stored) return stored;
  return MOCK_HR_USER ? { ...MOCK_HR_USER } : null;
}

function setCurrentHr(hr) {
  if (!hr) return;
  safeSetLocalStorage(STORAGE_KEYS.currentHr, hr);
}

function clearAllSessions() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.currentIntern);
    window.localStorage.removeItem(STORAGE_KEYS.profileOverride);
    window.localStorage.removeItem(STORAGE_KEYS.leavesOverride);
    window.localStorage.removeItem(STORAGE_KEYS.currentHr);
     window.localStorage.removeItem(STORAGE_KEYS.auth);
    window.localStorage.removeItem(STORAGE_KEYS.policies);
    window.localStorage.removeItem(STORAGE_KEYS.hrInterns);
    window.localStorage.removeItem(STORAGE_KEYS.announcements);
  } catch (e) {
    console.warn("LocalStorage clear failed", e);
  }
}

// Date + invoice helpers
function formatDateHuman(isoDate) {
  if (!isoDate) return "-";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonthYear(month, year) {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function getCurrentMonthLabel() {
  const now = new Date();
  return now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function calculateWorkingDaysForMonth(month, year, leaves) {
  // Simple approximation: assume 22 working days / month
  const baseWorkingDays = 22;
  const unpaidCount = leaves.filter((l) => l.type === "UNPAID").length;
  return Math.max(0, baseWorkingDays - unpaidCount);
}

function calculateInvoiceNumber(internshipStart, month, year) {
  const start = new Date(internshipStart);
  const target = new Date(year, month - 1, 1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime())) {
    return "INV-000";
  }
  const diffMonths =
    (target.getFullYear() - start.getFullYear()) * 12 +
    (target.getMonth() - start.getMonth());
  const seq = Math.max(0, diffMonths) + 1;
  return `INT-${target.getFullYear()}-${seq.toString().padStart(3, "0")}`;
}

// Low-level backend helpers (used selectively inside apiGet/apiPost)
function backendFetch(path, options) {
  const url = API_BASE_URL + path;
  const opts = options || {};
  const headers = Object.assign({}, opts.headers || {});

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  // Only set JSON content-type for requests with a body
  if (opts.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body || undefined,
  }).then(async (res) => {
    const contentType = res.headers.get("Content-Type") || "";
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        text || `Request failed: ${res.status} ${res.statusText}`
      );
    }
    if (contentType.includes("application/json")) {
      return res.json();
    }
    return res.text();
  });
}

function backendGet(path) {
  return backendFetch(path, { method: "GET" });
}

function backendPost(path, body) {
  return backendFetch(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : "{}",
  });
}

// Backend-ready API abstraction. For now, all calls are mapped to mock helpers.
function apiGet(path) {
  switch (path) {
    case "/intern/profile": {
      // Prefer real backend profile when intern is logged in
      if (getAuthToken && getAuthToken() && typeof backendGet === "function") {
        return backendGet("/interns/me")
          .then(function (profile) {
            // Optionally cache locally
            safeSetLocalStorage(STORAGE_KEYS.profileOverride, profile);
            return profile;
          })
          .catch(function () {
            const override = safeGetLocalStorage(STORAGE_KEYS.profileOverride);
            if (override) return override;
            return mockFetchProfile();
          });
      }
      const override = safeGetLocalStorage(STORAGE_KEYS.profileOverride);
      if (override) return Promise.resolve(override);
      return mockFetchProfile();
    }
    case "/intern/leaves": {
      // If logged in, fetch real leaves from backend and map to UI shape
      if (getAuthToken()) {
        return backendGet("/leaves/my-leaves").then(function (items) {
          items = items || [];
          return items.map(function (l) {
            return {
              id: l.id,
              date: l.leaveDate, // LocalDate -> ISO date string
              reason: l.reason,
              type: l.leaveType, // "PAID" or "UNPAID"
              status:
                l.status === "APPROVED"
                  ? "Approved"
                  : l.status === "REJECTED"
                  ? "Rejected"
                  : "Pending",
            };
          });
        });
      }
      const override = safeGetLocalStorage(STORAGE_KEYS.leavesOverride);
      if (override) return Promise.resolve(override);
      return mockFetchLeaves();
    }
    case "/intern/announcements": {
      const annsOverride = safeGetLocalStorage(STORAGE_KEYS.announcements);
      if (annsOverride) return Promise.resolve(annsOverride);

      // Prefer real active announcements when backend is available
      return backendGet("/announcements/active")
        .then(function (items) {
          items = items || [];
          return items.map(function (a) {
            return {
              id: a.id,
              title: a.title,
              body: a.body,
              tag: "", // backend does not send tag; UI treats it as optional
            };
          });
        })
        .catch(function () {
          return mockFetchAnnouncements();
        });
    }
    case "/intern/invoices":
      return mockFetchInvoices();
    case "/hr/summary":
      return mockFetchHrSummary();
    case "/hr/interns":
      const hrInternsOverride = safeGetLocalStorage(STORAGE_KEYS.hrInterns);
      if (hrInternsOverride) return Promise.resolve(hrInternsOverride);
      return mockFetchHrInterns();
    case "/hr/leaves":
      return mockFetchHrLeaves();
    case "/hr/invoices":
      return mockFetchHrInvoices();
    case "/hr/policies": {
      const override = safeGetLocalStorage(STORAGE_KEYS.policies);
      if (override) return Promise.resolve(override);
      return mockFetchPolicies();
    }
    case "/hr/announcements": {
      const anns = safeGetLocalStorage(STORAGE_KEYS.announcements);
      if (anns) return Promise.resolve(anns);
      return mockFetchAnnouncements();
    }
    default:
      return Promise.reject(new Error(`Unknown GET path: ${path}`));
  }
}

function apiPost(path, body) {
  switch (path) {
    case "/intern/profile":
      // When logged in as intern, send profile updates to backend
      if (getAuthToken && getAuthToken() && typeof backendPost === "function") {
        return backendPost("/interns/me", body).then(function (profile) {
          safeSetLocalStorage(STORAGE_KEYS.profileOverride, profile);
          return profile;
        });
      }
      // Fallback to local mock storage
      return mockSaveProfile(body).then((saved) => {
        safeSetLocalStorage(STORAGE_KEYS.profileOverride, saved);
        return saved;
      });
    case "/intern/leaves":
      // For logged-in interns, send real leave request to backend
      if (getAuthToken()) {
        const payload = {
          leaveDate: body.date,
          reason: body.reason,
        };
        return backendPost("/leaves/request", payload).then(function (l) {
          return {
            id: l.id,
            date: l.leaveDate,
            reason: l.reason,
            type: l.leaveType,
            status:
              l.status === "APPROVED"
                ? "Approved"
                : l.status === "REJECTED"
                ? "Rejected"
                : "Pending",
          };
        });
      }
      // Fallback: pure mock behavior
      return mockRequestLeave(body).then((created) => {
        return mockFetchLeaves().then((all) => {
          safeSetLocalStorage(STORAGE_KEYS.leavesOverride, all);
          return created;
        });
      });
    case "/intern/invoices": {
      // If we have a backend token, delegate to real invoice generation
      if (getAuthToken()) {
        return backendPost("/invoices/generate", {
          month: body.month,
          year: body.year,
        }).then(function (inv) {
          // Map backend invoice entity to the UI invoice shape expected by intern-invoices.js
          return {
            invoiceNumber: inv.invoiceNumber,
            month: body.month,
            year: body.year,
            workingDays: inv.totalWorkingDays,
            paidLeaves: inv.paidLeaves,
            unpaidLeaves: inv.unpaidLeaves,
            baseStipend: inv.stipendAmount,
            unpaidDeduction: 0,
            finalStipend: inv.stipendAmount,
            generatedAt: inv.invoiceDate,
          };
        });
      }
      // Fallback: keep current mock behavior
      return Promise.all([apiGet("/intern/profile"), apiGet("/intern/leaves")])
        .then(([profile, leaves]) =>
          mockGenerateInvoice({
            profile,
            leaves,
            month: body.month,
            year: body.year,
            helpers: {
              calculateWorkingDaysForMonth,
              calculateInvoiceNumber,
            },
          })
        )
        .then((invoice) => invoice);
    }
    case "/hr/leaves/decision":
      return mockDecideLeave(body).then((updated) => updated);
    case "/hr/invoices": {
      return mockGenerateHrInvoice({
        internId: body.internId,
        month: body.month,
        year: body.year,
        helpers: {
          calculateWorkingDaysForMonth,
          calculateInvoiceNumber,
        },
      }).then((invoice) => invoice);
    }
    case "/hr/interns":
      return mockCreateHrIntern(body).then((created) => {
        return mockFetchHrInterns().then((all) => {
          safeSetLocalStorage(STORAGE_KEYS.hrInterns, all);
          return created;
        });
      });
    case "/hr/policies":
      return mockSavePolicies(body).then((saved) => {
        safeSetLocalStorage(STORAGE_KEYS.policies, saved);
        return saved;
      });
    case "/hr/announcements":
      return mockSaveAnnouncements(body.announcements || []).then((list) => {
        safeSetLocalStorage(STORAGE_KEYS.announcements, list);
        return list;
      });
    case "/api/ai/policy-buddy":
      // If logged in, ask real Policy Buddy; otherwise fall back to mock
      if (getAuthToken()) {
        return backendPost("/ai/policy-buddy", {
          question: body.question || "",
        }).then(function (res) {
          return { answer: res.answer || "" };
        });
      }
      return mockAskPolicyBuddy(body.question || "");
    default:
      return Promise.reject(new Error(`Unknown POST path: ${path}`));
  }
}


