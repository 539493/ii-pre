import { useState, type ElementType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Eraser,
  FileText,
  Hand,
  Highlighter,
  ImagePlus,
  Maximize2,
  MessageSquare,
  MoreHorizontal,
  MousePointer2,
  PenTool,
  Redo2,
  Search,
  Settings2,
  Share2,
  Sigma,
  Sparkles,
  Type,
  Undo2,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import BoardRenderer from "@/components/BoardRenderer";
import FormulaInput from "@/components/FormulaInput";
import PromptInput from "@/components/PromptInput";
import QuizSection from "@/components/QuizSection";
import { useSubjectWorkspace } from "@/hooks/useSubjectWorkspace";
import { PROFILE_KEY, parseProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type WorkspaceTab = "ai" | "materials" | "steps";
type WorkspaceTool =
  | "cursor"
  | "pen"
  | "text"
  | "note"
  | "formula"
  | "shape"
  | "graph"
  | "image"
  | "hand"
  | "eraser"
  | "highlight";

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-[16px] border px-3.5 text-[13px] font-medium transition",
        active
          ? "border-[#d5e3ff] bg-[#eef4ff] text-[#2563eb]"
          : "border-[#ece7dd] bg-white text-[#324768] hover:border-[#d8e2fb] hover:text-[#175cdf]",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
      {label}
    </button>
  );
}

function HeaderIconButton({
  icon: Icon,
  onClick,
  disabled = false,
}: {
  icon: ElementType;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid h-10 w-10 place-items-center rounded-[14px] border border-[#ece7dd] bg-white text-[#42557a] transition hover:border-[#d8e2fb] hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
    </button>
  );
}

function RailButton({
  icon: Icon,
  active = false,
  onClick,
  label,
}: {
  icon: ElementType;
  active?: boolean;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-[14px] transition",
        active
          ? "bg-[#eef4ff] text-[#2563eb] shadow-[inset_3px_0_0_0_#2563eb]"
          : "text-[#324768] hover:bg-[#f8fafc] hover:text-[#175cdf]",
      )}
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
    </button>
  );
}

function SideTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-1 px-3 py-3 text-center text-[14px] font-medium transition",
        active ? "text-[#132b5b]" : "text-[#6c7b98] hover:text-[#2563eb]",
      )}
    >
      {label}
      {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#2563eb]" />}
    </button>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  tone,
  onClick,
}: {
  icon: ElementType;
  title: string;
  tone: "blue" | "green" | "violet";
  onClick: () => void;
}) {
  const toneClasses = {
    blue: "border-[#d8e4ff] bg-[linear-gradient(135deg,#eff5ff_0%,#f8fbff_100%)] text-[#2563eb]",
    green: "border-[#d7f0df] bg-[linear-gradient(135deg,#f0fbf4_0%,#fbfefb_100%)] text-[#2f9b63]",
    violet: "border-[#e7def8] bg-[linear-gradient(135deg,#f6f1ff_0%,#fcfbff_100%)] text-[#7b48d8]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition hover:translate-x-0.5",
        toneClasses[tone],
      )}
    >
      <div className="grid h-9 w-9 place-items-center rounded-full bg-white/80">
        <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
      </div>
      <span className="flex-1 text-[14px] font-medium">{title}</span>
    </button>
  );
}

function formatSavedLabel(hasMessages: boolean, loading: boolean) {
  if (loading) return "Обновляем доску…";
  if (hasMessages) return "Сохранено только что";
  return "Пустая доска";
}

