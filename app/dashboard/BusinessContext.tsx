"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Business } from "@/types/database";

interface BusinessContextValue {
  business: Business | null;
  loading: boolean;
}

const BusinessContext = createContext<BusinessContextValue>({
  business: null,
  loading: true,
});

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      setBusiness(data ?? null);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <BusinessContext.Provider value={{ business, loading }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
