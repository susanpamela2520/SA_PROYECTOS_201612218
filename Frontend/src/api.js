const BASE = "http://localhost:3000";

export async function register(data) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function login(data) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function pingProtected() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}/api/protected/ping`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
