CREATE TABLE public.progress_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text NOT NULL,
  topic text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_progress_records" ON public.progress_records
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);