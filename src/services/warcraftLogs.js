// src/services/warcraftLogs.js
export async function fetchUserReports() {
  const token = sessionStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found.');
  }

  const query = `
    {
      userData {
        currentUser {
          id
          name
        }
      }
    }
  `;

  const response = await fetch('https://www.warcraftlogs.com/api/v2/user', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const result = await response.json();
  return result.data?.userData?.currentUser;
}