export default function SubjectWorkspace() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("ai");
  const [activeTool, setActiveTool] = useState<WorkspaceTool>("pen");
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [zoomLevel, setZoomLevel] = useState(100);

  const {
    subject,
    prompt,
    setPrompt,
    loading,
    error,
    messages,
    activeResult,
    knowledgeItems,
    visibleBoard,
    voiceEnabled,
    toggleVoice,
    currentStepIndex,
    isSpeaking,
    quizFeedback,
    loadingQuestion,
    showFormula,
    toggleFormula,
    attachedImage,
    setAttachedImage,
    handleTeach,
    handleQuizAnswer,
    handleFormulaInsert,
  } = useSubjectWorkspace(subjectId);

  const normalizedSearch = workspaceSearch.trim().toLowerCase();
  const filteredKnowledgeItems = knowledgeItems.filter((item) => {
    if (!normalizedSearch) return true;
    return `${item.title} ${item.content}`.toLowerCase().includes(normalizedSearch);
  });

  const filteredMessages = messages.filter((message) => {
    if (!normalizedSearch) return true;
    const haystack = [
      message.content,
      message.result?.title,
      message.result?.summary,
      ...(message.result?.steps || []),
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const filteredSteps = (activeResult?.steps || []).filter((step) => (
    !normalizedSearch || step.toLowerCase().includes(normalizedSearch)
  ));

  const lastUserPrompt = [...messages]
    .reverse()
    .find((message) => message.role === "user" && message.content.trim())
    ?.content || "";

  const recentMessages = filteredMessages.slice(-8).reverse();
  const profileName = parseProfile(localStorage.getItem(PROFILE_KEY)).name;
  const profileInitial = profileName.trim().charAt(0).toUpperCase() || "A";

  if (!subject) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Предмет не найден</p>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch {
      setShareState("idle");
    }
  };

  const handleRefreshBoard = () => {
    const promptToRepeat = lastUserPrompt || `Объясни тему по предмету ${subject.name} ещё раз по шагам`;
    void handleTeach(promptToRepeat);
  };

  const handleExampleRequest = () => {
    const topic = activeResult?.title || subject.name;
    void handleTeach(`Приведи один наглядный пример по теме: ${topic}`);
  };

  const handleGraphRequest = () => {
    const topic = activeResult?.title || subject.name;
    void handleTeach(`Покажи график и коротко объясни тему: ${topic}`);
  };

  const handleCreateTest = () => {
    const topic = activeResult?.title || lastUserPrompt || subject.name;
    void handleTeach(`Составь тест по теме ${topic}`);
  };

  const boardCursorClass =
    activeTool === "text"
      ? "cursor-text"
      : activeTool === "hand"
        ? "cursor-grab"
        : activeTool === "pen" || activeTool === "highlight"
          ? "cursor-crosshair"
          : "cursor-default";

  const toolItems: Array<{
    id: WorkspaceTool;
    icon: ElementType;
    label: string;
    onClick?: () => void;
  }> = [
    { id: "cursor", icon: MousePointer2, label: "Курсор" },
    { id: "pen", icon: PenTool, label: "Ручка" },
    { id: "text", icon: Type, label: "Текст" },
    { id: "note", icon: FileText, label: "Заметка" },
    { id: "formula", icon: Sigma, label: "Формула", onClick: () => { setActiveTool("formula"); toggleFormula(); setActiveTab("ai"); } },
    { id: "shape", icon: Settings2, label: "Фигуры" },
    { id: "graph", icon: BarChart3, label: "График", onClick: handleGraphRequest },
    { id: "image", icon: ImagePlus, label: "Изображение", onClick: () => setActiveTab("ai") },
    { id: "hand", icon: Hand, label: "Перемещение" },
    { id: "eraser", icon: Eraser, label: "Ластик" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fbfaf7] text-[#132b5b]">
      <div className="border-b border-[#ece6dc] bg-[#fcfbf7]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3">
          <label className="relative flex min-w-0 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a97b2]" strokeWidth={1.8} />
            <input
              value={workspaceSearch}
              onChange={(event) => setWorkspaceSearch(event.target.value)}
              placeholder="Поиск по предметам, темам и материалам"
              className="h-10 w-full rounded-[18px] border border-[#e8e2d8] bg-white pl-10 pr-4 text-[14px] text-[#223761] outline-none transition placeholder:text-[#8492ae] focus:border-[#cedcff] focus:ring-4 focus:ring-[#2563eb]/8"
            />
          </label>

          <div className="ml-auto hidden items-center gap-1 sm:flex">
            <button className="relative grid h-9 w-9 place-items-center rounded-full text-[#7e8cad] transition hover:bg-white hover:text-[#132b5b]">
              <Bell className="h-[17px] w-[17px]" strokeWidth={1.8} />
              <span className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-full bg-[#2563eb] text-[10px] font-semibold text-white">
                2
              </span>
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full text-[#7e8cad] transition hover:bg-white hover:text-[#132b5b]">
              <CircleHelp className="h-[17px] w-[17px]" strokeWidth={1.8} />
            </button>
            <button className="ml-1 flex items-center gap-2 rounded-full px-1 text-[#8a97b2] transition hover:bg-white">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#deb45a] text-[15px] font-semibold text-white shadow-[0_10px_22px_rgba(222,180,90,0.24)]">
                {profileInitial}
              </span>
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1600px] gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <section className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#7282a0]">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center font-semibold text-[#132b5b] transition hover:text-[#2563eb]"
                >
                  {subject.name}
                </button>
                <span>/</span>
                <span>Рабочая доска</span>
                <span className="mx-1 hidden h-1 w-1 rounded-full bg-[#d1d8e6] sm:block" />
                <span className="inline-flex items-center gap-2 text-[#5f7a5d]">
                  <span className="h-2 w-2 rounded-full bg-[#83c07b]" />
                  {formatSavedLabel(messages.length > 0, loading)}
                </span>
                <button
                  type="button"
                  onClick={toggleVoice}
                  className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-[#ece7dd] bg-white px-2.5 py-1 text-[12px] font-medium text-[#5d7095] transition hover:text-[#2563eb]"
                >
                  {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" strokeWidth={1.8} /> : <VolumeX className="h-3.5 w-3.5" strokeWidth={1.8} />}
                  {voiceEnabled ? "Голос" : "Без звука"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <HeaderIconButton icon={Undo2} />
                <HeaderIconButton icon={Redo2} />
                <HeaderIconButton icon={MoreHorizontal} />
                <HeaderIconButton icon={Maximize2} />
              </div>
            </div>

            <div className="rounded-[26px] border border-[#ebe6dc] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.03)]">
              <div className="mb-3 flex flex-wrap gap-2">
                <ToolbarButton
                  icon={Sparkles}
                  label="Обновить"
                  onClick={handleRefreshBoard}
                  disabled={loading}
                />
                <ToolbarButton
                  icon={MessageSquare}
                  label="Шаги за шагом"
                  onClick={() => setActiveTab("steps")}
                  active={activeTab === "steps"}
                />
                <ToolbarButton
                  icon={BookOpen}
                  label="Пример"
                  onClick={handleExampleRequest}
                />
                <ToolbarButton
                  icon={Sigma}
                  label="Формула"
                  onClick={() => {
                    toggleFormula();
                    setActiveTool("formula");
                    setActiveTab("ai");
                  }}
                  active={showFormula}
                />
                <ToolbarButton
                  icon={BarChart3}
                  label="График"
                  onClick={handleGraphRequest}
                />
                <ToolbarButton
                  icon={Type}
                  label="Текст"
                  onClick={() => setActiveTool("text")}
                  active={activeTool === "text"}
                />
                <ToolbarButton
                  icon={Highlighter}
                  label="Подсветка"
                  onClick={() => setActiveTool("highlight")}
                  active={activeTool === "highlight"}
                />
                <ToolbarButton
                  icon={Share2}
                  label={shareState === "copied" ? "Скопировано" : "Поделиться"}
                  onClick={handleShare}
                />
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-[16px] border border-[#ece7dd] bg-white text-[#324768] transition hover:border-[#d8e2fb] hover:text-[#175cdf]"
                >
                  <ChevronDown className="h-4.5 w-4.5" strokeWidth={1.8} />
                </button>
              </div>

              <div className="relative overflow-hidden rounded-[24px] border border-[#ece6da] bg-[#fffdfa] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="absolute left-3 top-3 z-20">
                  <div className="rounded-[18px] border border-[#ece7dd] bg-white/92 p-1 shadow-[0_14px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                    <div className="flex flex-col gap-1.5">
                      {toolItems.slice(0, 5).map((item) => (
                        <RailButton
                          key={item.id}
                          icon={item.icon}
                          label={item.label}
                          active={activeTool === item.id}
                          onClick={() => {
                            setActiveTool(item.id);
                            item.onClick?.();
                          }}
                        />
                      ))}

                      <div className="mx-2 my-1 h-px bg-[#ece7dd]" />

                      {toolItems.slice(5).map((item) => (
                        <RailButton
                          key={item.id}
                          icon={item.icon}
                          label={item.label}
                          active={activeTool === item.id}
                          onClick={() => {
                            setActiveTool(item.id);
                            item.onClick?.();
                          }}
                        />
                      ))}

                      <div className="mx-2 my-1 h-px bg-[#ece7dd]" />

                      <RailButton icon={Undo2} label="Отменить" onClick={() => undefined} />
                      <RailButton icon={Redo2} label="Повторить" onClick={() => undefined} />

                      <div className="mx-2 my-1 h-px bg-[#ece7dd]" />

                      <RailButton
                        icon={ZoomIn}
                        label="Приблизить"
                        onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 140))}
                      />
                      <RailButton
                        icon={ZoomOut}
                        label="Отдалить"
                        onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 70))}
                      />
                      <div className="px-1 pb-1 pt-0.5 text-center text-[11px] font-semibold text-[#51688f]">
                        {zoomLevel}%
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={cn("min-h-[740px] p-4 transition", boardCursorClass)}
                  style={{ zoom: `${zoomLevel}%` }}
                >
                  <BoardRenderer items={visibleBoard} />
                </div>
              </div>
            </div>
          </section>

          <aside className="sticky top-4 hidden h-[calc(100vh-144px)] w-[340px] shrink-0 overflow-hidden rounded-[24px] border border-[#ebe6dc] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.03)] xl:flex xl:flex-col">
            <div className="border-b border-[#ece7dd]">
              <div className="flex items-center px-3">
                <SideTab active={activeTab === "ai"} label="AI-репетитор" onClick={() => setActiveTab("ai")} />
                <SideTab active={activeTab === "materials"} label="Материалы" onClick={() => setActiveTab("materials")} />
                <SideTab active={activeTab === "steps"} label="Шаги" onClick={() => setActiveTab("steps")} />
              </div>
            </div>

            {activeTab === "ai" && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  <div className="rounded-[20px] border border-[#ece7dd] bg-[#fcfbf8] p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-[#eef4ff] text-[#2563eb]">
                        <Sparkles className="h-5 w-5" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-[#132b5b]">
                          {activeResult?.title || `${subject.name}: рабочая сессия`}
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-[#7282a0]">
                          {activeResult?.summary || "Задай вопрос, и здесь появится краткое объяснение, выводы и следующие шаги."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <QuickActionCard
                    icon={Sparkles}
                    title="Попросить короткое объяснение"
                    tone="blue"
                    onClick={() => void handleTeach(`Коротко объясни тему ${activeResult?.title || subject.name}`)}
                  />
                  <QuickActionCard
                    icon={ClipboardCheck}
                    title="Проверить себя по текущей теме"
                    tone="green"
                    onClick={() => setActiveTab("steps")}
                  />
                  <QuickActionCard
                    icon={Volume2}
                    title={voiceEnabled ? "Озвучка включена" : "Включить озвучку"}
                    tone="violet"
                    onClick={toggleVoice}
                  />

                  {activeResult?.checkUnderstanding?.length ? (
                    <div className="rounded-[20px] border border-[#ece7dd] bg-white p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4.5 w-4.5 text-[#2563eb]" strokeWidth={1.8} />
                        <p className="text-[14px] font-semibold text-[#132b5b]">Проверка понимания</p>
                      </div>
                      <QuizSection
                        questions={activeResult.checkUnderstanding}
                        onAnswer={handleQuizAnswer}
                        quizFeedback={quizFeedback}
                        loadingQuestion={loadingQuestion}
                      />
                    </div>
                  ) : null}

                  <div className="rounded-[20px] border border-[#ece7dd] bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4.5 w-4.5 text-[#2563eb]" strokeWidth={1.8} />
                      <p className="text-[14px] font-semibold text-[#132b5b]">Последние сообщения</p>
                    </div>

                    {recentMessages.length === 0 ? (
                      <p className="text-[13px] leading-6 text-[#7282a0]">
                        Диалог пока пуст. Используй поле ввода ниже, чтобы начать объяснение темы.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {recentMessages.map((message) => (
                          <div key={message.id} className="rounded-[16px] border border-[#f0ebe2] bg-[#fcfbf8] px-3 py-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <span className={cn(
                                "text-[11px] font-semibold uppercase tracking-[0.18em]",
                                message.role === "assistant" ? "text-[#2563eb]" : "text-[#8a97b2]",
                              )}>
                                {message.role === "assistant" ? "AI" : "Вы"}
                              </span>
                            </div>
                            <p className="mt-1 text-[13px] leading-5 text-[#42557a]">
                              {message.role === "assistant"
                                ? message.result?.summary || message.content
                                : message.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-[#ece7dd] bg-[#fcfbf7] p-4">
                  {showFormula && (
                    <div className="mb-3 rounded-[18px] border border-[#ece7dd] bg-white p-3">
                      <FormulaInput onInsert={handleFormulaInsert} />
                    </div>
                  )}

                  <PromptInput
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onSubmit={() => {
                      void handleTeach();
                    }}
                    loading={loading}
                    attachedImage={attachedImage}
                    onAttachImage={setAttachedImage}
                  />

                  {error && (
                    <div className="mt-3 rounded-[16px] border border-[#f5d4d4] bg-[#fff5f5] px-3 py-2 text-[12px] text-[#c25555]">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "materials" && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-[#ece7dd] px-4 py-3">
                  <p className="text-[14px] font-semibold text-[#132b5b]">Материалы по предмету</p>
                  <p className="mt-1 text-[12px] text-[#8a97b2]">База знаний AI-репетитора для этой доски</p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {filteredKnowledgeItems.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#e3dccf] bg-[#fcfbf8] px-4 py-5 text-[13px] leading-6 text-[#7282a0]">
                      Пока нет сохранённых материалов. Добавь теорию или заметки на странице материалов, и они будут участвовать в объяснении.
                    </div>
                  ) : (
                    filteredKnowledgeItems.map((item) => (
                      <div key={item.id} className="rounded-[18px] border border-[#ece7dd] bg-[#fcfbf8] px-4 py-3">
                        <p className="text-[14px] font-semibold text-[#132b5b]">{item.title}</p>
                        <p className="mt-2 line-clamp-4 text-[12px] leading-6 text-[#7282a0]">{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "steps" && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-[#ece7dd] px-4 py-3">
                  <p className="text-[14px] font-semibold text-[#132b5b]">Пошаговое решение</p>
                  <p className="mt-1 text-[12px] text-[#8a97b2]">Структура ответа и контрольные вопросы</p>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {filteredSteps.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#e3dccf] bg-[#fcfbf8] px-4 py-5 text-[13px] leading-6 text-[#7282a0]">
                      Пока шагов нет. Запроси объяснение темы, и AI разложит решение по этапам.
                    </div>
                  ) : (
                    filteredSteps.map((step, index) => {
                      const isActive = isSpeaking && currentStepIndex === index;
                      const isPast = !isSpeaking || currentStepIndex === -1 || index <= currentStepIndex;

                      return (
                        <div
                          key={`${step}-${index}`}
                          className={cn(
                            "rounded-[18px] border px-4 py-3 transition",
                            isActive
                              ? "border-[#d8e4ff] bg-[#eef4ff]"
                              : isPast
                                ? "border-[#ece7dd] bg-[#fcfbf8]"
                                : "border-[#f1ece3] bg-[#fcfbf8]/70 opacity-60",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
                              isActive ? "bg-[#2563eb] text-white" : "bg-white text-[#2563eb] border border-[#d8e4ff]",
                            )}>
                              {index + 1}
                            </div>
                            <p className="text-[13px] leading-6 text-[#42557a]">{step}</p>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {activeResult?.checkUnderstanding?.length ? (
                    <div className="rounded-[20px] border border-[#ece7dd] bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-[#132b5b]">Проверка понимания</p>
                          <p className="mt-1 text-[12px] text-[#8a97b2]">Ответь на короткие вопросы по теме</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCreateTest}
                          className="inline-flex h-9 items-center gap-2 rounded-[14px] border border-[#d8e4ff] bg-[#eef4ff] px-3 text-[12px] font-semibold text-[#2563eb]"
                        >
                          <ClipboardCheck className="h-4 w-4" strokeWidth={1.8} />
                          Тест
                        </button>
                      </div>
                      <QuizSection
                        questions={activeResult.checkUnderstanding}
                        onAnswer={handleQuizAnswer}
                        quizFeedback={quizFeedback}
                        loadingQuestion={loadingQuestion}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
