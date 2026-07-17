const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const ACTIVITY_PATH = path.join(ROOT, "data", "lead-activity.json");

const leadsData = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
const activity = fs.existsSync(ACTIVITY_PATH)
  ? JSON.parse(fs.readFileSync(ACTIVITY_PATH, "utf8"))
  : { events: [] };

const leads = leadsData.leads;
const events = activity.events;
const byStatus = groupCount(leads, "status");
const byPriority = groupCount(leads, "priority");
const highPriority = leads.filter((lead) => lead.priority === "high");
const contactable = leads.filter((lead) => lead.publicContact && lead.publicContact.trim());
const touchedLeadIds = new Set(events.map((event) => event.leadId).filter((id) => id !== "batch"));

console.log("# Lead Pipeline Status");
console.log("");
console.log(`Leads totals: ${leads.length}`);
console.log(`Leads amb contacte public: ${contactable.length}`);
console.log(`Leads high priority: ${highPriority.length}`);
console.log(`Leads amb activitat registrada: ${touchedLeadIds.size}`);
console.log("");
console.log("## Per Estat");
for (const [status, count] of Object.entries(byStatus)) {
  console.log(`- ${status}: ${count}`);
}
console.log("");
console.log("## Per Prioritat");
for (const [priority, count] of Object.entries(byPriority)) {
  console.log(`- ${priority}: ${count}`);
}
console.log("");
console.log("## Proxims 10 Candidats Contactables");
for (const lead of nextContactable(leads).slice(0, 10)) {
  console.log(`- ${lead.id} | ${lead.name} | ${lead.area} | ${lead.publicContact}`);
  console.log(`  Next: ${lead.nextAction}`);
}
console.log("");
console.log("## Ultimes Activitats");
for (const event of events.slice(-8).reverse()) {
  console.log(`- ${event.date} | ${event.leadId} | ${event.type} | ${event.summary}`);
  if (event.nextAction) console.log(`  Next: ${event.nextAction}`);
}

function groupCount(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field] || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function nextContactable(items) {
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return [...items]
    .filter((lead) => ["identified", "audited", "contact_ready"].includes(lead.status))
    .filter((lead) => lead.publicContact && lead.publicContact.trim())
    .sort((a, b) => {
      const statusRank = statusScore(a.status) - statusScore(b.status);
      if (statusRank !== 0) return statusRank;
      return (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
    });
}

function statusScore(status) {
  if (status === "contact_ready") return 0;
  if (status === "audited") return 1;
  return 2;
}

