
CREATE TABLE IF NOT EXISTS public.knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tutor_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_prompt text NOT NULL,
  knowledge_snapshot text,
  response_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_knowledge_items" ON public.knowledge_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tutor_generations" ON public.tutor_generations FOR ALL USING (true) WITH CHECK (true);
