
CREATE TABLE public.user_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  subject_id text NOT NULL,
  title text NOT NULL,
  lesson_number integer NOT NULL DEFAULT 1,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb DEFAULT NULL,
  completed boolean NOT NULL DEFAULT false,
  score integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_user_tests" ON public.user_tests
  FOR ALL TO public
  USING (true) WITH CHECK (true);

ALTER TABLE public.progress_records ADD COLUMN IF NOT EXISTS device_id text DEFAULT '';
ALTER TABLE public.progress_records ADD COLUMN IF NOT EXISTS studied_at timestamp with time zone DEFAULT now();
