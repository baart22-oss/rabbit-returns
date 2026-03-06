router.post('/admin-login', async (req, res) => {
  const { adminSecretKey } = req.body;

  if (!adminSecretKey) {
    return res.status(400).json({ error: 'adminSecretKey is required' });
  }

  if (adminSecretKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: 'Invalid admin secret key' });
  }

  // Sign a token for the admin, you can customize payload as needed
  const token = signToken({ id: 'admin', email: 'admin@example.com', role: 'admin' });
  return res.json({ token, user: { id: 'admin', email: 'admin@example.com', role: 'admin' } });
});
// Example login
export async function login(email: string, password: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
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
  const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}
