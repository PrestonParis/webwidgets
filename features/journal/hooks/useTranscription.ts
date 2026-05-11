'use client';

import { useState, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

// Web Speech API types — not fully present in all TS DOM lib versions
interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: { transcript: string } | undefined;
}
interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult | undefined;
}
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}
interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
}
interface WindowWithSpeech extends Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
}

export interface TranscriptionState {
    isListening: boolean;
    interim: string;
    isSupported: boolean;
    start: () => void;
    stop: () => void;
}

export function useTranscription(editor: Editor | null): TranscriptionState {
    const [isListening, setIsListening] = useState(false);
    const [interim, setInterim] = useState('');
    // Held while recording so onend can restart for continuous mode
    const recognitionRef = useRef<ISpeechRecognition | null>(null);
    const listeningRef = useRef(false);

    const isSupported =
        typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const stop = useCallback(() => {
        listeningRef.current = false;
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
        setInterim('');
    }, []);

    const start = useCallback(() => {
        if (!isSupported || !editor) return;

        const win = window as WindowWithSpeech;
        const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition;
        if (!SR) return;

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (!result) continue;
                const transcript = result[0]?.transcript ?? '';
                if (result.isFinal) {
                    editor.commands.focus();
                    editor.commands.insertContent(transcript + ' ');
                } else {
                    interimText += transcript;
                }
            }
            setInterim(interimText);
        };

        recognition.onerror = () => {
            listeningRef.current = false;
            setIsListening(false);
            setInterim('');
            recognitionRef.current = null;
        };

        // SpeechRecognition stops automatically after silence; restart to stay continuous
        recognition.onend = () => {
            setInterim('');
            if (listeningRef.current && recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch {
                    listeningRef.current = false;
                    setIsListening(false);
                    recognitionRef.current = null;
                }
            }
        };

        recognitionRef.current = recognition;
        listeningRef.current = true;
        recognition.start();
        setIsListening(true);
    }, [editor, isSupported]);

    return { isListening, interim, isSupported, start, stop };
}
