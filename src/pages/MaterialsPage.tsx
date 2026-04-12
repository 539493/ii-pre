import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KnowledgeItem } from "@/types/tutor";
import KnowledgePanel from "@/components/KnowledgePanel";

export default function MaterialsPage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);

  const loadKnowledge = useCallback(async () => {
    const { data } = await supabase
      .from("knowledge_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setItems(data as any);
  }, []);

  useEffect(() => {
    loadKnowledge();
  }, [loadKnowledge]);

  return (
    <div className="page-shell">
      <section className="page-hero mb-6">
        <p className="page-kicker">Учебная база</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Материалы и собственные заметки</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Добавляй формулы, определения и краткие конспекты. Они автоматически попадут в контекст ответов и сделают объяснения точнее.
        </p>
      </section>

      <div className="min-h-0 max-w-3xl flex-1">
        <KnowledgePanel items={items} onRefresh={loadKnowledge} />
      </div>
    </div>
  );
}
