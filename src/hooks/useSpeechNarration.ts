import { useState, useCallback, useRef, useEffect } from "react";

export function useSpeechNarration() {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cancelledRef = useRef(false);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentStepIndex(-1);
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const narrate = useCallback(
    (steps: string[], onStepStart?: (index: number) => void) => {
      stop();
      cancelledRef.current = false;

      if (!steps.length || !window.speechSynthesis) return;

      const voices = window.speechSynthesis.getVoices();
      // Prefer a female Russian voice for softer tone
      const ruVoice =
        voices.find((v) => v.lang.startsWith("ru") && v.name.toLowerCase().includes("milena")) ||
        voices.find((v) => v.lang.startsWith("ru") && v.name.toLowerCase().includes("irina")) ||
        voices.find((v) => v.lang.startsWith("ru") && v.name.toLowerCase().includes("female")) ||
        voices.find((v) => v.lang.startsWith("ru"));

      const speakStep = (index: number) => {
        if (cancelledRef.current || index >= steps.length) {
          setIsSpeaking(false);
          setCurrentStepIndex(-1);
          return;
        }

        setCurrentStepIndex(index);
        onStepStart?.(index);

        // Strip emojis
        const cleanText = steps[index]
          .replace(
            /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}\u{231A}-\u{23F3}\u{23E9}-\u{23EF}\u{25AA}-\u{25FE}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
            ""
          )
          .replace(/\s{2,}/g, " ")
          .trim();

        // Add natural pauses: replace periods/colons with slight pause markers
        const textWithPauses = cleanText
          .replace(/\.\s/g, "... ")     // period → longer pause
          .replace(/:\s/g, "... ")      // colon → longer pause
          .replace(/;\s/g, ".. ")       // semicolon → medium pause
          .replace(/,\s/g, ", ");       // keep comma pauses natural

        const utterance = new SpeechSynthesisUtterance(textWithPauses);
        utterance.lang = "ru-RU";
        utterance.rate = 0.75;   // slower for gentle pacing
        utterance.pitch = 1.12;  // slightly higher for warmth and softness
        utterance.volume = 0.65; // quieter, gentle volume
        if (ruVoice) utterance.voice = ruVoice;

        utterance.onend = () => {
          // Small pause between steps for natural feel
          setTimeout(() => speakStep(index + 1), 400);
        };

        utterance.onerror = () => {
          speakStep(index + 1);
        };

        window.speechSynthesis.speak(utterance);
      };

      setIsSpeaking(true);
      speakStep(0);
    },
    [stop]
  );

  return { narrate, stop, isSpeaking, currentStepIndex };
}
