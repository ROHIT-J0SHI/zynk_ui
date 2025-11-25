// Core app helpers and backend-ready API abstraction for Zynk

const STORAGE_KEYS = {
  currentIntern: "internflow.currentIntern",
  profileOverride: "internflow.profile",
  leavesOverride: "internflow.leaves",
  currentHr: "internflow.currentHr",
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

// Backend-ready API abstraction. For now, all calls are mapped to mock helpers.
function apiGet(path) {
  switch (path) {
    case "/intern/profile": {
      const override = safeGetLocalStorage(STORAGE_KEYS.profileOverride);
      if (override) return Promise.resolve(override);
      return mockFetchProfile();
    }
    case "/intern/leaves": {
      const override = safeGetLocalStorage(STORAGE_KEYS.leavesOverride);
      if (override) return Promise.resolve(override);
      return mockFetchLeaves();
    }
    case "/intern/announcements":
      const annsOverride = safeGetLocalStorage(STORAGE_KEYS.announcements);
      if (annsOverride) return Promise.resolve(annsOverride);
      return mockFetchAnnouncements();
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
      return mockSaveProfile(body).then((saved) => {
        safeSetLocalStorage(STORAGE_KEYS.profileOverride, saved);
        return saved;
      });
    case "/intern/leaves":
      return mockRequestLeave(body).then((created) => {
        return mockFetchLeaves().then((all) => {
          safeSetLocalStorage(STORAGE_KEYS.leavesOverride, all);
          return created;
        });
      });
    case "/intern/invoices": {
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
      return mockAskPolicyBuddy(body.question || "");
    default:
      return Promise.reject(new Error(`Unknown POST path: ${path}`));
  }
}


