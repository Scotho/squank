export async function fetchPrivateUserData() {
  const token = sessionStorage.getItem('access_token');
  if (!token) throw new Error('Missing token');

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
  if (result.errors) throw new Error(result.errors[0].message);
  return result.data?.userData?.currentUser;
}
