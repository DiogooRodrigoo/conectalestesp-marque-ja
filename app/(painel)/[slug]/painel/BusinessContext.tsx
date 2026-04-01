"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Busca por owner_id garante que o usuário só acessa o próprio negócio.
      // Valida também contra o slug da URL para evitar acesso cruzado.
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .eq("slug", slug)
        .single();

      if (!data) {
        // Usuário autenticado mas não é dono deste slug — redireciona para login
        router.push("/login");
        return;
      }

      setBusiness(data);
      setLoading(false);
    }
    load();
  }, [slug, router]);

  return (
    <BusinessContext.Provider value={{ business, loading }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
