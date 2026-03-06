const API_URL = import.meta.env.VITE_API_URL;
const API_SECRET = import.meta.env.VITE_API_SECRET_KEY;


// ADMIN LOGIN
export async function adminLogin(email: string, password: string) {

  const res = await fetch(`${API_URL}/auth/admin-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_SECRET
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("jwt_token", data.token);
  }

  return data;
}


// CLIENT LOGIN
export async function login(email: string, password: string) {

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("jwt_token", data.token);
  }

  return data;
}


// GET ADMIN DATA
export async function getAdminData() {

  const token = localStorage.getItem("jwt_token");

  const res = await fetch(`${API_URL}/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return await res.json();
}
