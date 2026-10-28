import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { env } from "../env";

type VoiceRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};

type VoiceRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: VoiceRecognitionResult;
  };
};

type VoiceRecognitionErrorEvent = {
  error: string;
};

type VoiceRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: VoiceRecognitionEvent) => void) | null;
  onerror: ((event: VoiceRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type VoiceRecognitionConstructor = new () => VoiceRecognitionInstance;

function getRecognitionConstructor(): VoiceRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as {
    SpeechRecognition?: VoiceRecognitionConstructor;
    webkitSpeechRecognition?: VoiceRecognitionConstructor;
  };
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

const recognitionErrors: Record<string, string> = {
  "not-allowed":
    "Microphone access was denied. Allow it in your browser settings.",
  "service-not-allowed": "Voice input is blocked by your browser.",
  "audio-capture": "No microphone was found.",
  network: "Voice input needs a network connection.",
  "no-speech": "No speech was detected. Try again.",
};

type UseSpeechRecognitionOptions = {
  onTranscript: (text: string) => void;
  lang?: string;
};

export function useSpeechRecognition({
  onTranscript,
  lang,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<VoiceRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const supported = useMemo(() => getRecognitionConstructor() !== null, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (recognitionRef.current) return;

    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = lang ?? navigator.language ?? "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = "";
      let interim = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index++
      ) {
        const result = event.results[index];
        if (!result) continue;
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim);
      if (finalText.trim()) {
        setInterimText("");
        onTranscriptRef.current(finalText.trim());
        recognition.stop();
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      setError(
        recognitionErrors[event.error] ?? "Voice input stopped unexpectedly.",
      );
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setInterimText("");
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setError(null);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setError("Voice input could not start. Try again.");
    }
  }, [lang]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return { isListening, interimText, error, supported, start, stop };
}

function toSpeakableText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitGeminiSpeech(text: string) {
  const segments = text
    .split(/(?<=[.!?…])\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) return [text];

  const first = segments[0]!;
  if (first.length > 180) {
    const cut = first.lastIndexOf(" ", 180);
    const splitAt = cut >= 40 ? cut : 180;
    segments.splice(0, 1, first.slice(0, splitAt), first.slice(splitAt));
  }

  if (segments.length < 2) return [text];

  const [head, ...tail] = segments;
  const rest = tail.join(" ").trim();
  return head && rest ? [head, rest] : [text];
}

export type ReplyVoice = {
  id: string;
  name: string;
  engine: "browser" | "edge" | "gemini";
  lang: string;
  natural: boolean;
};

export const geminiReplyVoices: ReplyVoice[] = [
  {
    id: "gemini:Kore",
    name: "Kore — Georgian (Google, firm)",
    engine: "gemini",
    lang: "ka-GE",
    natural: true,
  },
  {
    id: "gemini:Charon",
    name: "Charon — Georgian (Google, informative)",
    engine: "gemini",
    lang: "ka-GE",
    natural: true,
  },
  {
    id: "gemini:Aoede",
    name: "Aoede — Georgian (Google, breezy)",
    engine: "gemini",
    lang: "ka-GE",
    natural: true,
  },
  {
    id: "gemini:Puck",
    name: "Puck — Georgian (Google, upbeat)",
    engine: "gemini",
    lang: "ka-GE",
    natural: true,
  },
];

export const edgeReplyVoices: ReplyVoice[] = [
  {
    id: "edge:ka-GE-EkaNeural",
    name: "Eka — Georgian (natural)",
    engine: "edge",
    lang: "ka-GE",
    natural: true,
  },
  {
    id: "edge:ka-GE-GiorgiNeural",
    name: "Giorgi — Georgian (natural)",
    engine: "edge",
    lang: "ka-GE",
    natural: true,
  },
];

const voicePreferenceKey = "ai-reply-voice-v2";

function getStoredVoiceId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(voicePreferenceKey);
  } catch {
    return null;
  }
}

function isNaturalBrowserVoice(voice: SpeechSynthesisVoice) {
  return /natural|neural|premium|enhanced|google/i.test(voice.name);
}

function voiceLanguageScore(voice: SpeechSynthesisVoice) {
  const language = (navigator.language ?? "en-US").toLowerCase();
  const base = language.split("-")[0] ?? language;
  const voiceLanguage = voice.lang.toLowerCase();
  if (voiceLanguage === language) return 3;
  if (voiceLanguage.startsWith(`${base}-`) || voiceLanguage === base) return 2;
  if (voiceLanguage.startsWith(base)) return 1;
  return 0;
}

