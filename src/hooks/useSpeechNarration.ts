import { useState, useCallback, useRef, useEffect } from "react";

const emojiPattern = /\p{Extended_Pictographic}/u;

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
        const cleanText = Array.from(steps[index])
          .filter((char) => !emojiPattern.test(char) && char !== "\u200D" && char !== "\uFE0F" && char !== "\u20E3")
          .join("")
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
