import { useNavigate, useParams } from "react-router-dom";
import { isFormulaSubject } from "@/lib/subjects";
import BoardRenderer from "@/components/BoardRenderer";
import ChatPanel from "@/components/ChatPanel";
import PromptInput from "@/components/PromptInput";
import FormulaInput from "@/components/FormulaInput";
import { useSubjectWorkspace } from "@/hooks/useSubjectWorkspace";
import { ArrowLeft, Volume2, VolumeX, Calculator, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function SubjectWorkspace() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const {
    subject,
    prompt,
    setPrompt,
    loading,
    error,
    messages,
    visibleBoard,
    voiceEnabled,
    toggleVoice,
    currentStepIndex,
    isSpeaking,
    stop,
    quizFeedback,
    loadingQuestion,
    showFormula,
    toggleFormula,
    attachedImage,
    setAttachedImage,
    chatVisible,
    toggleChat,
    showChat,
    hideChat,
    handleTeach,
    handleQuizAnswer,
    handleFormulaInsert,
  } = useSubjectWorkspace(subjectId);

  if (!subject) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Предмет не найден</p>
      </div>
    );
  }

  const boardContent = (
    <ResizablePanel defaultSize={chatVisible ? 72 : 100} minSize={35}>
      <div className="flex h-full flex-col gap-2 px-1">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-card-foreground">📝 Доска</h2>
            <div className="flex items-center gap-2">
              {!chatVisible && (
                <button
                  onClick={showChat}
                  className="flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Показать чат
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              )}
              {loading && (
                <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  Генерация…
                </span>
              )}
              {isSpeaking && (
                <button
                  onClick={stop}
                  className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20"
                >
                  ⏹ Стоп
                </button>
              )}
            </div>
          </div>
          <BoardRenderer items={visibleBoard} />
        </div>

        {showFormula && (
          <div className="shrink-0 rounded-xl border border-border bg-card px-3 py-2">
            <FormulaInput onInsert={handleFormulaInsert} />
          </div>
        )}

        <div className="shrink-0">
          <PromptInput
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handleTeach}
            loading={loading}
            attachedImage={attachedImage}
            onAttachImage={setAttachedImage}
          />
        </div>

        {error && (
          <div className="shrink-0 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </ResizablePanel>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={() => navigate("/")}
          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-2xl">{subject.icon}</span>
        <h1 className="text-lg font-bold text-foreground">{subject.name}</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleChat}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition ${
              chatVisible
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {chatVisible ? "Скрыть чат" : "Показать чат"}
            {chatVisible ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          {isFormulaSubject(subject) && (
            <button
              onClick={toggleFormula}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition ${
                showFormula
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calculator className="h-4 w-4" /> Формулы
            </button>
          )}
          <button
            onClick={toggleVoice}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {voiceEnabled ? "Голос вкл" : "Голос выкл"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-2">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-xl">
          {boardContent}

          {chatVisible && (
            <>
              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={28} minSize={18} maxSize={45}>
                <div className="h-full overflow-hidden pl-1">
                  <ChatPanel
                    messages={messages}
                    currentStepIndex={currentStepIndex}
                    quizFeedback={quizFeedback}
                    loadingQuestion={loadingQuestion}
                    onQuizAnswer={handleQuizAnswer}
                    onHide={hideChat}
                  />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
