import { createContext, useContext, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('bp_session');
    return raw ? JSON.parse(raw) : null;
  });

  function persistSession(data) {
    const nextSession = {
      token: data.token,
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      companyId: data.companyId,
    };
    setSession(nextSession);
    localStorage.setItem('bp_session', JSON.stringify(nextSession));
    return nextSession;
  }

  async function login(email, password) {
    const data = await api.login(email, password);
    return persistSession(data);
  }

  // Registro de un cliente nuevo: crea su empresa y usuario, y el
  // backend devuelve el mismo shape que /login, así que queda con
  // sesión iniciada de inmediato (ver AuthService.register).
  async function register(fields) {
    const data = await api.register(fields);
    return persistSession(data);
  }

  function logout() {
    setSession(null);
    localStorage.removeItem('bp_session');
  }

  return (
    <AuthContext.Provider value={{ session, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