function voiceQualityScore(voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (name.includes("natural")) score += 6;
  if (name.includes("neural")) score += 5;
  if (name.includes("premium")) score += 5;
  if (name.includes("enhanced")) score += 4;
  if (name.includes("google")) score += 4;
  if (name.includes("online")) score += 1;
  return score;
}

function compareVoices(a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) {
  const language = voiceLanguageScore(b) - voiceLanguageScore(a);
  if (language !== 0) return language;
  const quality = voiceQualityScore(b) - voiceQualityScore(a);
  if (quality !== 0) return quality;
  return a.name.localeCompare(b.name);
}

function toReplyVoice(voice: SpeechSynthesisVoice): ReplyVoice {
  return {
    id: voice.voiceURI,
    name: voice.name,
    engine: "browser",
    lang: voice.lang,
    natural: isNaturalBrowserVoice(voice),
  };
}

const georgianTextPattern = /[\u10A0-\u10FF]/;

function pickVoice(voices: ReplyVoice[], selectedId: string | null) {
  if (selectedId) {
    const selected = voices.find((voice) => voice.id === selectedId);
    if (selected) return selected;
  }

  const language = (navigator.language ?? "en-US").toLowerCase();
  if (language.startsWith("ka")) {
    return (
      voices.find((voice) => voice.engine === "gemini") ??
      edgeReplyVoices[0] ??
      null
    );
  }

  return voices.find((voice) => voice.engine === "browser") ?? null;
}

type UseSpeechSynthesisOptions = {
  geminiAvailable?: boolean;
};

