// Example login
export async function login(email: string, password: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (res.ok) {
    // Save token to localStorage/sessionStorage
    localStorage.setItem('jwt_token', data.token); // data.token should be returned by backend
  }
  return data;
}

// Example of protected call
export async function getAdminData() {
  const token = localStorage.getItem('jwt_token');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}
