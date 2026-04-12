import { TutorResponse } from "@/types/tutor";
import { Lightbulb, ListChecks, HelpCircle } from "lucide-react";

interface Props {
  result: TutorResponse | null;
}

export default function ExplanationPanel({ result }: Props) {
  if (!result) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">Explanation</h2>
        </div>
        <div className="mt-6 flex flex-1 items-center justify-center">
          <p className="text-center text-sm text-muted-foreground">
            Здесь появится объяснение после запроса
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div>
        <h2 className="text-xl font-bold text-card-foreground">{result.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <ListChecks className="h-4 w-4" />
          Шаги
        </div>
        <div className="space-y-2">
          {result.steps?.map((step, i) => (
            <div
              key={i}
              className="animate-fade-in-up rounded-xl border border-border bg-secondary p-3 text-sm text-foreground"
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
            >
              <span className="mr-2 font-bold text-primary">{i + 1}.</span>
              {step}
            </div>
          ))}
        </div>
      </div>

      {result.checkUnderstanding?.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <HelpCircle className="h-4 w-4" />
            Проверь себя
          </div>
          <div className="space-y-2">
            {result.checkUnderstanding.map((q, i) => (
              <div
                key={i}
                className="animate-fade-in-up rounded-xl border border-border bg-secondary p-3 text-sm text-foreground"
                style={{ animationDelay: `${(result.steps?.length || 0) * 0.1 + i * 0.1}s`, opacity: 0 }}
              >
                {q}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
