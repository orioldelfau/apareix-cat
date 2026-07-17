const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "data", "restaurant-leads.json");
const ACTIVITY_PATH = path.join(ROOT, "data", "lead-activity.json");

const leadId = readArg("--lead");
const type = readArg("--type");
const summary = readArg("--summary");
const nextAction = readArg("--next-action") || "";
const channel = readArg("--channel") || "manual";
const owner = readArg("--owner") || "oriol";
const date = readArg("--date") || new Date().toISOString().slice(0, 10);
const status = readArg("--status");

main();

function main() {
  if (!leadId) throw new Error("Missing --lead <lead-id>.");
  if (!type) throw new Error("Missing --type <event-type>.");
  if (!summary) throw new Error("Missing --summary <text>.");

  const leadsData = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  const lead = leadsData.leads.find((item) => item.id === leadId);
  if (!lead && leadId !== "batch") throw new Error(`Lead not found: ${leadId}`);

  const activity = readActivity();
  const event = {
    id: `evt-${date}-${slugify(leadId)}-${slugify(type)}-${activity.events.length + 1}`,
    date,
    leadId,
    type,
    channel,
    summary,
    nextAction,
    owner
  };

  activity.events.push(event);
  activity.updatedAt = date;
  fs.writeFileSync(ACTIVITY_PATH, `${JSON.stringify(activity, null, 2)}\n`, "utf8");

  if (status && lead) {
    lead.status = status;
    lead.nextAction = nextAction || lead.nextAction;
    leadsData.updatedAt = date;
    fs.writeFileSync(LEADS_PATH, `${JSON.stringify(leadsData, null, 2)}\n`, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        event: event.id,
        lead: leadId,
        status: status || lead?.status || null
      },
      null,
      2
    )
  );
}

function readActivity() {
  if (!fs.existsSync(ACTIVITY_PATH)) {
    return { updatedAt: date, events: [] };
  }
  return JSON.parse(fs.readFileSync(ACTIVITY_PATH, "utf8"));
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

