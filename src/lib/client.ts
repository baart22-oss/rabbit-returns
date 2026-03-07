export const api = {
  admin: {
    dashboard: () => fetch(buildUrl('/admin/dashboard'), { headers: authHeaders() }).then(handleResponse),
    investments: () => fetch(buildUrl('/admin/investments'), { headers: authHeaders() }).then(handleResponse),
    updateInvestment: (id, body) =>
      fetch(buildUrl(`/admin/investments/${id}`), { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    withdrawals: () => fetch(buildUrl('/admin/withdrawals'), { headers: authHeaders() }).then(handleResponse),
    updateWithdrawal: (id, body) =>
      fetch(buildUrl(`/admin/withdrawals/${id}`), { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    raffle: () => fetch(buildUrl('/admin/raffle'), { headers: authHeaders() }).then(handleResponse),
    updateRaffle: (id, body) =>
      fetch(buildUrl(`/admin/raffle/${id}`), { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    users: () => fetch(buildUrl('/admin/users'), { headers: authHeaders() }).then(handleResponse),
    promoteUser: (id) =>
      fetch(buildUrl(`/admin/users/${id}/promote`), { method: 'PATCH', headers: authHeaders() }).then(handleResponse),
  },
  // ...other api endpoints...
};
