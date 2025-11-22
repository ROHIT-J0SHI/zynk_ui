// Mock data and fake REST-like helpers for InternFlow

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

function mockAskPolicyBuddy(question) {
  const q = (question || "").toLowerCase();

  if (q.includes("leave") || q.includes("leaves")) {
    return Promise.resolve({
      answer:
        "Interns earn 1 paid leave per month. Unused paid leaves carry forward during the internship. Unpaid leaves reduce your invoice amount.",
    });
  }

  if (q.includes("stipend") || q.includes("invoice")) {
    return Promise.resolve({
      answer:
        "Your monthly stipend is calculated as a base stipend minus any unpaid leave deductions. Paid leaves do not reduce your stipend.",
    });
  }

  return Promise.resolve({
    answer:
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


