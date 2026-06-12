import { getCollege } from "../src/lib/colleges";

const codes = ["E019", "E027", "E028", "E040", "E077", "E095", "E125", "E142", "E164"];
for (const code of codes) {
  const c = getCollege(code);
  const id = c?.podcast?.youtubeId ?? "NONE";
  const title = c?.podcast?.title ?? "—";
  console.log(`${code}  ${c?.name?.slice(0, 38).padEnd(38)}  ${id}  ${title}`);
}
