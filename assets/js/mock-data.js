// Mock data and fake REST-like helpers for Zynk

const MOCK_PROFILE = {
  id: "intern-001",
  name: "Demo Intern",
  email: "demo.intern@example.com",
  internshipStart: "2025-01-01",
  internshipEnd: "2025-06-30",
  stipendPerMonth: 15000,
  role: "Product Intern",
  manager: "Mentor Name",
  bankAccountLast4: "1234",
  pan: "ABCDE1234F",
  aadhaarMasked: "XXXX-XXXX-1234",
  address: "Bangalore, India",
};

let MOCK_LEAVES = [
  {
    id: "L-001",
    date: "2025-01-15",
    type: "PAID",
    status: "Approved",
    reason: "Family event",
  },
  {
    id: "L-002",
    date: "2025-02-03",
    type: "UNPAID",
    status: "Approved",
    reason: "Travel",
  },
  {
    id: "L-003",
    date: "2025-03-10",
    type: "PAID",
    status: "Pending",
    reason: "Medical",
  },
];

const MOCK_ANNOUNCEMENTS = [
  {
    id: "A-001",
    title: "Intern townhall on Friday",
    body: "Join us at 4 PM for a quick sync and Q&A with mentors.",
    tag: "Event",
  },
  {
    id: "A-002",
    title: "Timesheet reminder",
    body: "Please update your weekly log by Monday 10 AM.",
    tag: "Reminder",
  },
  {
    id: "A-003",
    title: "Policy update: Leaves",
    body: "You earn 1 paid leave per month. Unused days carry forward.",
    tag: "Policy",
  },
];

let MOCK_INVOICES = [];

// HR-side mock data
const MOCK_HR_USER = {
  id: "hr-001",
  name: "HR Admin",
  email: "hr.admin@example.com",
  role: "HR",
};

// Simple intern directory (for now just wrap the single MOCK_PROFILE)
const MOCK_INTERNS = [
  {
    id: MOCK_PROFILE.id,
    name: MOCK_PROFILE.name,
    email: MOCK_PROFILE.email,
    role: MOCK_PROFILE.role,
    manager: MOCK_PROFILE.manager,
    internshipStart: MOCK_PROFILE.internshipStart,
    internshipEnd: MOCK_PROFILE.internshipEnd,
    status: "Active",
  },
];

let MOCK_POLICIES = {
  leaves:
    "Interns earn 1 paid leave per month, with unused paid leaves carried forward during the internship. Unpaid leaves may reduce the monthly stipend.",
  stipend:
    "Stipend is paid monthly based on working days; paid leaves do not reduce stipend, unpaid leaves do. Invoices show full breakdown.",
  general:
    "Interns are expected to maintain professional behavior, communicate leave plans in advance, and keep bank/KYC details updated.",
  faqs: [
    {
      id: "FAQ-001",
      question: "How many paid leaves do interns get?",
      answer:
        "Interns get 1 paid leave per month of internship. Unused paid leaves carry forward.",
    },
  ],
};

function mockFetchProfile() {
  return Promise.resolve({ ...MOCK_PROFILE });
}

function mockSaveProfile(profile) {
  Object.assign(MOCK_PROFILE, profile);
  return Promise.resolve({ ...MOCK_PROFILE });
}

function mockFetchLeaves() {
  return Promise.resolve(MOCK_LEAVES.map((l) => ({ ...l })));
}

function mockRequestLeave(leaveRequest) {
  const nextId = `L-${(MOCK_LEAVES.length + 1).toString().padStart(3, "0")}`;
  const newLeave = {
    id: nextId,
    status: "Pending",
    ...leaveRequest,
  };
  MOCK_LEAVES = [newLeave, ...MOCK_LEAVES];
  return Promise.resolve({ ...newLeave });
}

function mockFetchAnnouncements() {
  return Promise.resolve(MOCK_ANNOUNCEMENTS.map((a) => ({ ...a })));
}

function mockFetchInvoices() {
  return Promise.resolve(MOCK_INVOICES.map((inv) => ({ ...inv })));
}

// ---- HR helpers ----

function mockFetchHrSummary() {
  const activeInterns = MOCK_INTERNS.filter((i) => i.status === "Active").length;
  const pendingLeaves = MOCK_LEAVES.filter((l) => l.status === "Pending").length;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const invoicesThisMonth = MOCK_INVOICES.filter(
    (inv) => inv.month === month && inv.year === year
  ).length;

  const activity = [
    {
      id: "ACT-001",
      message: "Mock: Approved a paid leave for Demo Intern.",
    },
    {
      id: "ACT-002",
      message: "Mock: Generated latest invoice for Demo Intern.",
    },
    {
      id: "ACT-003",
      message: "Mock: Updated leave policy text.",
    },
  ];

  return Promise.resolve({
    hr: { ...MOCK_HR_USER },
    counts: {
      activeInterns,
      pendingLeaves,
      invoicesThisMonth,
    },
    activity,
  });
}

function mockFetchHrInterns() {
  return Promise.resolve(MOCK_INTERNS.map((i) => ({ ...i })));
}

function mockCreateHrIntern(payload) {
  const nextId = `intern-${(MOCK_INTERNS.length + 1)
    .toString()
    .padStart(3, "0")}`;
  const intern = {
    id: nextId,
    name: payload.name || "New Intern",
    email: payload.email || "",
    role: payload.role || "Intern",
    manager: payload.manager || "",
    internshipStart: payload.internshipStart || MOCK_PROFILE.internshipStart,
    internshipEnd: payload.internshipEnd || MOCK_PROFILE.internshipEnd,
    stipendPerMonth:
      typeof payload.stipendPerMonth === "number"
        ? payload.stipendPerMonth
        : MOCK_PROFILE.stipendPerMonth,
    status: "Active",
  };
  MOCK_INTERNS.push(intern);
  return Promise.resolve({ ...intern });
}

