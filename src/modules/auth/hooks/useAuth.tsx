import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  activeRole: 'customer' | 'vendor';
  loading: boolean;
  setActiveRole: (role: 'customer' | 'vendor') => void;
  signOut: () => Promise<void>;
  updateProfile: (data: {
    fullName?: string;
    phone?: string;
    zipCode?: string;
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  }) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(authUser: any): UserProfile {
  const meta = authUser.user_metadata || {};
  return {
    id: authUser.id,
    email: authUser.email || '',
    fullName: meta.full_name || meta.fullName || 'Usuário',
    role: meta.role || 'customer',
    phone: meta.phone || '',
    zipCode: meta.zip_code || meta.zipCode || '',
    address: meta.address || '',
    number: meta.number || '',
    complement: meta.complement || '',
    neighborhood: meta.neighborhood || '',
    city: meta.city || '',
    state: meta.state || '',
    lat: meta.lat || undefined,
    lng: meta.lng || undefined,
    user_metadata: meta,
    createdAt: authUser.created_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<'customer' | 'vendor'>('customer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const mappedUser = mapSupabaseUser(session.user);
        setUser(mappedUser);
        setActiveRole(mappedUser.role === 'vendor' ? 'vendor' : 'customer');
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const mappedUser = mapSupabaseUser(session.user);
          setUser(mappedUser);
          setActiveRole(mappedUser.role === 'vendor' ? 'vendor' : 'customer');
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (data: {
    fullName?: string;
    phone?: string;
    zipCode?: string;
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  }) => {
    const updatePayload: any = {};
    if (data.fullName !== undefined) updatePayload.full_name = data.fullName;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.zipCode !== undefined) updatePayload.zip_code = data.zipCode;
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.number !== undefined) updatePayload.number = data.number;
    if (data.complement !== undefined) updatePayload.complement = data.complement;
    if (data.neighborhood !== undefined) updatePayload.neighborhood = data.neighborhood;
    if (data.city !== undefined) updatePayload.city = data.city;
    if (data.state !== undefined) updatePayload.state = data.state;
    if (data.lat !== undefined) updatePayload.lat = data.lat;
    if (data.lng !== undefined) updatePayload.lng = data.lng;

    const { error } = await supabase.auth.updateUser({
      data: updatePayload
    });

    if (error) {
      console.warn('Erro ao atualizar dados no Supabase auth:', error);
    }

    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        fullName: data.fullName !== undefined ? data.fullName : prev.fullName,
        phone: data.phone !== undefined ? data.phone : prev.phone,
        zipCode: data.zipCode !== undefined ? data.zipCode : prev.zipCode,
        address: data.address !== undefined ? data.address : prev.address,
        number: data.number !== undefined ? data.number : prev.number,
        complement: data.complement !== undefined ? data.complement : prev.complement,
        neighborhood: data.neighborhood !== undefined ? data.neighborhood : prev.neighborhood,
        city: data.city !== undefined ? data.city : prev.city,
        state: data.state !== undefined ? data.state : prev.state,
        lat: data.lat !== undefined ? data.lat : prev.lat,
        lng: data.lng !== undefined ? data.lng : prev.lng,
        user_metadata: {
          ...prev.user_metadata,
          ...updatePayload
        }
      };
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, loading, setActiveRole, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
