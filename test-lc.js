async function check() {
  const res = await fetch("https://alfa-leetcode-api.onrender.com/sankar0211/acSubmission?limit=10000");
  const data = await res.json();
  console.log("Count:", data.submission?.length);
}
check();