function mockFetchHrInternById(id) {
  const intern = MOCK_INTERNS.find((i) => i.id === id) || null;
  if (!intern) return Promise.resolve(null);

  // For now reuse single-leave/invoice sets
  const leaves = MOCK_LEAVES.map((l) => ({ ...l }));
  const invoices = MOCK_INVOICES.map((inv) => ({ ...inv }));

  return Promise.resolve({
    intern: { ...intern },
    profile: { ...MOCK_PROFILE },
    leaves,
    invoices,
  });
}

function mockFetchHrLeaves() {
  // Flatten leaves with intern name/email
  const intern = MOCK_INTERNS[0];
  const list = MOCK_LEAVES.map((l) => ({
    ...l,
    internId: intern.id,
    internName: intern.name,
    internEmail: intern.email,
  }));
  return Promise.resolve(list);
}

function mockDecideLeave(payload) {
  const { id, decision } = payload || {};
  if (!id || !decision) return Promise.resolve(null);
  MOCK_LEAVES = MOCK_LEAVES.map((l) =>
    l.id === id
      ? {
          ...l,
          status: decision,
        }
      : l
  );
  return Promise.resolve(
    MOCK_LEAVES.find((l) => l.id === id) ? { ...MOCK_LEAVES.find((l) => l.id === id) } : null
  );
}

function mockFetchHrInvoices() {
  const intern = MOCK_INTERNS[0];
  return Promise.resolve(
    MOCK_INVOICES.map((inv) => ({
      ...inv,
      internId: intern.id,
      internName: intern.name,
      status: "Generated",
    }))
  );
}

function mockGenerateHrInvoice(params) {
  const { internId, month, year, helpers } = params || {};
  if (!internId) return Promise.reject(new Error("internId is required"));

  const intern = MOCK_INTERNS.find((i) => i.id === internId) || MOCK_INTERNS[0];
  return mockGenerateInvoice({
    profile: MOCK_PROFILE,
    month,
    year,
    leaves: MOCK_LEAVES,
    helpers,
  }).then((invoice) => ({
    ...invoice,
    internId: intern.id,
    internName: intern.name,
  }));
}

function mockFetchPolicies() {
  return Promise.resolve(JSON.parse(JSON.stringify(MOCK_POLICIES)));
}

function mockSavePolicies(updated) {
  if (!updated) return Promise.resolve(JSON.parse(JSON.stringify(MOCK_POLICIES)));
  MOCK_POLICIES = {
    ...MOCK_POLICIES,
    ...updated,
  };
  return Promise.resolve(JSON.parse(JSON.stringify(MOCK_POLICIES)));
}

function mockSaveAnnouncements(list) {
  const normalized = Array.isArray(list) ? list : [];
  return Promise.resolve(
    normalized.map((a) => ({
      id: a.id || `A-${Math.random().toString(36).slice(2, 7)}`,
      title: a.title || "",
      body: a.body || "",
      tag: a.tag || "",
    }))
  );
}

function mockAskPolicyBuddy(question) {
  const q = (question || "").toLowerCase();

  // First, see if any FAQ matches roughly
  if (MOCK_POLICIES && Array.isArray(MOCK_POLICIES.faqs)) {
    const match = MOCK_POLICIES.faqs.find((f) => {
      const qText = (f.question || "").toLowerCase();
      return qText && q && q.length > 3 && qText.includes(q.split(" ")[0]);
    });
    if (match) {
      return Promise.resolve({ answer: match.answer || "" });
    }
  }

  if (q.includes("leave") || q.includes("leaves")) {
    return Promise.resolve({
      answer:
        (MOCK_POLICIES && MOCK_POLICIES.leaves) ||
        "Interns earn 1 paid leave per month. Unused paid leaves carry forward during the internship. Unpaid leaves reduce your invoice amount.",
    });
  }

  if (q.includes("stipend") || q.includes("invoice")) {
    return Promise.resolve({
      answer:
        (MOCK_POLICIES && MOCK_POLICIES.stipend) ||
        "Your monthly stipend is calculated as a base stipend minus any unpaid leave deductions. Paid leaves do not reduce your stipend.",
    });
  }

  return Promise.resolve({
    answer:
      (MOCK_POLICIES && MOCK_POLICIES.general) ||
      "I'm your Policy Buddy! Ask me about leaves, invoices, working days, or stipend rules and I'll explain them in simple language.",
  });
}

function mockGenerateInvoice({ profile, month, year, leaves, helpers }) {
  const { calculateWorkingDaysForMonth, calculateInvoiceNumber } = helpers;

  const workingDays = calculateWorkingDaysForMonth(month, year, leaves);
  const paidCount = leaves.filter((l) => l.type === "PAID").length;
  const unpaidCount = leaves.filter((l) => l.type === "UNPAID").length;

  const baseStipend = profile.stipendPerMonth || 0;
  const perDay = workingDays > 0 ? baseStipend / workingDays : 0;
  const unpaidDeduction = perDay * unpaidCount;
  const finalStipend = Math.max(0, Math.round(baseStipend - unpaidDeduction));

  const invoiceNumber = calculateInvoiceNumber(
    profile.internshipStart,
    month,
    year
  );

  const invoice = {
    invoiceNumber,
    month,
    year,
    workingDays,
    paidLeaves: paidCount,
    unpaidLeaves: unpaidCount,
    baseStipend,
    unpaidDeduction: Math.round(unpaidDeduction),
    finalStipend,
    generatedAt: new Date().toISOString(),
  };

  MOCK_INVOICES = [invoice, ...MOCK_INVOICES];
  return Promise.resolve({ ...invoice });
}


