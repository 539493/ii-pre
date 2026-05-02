import { useState, useEffect, useCallback } from "react";
import { KnowledgeItem } from "@/types/tutor";
import KnowledgePanel from "@/components/KnowledgePanel";
import { fetchKnowledgeItems } from "@/services/tutorData";

export default function MaterialsPage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);

  const loadKnowledge = useCallback(async () => {
    try {
      setItems(await fetchKnowledgeItems());
    } catch {
      setItems([]);
    }
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
