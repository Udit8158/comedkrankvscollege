import { getCollege, listColleges, fullName } from "../src/lib/colleges";

console.log("total:", listColleges().length);
for (const code of ["E095", "E027", "E198", "E217", "E999"]) {
  const c = getCollege(code);
  console.log(code, "→", c ? fullName(c) : "(not found)");
}
