import { loadAll, wordCount, lengthOf } from "./lib.mjs";
import { loadVideos } from "./video-content.mjs";

const { stories, articles, dict, errors } = loadAll();
const { videos, errors: videoErrors } = loadVideos();
errors.push(...videoErrors);
for (const t of [...stories, ...articles]) {
  if (!Array.isArray(t.paragraphs)) continue;
  const w = wordCount(t.paragraphs);
  console.log(`${t.type.padEnd(7)} ${t.level} ${t.genre.padEnd(9)} ${String(w).padStart(5)}w ${lengthOf(w).padEnd(6)} ${t.id}`);
}
console.log(`dictionary entries: ${Object.keys(dict).length}`);
for (const video of videos) {
  console.log(`video   ${video.level} ${video.durationSeconds}s ${Array.isArray(video.captions) ? video.captions.length : 0} captions ${video.id}`);
}
if (errors.length) {
  console.log("\nERRORS:\n" + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}
console.log("OK");
