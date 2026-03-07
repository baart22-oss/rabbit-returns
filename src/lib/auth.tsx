const login = async (email: string, password: string) => {
  // All users (admin or normal) use the same endpoint
  const data = await api.auth.login(email, password);
  // Ensure token and user are set
  setUser(data.user);
};