export function useSpeechSynthesis({
  geminiAvailable = false,
}: UseSpeechSynthesisOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported] = useState(() => typeof window !== "undefined");
  const [error, setError] = useState<string | null>(null);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>(
    [],
  );
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(
    getStoredVoiceId,
  );
  const browserVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoiceIdRef = useRef(selectedVoiceId);
  const allVoicesRef = useRef<ReplyVoice[]>(edgeReplyVoices);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const remoteAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!supported || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      browserVoicesRef.current = available;
      setBrowserVoices(available);
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    const retry = window.setTimeout(loadVoices, 300);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.clearTimeout(retry);
    };
  }, [supported]);

  const sortedBrowserVoices = useMemo(
    () => [...browserVoices].sort(compareVoices).map(toReplyVoice),
    [browserVoices],
  );

  const allVoices = useMemo(
    () => [
      ...(geminiAvailable ? geminiReplyVoices : []),
      ...edgeReplyVoices,
      ...sortedBrowserVoices,
    ],
    [geminiAvailable, sortedBrowserVoices],
  );

  useEffect(() => {
    allVoicesRef.current = allVoices;
  }, [allVoices]);

  const selectedVoice = useMemo(
    () => pickVoice(allVoices, selectedVoiceId),
    [allVoices, selectedVoiceId],
  );

  const stopRemoteAudio = useCallback(() => {
    remoteAbortRef.current?.abort();
    remoteAbortRef.current = null;

    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    stopRemoteAudio();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [stopRemoteAudio]);

  const setVoice = useCallback((voiceId: string) => {
    selectedVoiceIdRef.current = voiceId;
    setSelectedVoiceId(voiceId);
    setError(null);
    try {
      window.localStorage.setItem(voicePreferenceKey, voiceId);
    } catch {
      // Ignore storage failures; the voice still applies this session.
    }
  }, []);

  const speakWithBrowser = useCallback(
    (text: string, voice: ReplyVoice | null) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      stopRemoteAudio();
      const browserVoice =
        voice?.engine === "browser"
          ? browserVoicesRef.current.find((item) => item.voiceURI === voice.id)
          : undefined;

      setError(null);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (browserVoice) {
        utterance.voice = browserVoice;
        utterance.lang = browserVoice.lang;
      } else {
        utterance.lang = navigator.language ?? "en-US";
      }
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [stopRemoteAudio],
  );

  const playRemoteBlob = useCallback(
    (
      blob: Blob,
      onEnded: () => void,
      signal?: AbortSignal,
    ): Promise<boolean> => {
      if (signal?.aborted) return Promise.resolve(true);

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audioUrlRef.current = url;

      const release = () => {
        if (audioRef.current === audio) audioRef.current = null;
        if (audioUrlRef.current === url) {
          URL.revokeObjectURL(url);
          audioUrlRef.current = null;
        }
      };

      audio.onended = () => {
        release();
        onEnded();
      };
      audio.onerror = () => {
        release();
        if (signal?.aborted) return;
        setError("The reply audio could not be played.");
        setIsSpeaking(false);
      };

      return audio.play().then(
        () => true,
        (caught) => {
          release();
          if (signal?.aborted) return true;
          setError(
            caught instanceof Error && caught.name === "NotAllowedError"
              ? "Your browser blocked audio playback. Press send again to hear it."
              : "Could not play the reply audio.",
          );
          setIsSpeaking(false);
          return false;
        },
      );
    },
    [],
  );

  const speakWithRemote = useCallback(
    async (
      text: string,
      engine: "edge" | "gemini",
      voiceId: string,
    ): Promise<boolean> => {
      stopRemoteAudio();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setError(null);
      setIsSpeaking(true);

      const controller = new AbortController();
      remoteAbortRef.current = controller;

      try {
        const response = await fetch(
          `${env.VITE_SERVER_BASE_URL}/tts/${engine}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voice: voiceId }),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Speech request failed with ${response.status}`);
        }

        const blob = await response.blob();
        if (controller.signal.aborted) return true;

        return await playRemoteBlob(
          blob,
          () => setIsSpeaking(false),
          controller.signal,
        );
      } catch (caught) {
        if (controller.signal.aborted) return true;
        stopRemoteAudio();
        setError(
          caught instanceof Error && caught.name === "NotAllowedError"
            ? "Your browser blocked audio playback. Press send again to hear it."
            : "Could not generate speech. Check the server and try again.",
        );
        setIsSpeaking(false);
        return false;
      } finally {
        if (remoteAbortRef.current === controller)
          remoteAbortRef.current = null;
      }
    },
    [playRemoteBlob, stopRemoteAudio],
  );

  const speakWithEdge = useCallback(
    (text: string, voiceId: string) => {
      void speakWithRemote(text, "edge", voiceId);
    },
    [speakWithRemote],
  );

  const speakWithGemini = useCallback(
    (text: string, voiceId: string) => {
      const chunks = splitGeminiSpeech(text);
      const fallback = edgeReplyVoices[0];

      stopRemoteAudio();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setError(null);
      setIsSpeaking(true);

      const controller = new AbortController();
      remoteAbortRef.current = controller;

      const requestChunk = (chunk: string) =>
        fetch(`${env.VITE_SERVER_BASE_URL}/tts/gemini`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunk, voice: voiceId }),
          signal: controller.signal,
        }).then(async (response) => {
          if (!response.ok) {
            throw new Error(`Speech request failed with ${response.status}`);
          }
          return response.blob();
        });

      const fallbackFrom = (index: number) => {
        if (!fallback || controller.signal.aborted) return;
        const remaining = chunks.slice(index).join(" ").trim();
        if (!remaining) return;
        void speakWithRemote(
          remaining,
          "edge",
          fallback.id.slice("edge:".length),
        );
      };

      const playAt = (index: number, prefetched?: Promise<Blob | null>) => {
        const blobPromise =
          prefetched ?? requestChunk(chunks[index]!).catch(() => null);

        void blobPromise.then(async (blob) => {
          if (controller.signal.aborted) return;
          if (!blob) {
            if (fallback) {
              fallbackFrom(index);
            } else {
              setError(
                "Could not generate speech. Check the server and try again.",
              );
              setIsSpeaking(false);
            }
            return;
          }

          const next =
            index + 1 < chunks.length
              ? requestChunk(chunks[index + 1]!).catch(() => null)
              : null;

          const played = await playRemoteBlob(
            blob,
            () => {
              if (next) {
                playAt(index + 1, next);
              } else {
                setIsSpeaking(false);
              }
            },
            controller.signal,
          );

          if (!played) fallbackFrom(index);
        });
      };

      playAt(0);
    },
    [playRemoteBlob, speakWithRemote, stopRemoteAudio],
  );

  const speak = useCallback(
    (text: string) => {
      const speakable = toSpeakableText(text);
      if (!speakable) return;

      const voice = pickVoice(allVoicesRef.current, selectedVoiceIdRef.current);
      const replyVoice = georgianTextPattern.test(speakable)
        ? voice?.engine === "edge" || voice?.engine === "gemini"
          ? voice
          : (allVoicesRef.current.find((item) => item.engine === "gemini") ??
            edgeReplyVoices[0] ??
            voice)
        : voice;

      if (replyVoice?.engine === "edge") {
        speakWithEdge(speakable, replyVoice.id.slice("edge:".length));
        return;
      }

      if (replyVoice?.engine === "gemini") {
        void speakWithGemini(speakable, replyVoice.id.slice("gemini:".length));
        return;
      }

      speakWithBrowser(speakable, replyVoice);
    },
    [speakWithBrowser, speakWithEdge, speakWithGemini],
  );

  useEffect(() => {
    return () => {
      stopRemoteAudio();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopRemoteAudio]);

  return {
    isSpeaking,
    supported,
    error,
    voices: allVoices,
    selectedVoice,
    speak,
    cancel,
    setVoice,
  };
}
