import TestDetailView from "@/components/tests/TestDetailView";
import TestListView from "@/components/tests/TestListView";
import { useTestsPage } from "@/hooks/useTestsPage";
import { getAllSubjects } from "@/lib/subjects";

export default function TestsPage() {
  const subjects = getAllSubjects();
  const {
    tests,
    selectedTest,
    answers,
    feedback,
    checking,
    selectedSubject,
    setSelectedSubject,
    groupedTests,
    selectedTestSections,
    openTest,
    closeTest,
    updateAnswer,
    checkAnswer,
  } = useTestsPage();

  return (
    <div
      key={selectedTest ? `test-${selectedTest.id}` : "tests-list"}
      className="h-full animate-surface-enter"
    >
      {selectedTest ? (
        <TestDetailView
          test={selectedTest}
          sections={selectedTestSections}
          answers={answers}
          feedback={feedback}
          checking={checking}
          onBack={closeTest}
          onAnswerChange={updateAnswer}
          onCheckAnswer={checkAnswer}
        />
      ) : (
        <TestListView
          tests={tests}
          groupedTests={groupedTests}
          subjects={subjects}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          onOpenTest={openTest}
        />
      )}
    </div>
  );
}
