const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BACKLOG_PATH = path.join(ROOT, "data", "operator-backlog.json");

const backlog = JSON.parse(fs.readFileSync(BACKLOG_PATH, "utf8"));
const now = [...backlog.now].sort((a, b) => a.priority - b.priority);

console.log(`# Apareix Operator Status`);
console.log("");
console.log(`Objective: ${backlog.objective}`);
console.log(`Strategy: ${backlog.currentStrategy}`);
console.log(`Budget: ${backlog.budget.monthlyTargetEur}-${backlog.budget.monthlyMaxEur} EUR/month excluding ads and already-paid tools.`);
console.log(`North Star: ${backlog.northStar.target30Days} paying pilot in 30 days, ${backlog.northStar.target90Days} in 90 days.`);
console.log("");
console.log("## Next Actions");

for (const item of now.slice(0, 5)) {
  console.log(`- [${item.id}] P${item.priority} ${item.area}: ${item.title}`);
  console.log(`  Why: ${item.why}`);
  console.log(`  Done: ${item.definitionOfDone}`);
}

console.log("");
console.log("## Constraints");
for (const constraint of backlog.constraints) {
  console.log(`- ${constraint}`);
}
