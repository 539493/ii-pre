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
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Материалы</h1>
        <p className="mt-1 text-sm text-muted-foreground">Добавляй заметки, формулы и теорию — AI будет использовать их при объяснении</p>
      </div>
      <div className="flex-1 max-w-2xl min-h-0">
        <KnowledgePanel items={items} onRefresh={loadKnowledge} />
      </div>
    </div>
  );
}
