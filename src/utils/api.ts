// Admin login API call function for frontend
export async function adminLogin() {
  const adminSecretKey = import.meta.env.VITE_API_SECRET_KEY;
  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminSecretKey }),
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('jwt_token', data.token); // Save admin token
  }
  return data;
}

// Example login
export async function login(email: string, password: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('jwt_token', data.token);
  }
  return data;
}

// Example of protected call
export async function getAdminData() {
  const token = localStorage.getItem('jwt_token');
  const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}
