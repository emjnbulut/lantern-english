// Publishes ONLY the visitor-facing site (index.html, assets/, data/, manifest, sw.js, LICENSE) to a
// separate public git repository (e.g. for GitHub Pages). The private source repo — content/, drafts/,
// handoff notes, git history — is never pushed there.
// Usage: node tools/publish-site.mjs <remote-url> [branch=main]
// Example: node tools/publish-site.mjs https://github.com/emjnbulut/lantern-english-site.git
// The target repo must already exist. Run `node tools/build.mjs` first so data/ is current.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT } from "./lib.mjs";

const remote = process.argv[2];
const branch = process.argv[3] || "main";
if (!remote) { console.error("Usage: node tools/publish-site.mjs <remote-url> [branch]"); process.exit(1); }

const site = path.join(ROOT, "site");
execFileSync(process.execPath, [path.join(ROOT, "tools/make-site.mjs"), site], { stdio: "inherit" });

const git = (...args) => execFileSync("git", args, { cwd: site, stdio: "inherit" });
git("init", "-q", "-b", branch);
git("add", "-A");
git("-c", "user.name=emjn", "-c", "user.email=noreply@users.noreply.github.com", "commit", "-q", "-m", `Publish site ${new Date().toISOString().slice(0, 10)}`);
git("remote", "add", "origin", remote);
git("push", "--force", "origin", branch);
fs.rmSync(path.join(site, ".git"), { recursive: true, force: true });
console.log(`Published ${site} → ${remote} (${branch})`);
