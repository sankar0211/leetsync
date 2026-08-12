async function check() {
  const testQuery = `
  query getRecentSubmissionList($username: String!) {
    recentAcSubmissionList(username: $username, limit: 20) {
      id
      title
      titleSlug
      timestamp
    }
  }
  `;

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com",
    },
    body: JSON.stringify({
      query: testQuery,
      variables: { username: "lee215" } // using a highly active user
    })
  });
  
  if (!res.ok) {
    console.error("HTTP Error", res.status);
    return;
  }
  
  const data = await res.json();
  console.log("Recent Submissions Count:", data.data?.recentAcSubmissionList?.length);
  if (data.data?.recentAcSubmissionList?.length > 0) {
    console.log("First submission:", data.data.recentAcSubmissionList[0].titleSlug);
  } else {
    console.log("Response:", JSON.stringify(data, null, 2));
  }
}
check();
