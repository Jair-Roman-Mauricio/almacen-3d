// Audit helper: emits the exact Unicode L/N ranges of the pinned Node runtime.
// Use only when authoring a new migration; never rewrite an applied migration.
const ranges = [];
let start = -1;
let previous = -1;
for (let point = 0; point <= 0x10ffff; point++) {
  if (/^[\p{L}\p{N}]$/u.test(String.fromCodePoint(point))) {
    if (start < 0) start = point;
    previous = point;
  } else if (start >= 0) {
    ranges.push([start, previous]); start = -1;
  }
}
if (start >= 0) ranges.push([start, previous]);
const characters = ranges.map(([first,last]) => String.fromCodePoint(first) + (first === last ? '' : '-' + String.fromCodePoint(last))).join('');
console.log(JSON.stringify({unicode:process.versions.unicode,pattern:`^[${characters}_./-]+$`}));
