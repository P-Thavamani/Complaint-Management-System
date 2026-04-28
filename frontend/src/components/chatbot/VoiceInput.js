import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../../services/axios';

/**
 * VoiceInput — Production-grade audio recording using MediaRecorder API.
 *
 * Architecture:
 *  1. getUserMedia  → single mic stream
 *  2. MediaRecorder → captures audio chunks from that stream
 *  3. Web Audio API → reads the SAME stream for real-time volume meter (no conflict)
 *  4. On Stop       → sends .webm blob to Flask /api/chatbot/transcribe
 *  5. Flask         → forwards audio to Gemini 3.1 Flash for transcription
 *  6. Result        → shown to user, sent to parent via onTranscript()
 *
 * This avoids the Web Speech API entirely, which:
 *  - Requires internet to Google servers
 *  - Conflicts with getUserMedia on Windows
 *  - Fails silently in Brave / incognito / non-Chromium browsers
 */

export default function VoiceInput({ onTranscript, onCancel }) {
  const [phase, setPhase] = useState('idle');
  // idle | requesting | listening | uploading | captured | error

  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);

  const streamRef       = useRef(null);
  const recorderRef     = useRef(null);
  const chunksRef       = useRef([]);
  const audioCtxRef     = useRef(null);
  const analyserRef     = useRef(null);
  const rafRef          = useRef(null);
  const timerRef        = useRef(null);

  // ── Clean up all resources ────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    clearInterval(timerRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setVolume(0);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  // ── Volume meter loop (reads from same stream as MediaRecorder) ────────────
  const startVolumeMeter = useCallback((stream) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(buf);
      const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
      setVolume(Math.min(100, avg * 2.5));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  // ── Start recording ────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    setPhase('requesting');
    setErrorMsg('');
    setTranscript('');
    setDuration(0);
    chunksRef.current = [];

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      setPhase('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone permission denied.\nClick the 🔒 in your browser address bar → allow microphone access → refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No microphone found. Plug in a microphone and try again.');
      } else {
        setErrorMsg(`Microphone error: ${err.message}`);
      }
      return;
    }

    streamRef.current = stream;
    startVolumeMeter(stream);

    // Pick best supported MIME type
    const mimeType = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ].find(t => MediaRecorder.isTypeSupported(t)) || '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onerror = (e) => {
      cleanup();
      setPhase('error');
      setErrorMsg(`Recording error: ${e.error?.message || 'Unknown error'}`);
    };

    recorder.onstop = async () => {
      cleanup();

      const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });

      if (blob.size < 500) {
        setPhase('error');
        setErrorMsg('Recording was too short or empty. Hold the Stop button after speaking.');
        return;
      }

      setPhase('uploading');

      const formData = new FormData();
      const ext = (mimeType || 'audio/webm').includes('ogg') ? '.ogg' : '.webm';
      formData.append('audio', blob, `recording${ext}`);

      try {
        const res = await axios.post('/api/chatbot/transcribe', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
        });
        setTranscript(res.data.transcript);
        setPhase('captured');
      } catch (err) {
        setPhase('error');
        const msg = err.response?.data?.error || err.message || 'Transcription failed';
        setErrorMsg(`Transcription error: ${msg}`);
      }
    };

    recorder.start(250); // collect chunks every 250ms
    setPhase('listening');

    // Duration counter
    let secs = 0;
    timerRef.current = setInterval(() => {
      secs++;
      setDuration(secs);
      if (secs >= 120) handleStop(); // auto-stop at 2 min
    }, 1000);
  }, [startVolumeMeter, cleanup]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop recording ─────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  }, []);

  // ── Use transcript ─────────────────────────────────────────────────────────
  const handleUse = () => { if (transcript) onTranscript(transcript); };

  // ── Retry ──────────────────────────────────────────────────────────────────
  const handleRetry = () => {
    cleanup();
    chunksRef.current = [];
    setPhase('idle');
    setTranscript('');
    setErrorMsg('');
    setDuration(0);
  };

  // ──────────────────────────────────────────────────────────────────────────
  const isListening = phase === 'listening';
  const isUploading = phase === 'uploading';
  const isCaptured  = phase === 'captured';
  const isError     = phase === 'error';
  const isRequesting = phase === 'requesting';

  const fmtDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Volume bar segments
  const BAR_COUNT = 12;

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">

      {/* Status */}
      <p className={`text-center text-sm font-semibold mb-3 ${
        isListening  ? 'text-red-600'   :
        isUploading  ? 'text-indigo-600':
        isCaptured   ? 'text-green-600' :
        isError      ? 'text-red-500'   :
        isRequesting ? 'text-gray-500'  : 'text-gray-500'}`}>
        {phase === 'idle'       && 'Tap the mic to start recording'}
        {phase === 'requesting' && 'Requesting microphone access...'}
        {phase === 'listening'  && `Recording  ${fmtDuration(duration)}`}
        {phase === 'uploading'  && 'Transcribing your audio...'}
        {phase === 'captured'   && 'Transcription done! Review below.'}
        {phase === 'error'      && 'Something went wrong'}
      </p>

      {/* Mic / status button */}
      <div className="flex justify-center mb-3">
        {isUploading ? (
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : (
          <button
            type="button"
            onClick={isListening ? handleStop : (isCaptured ? undefined : handleStart)}
            disabled={isCaptured || isRequesting || isUploading}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none
              ${isListening  ? 'bg-red-100 ring-4 ring-red-300' :
                isCaptured   ? 'bg-green-100 cursor-default' :
                isRequesting ? 'bg-gray-200 cursor-wait' :
                               'bg-indigo-100 hover:bg-indigo-200 active:scale-95'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200
              ${isListening ? 'bg-red-500' : isCaptured ? 'bg-green-500' : 'bg-indigo-500'}`}>
              {isCaptured ? (
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              ) : (
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Real-time volume meter (same mic stream as MediaRecorder — no conflict) */}
      {isListening && (
        <div className="mb-3">
          <div className="flex items-end justify-center gap-1 h-10">
            {Array.from({ length: BAR_COUNT }).map((_, i) => {
              const threshold = (i / BAR_COUNT) * 100;
              const active = volume > threshold;
              return (
                <div
                  key={i}
                  className="w-2 rounded-full transition-all duration-75"
                  style={{
                    height: `${20 + i * 5}%`,
                    backgroundColor: active
                      ? i > 9 ? '#ef4444' : i > 6 ? '#f59e0b' : '#6366f1'
                      : '#e5e7eb',
                  }}
                />
              );
            })}
          </div>
          <p className="text-xs text-center text-gray-400 mt-1">
            {volume > 8 ? '🎙 Voice detected' : 'Speak into your microphone...'}
          </p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mb-3">
        {phase === 'idle'      && 'Works in any browser · No internet required for recording'}
        {phase === 'listening' && 'Tap the mic to stop and transcribe'}
        {phase === 'uploading' && 'Sending to AI for transcription...'}
      </p>

      {/* Transcript */}
      {transcript && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 text-sm">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1">
            Transcribed
          </span>
          <span className="text-gray-800">"{transcript}"</span>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 whitespace-pre-line leading-relaxed">
          {errorMsg}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-2 flex-wrap">
        {isCaptured && (
          <button type="button" onClick={handleUse}
            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            Use This
          </button>
        )}
        {(isCaptured || isError) && (
          <button type="button" onClick={handleRetry}
            className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium">
            {isCaptured ? 'Re-record' : 'Try Again'}
          </button>
        )}
        <button type="button" onClick={onCancel}
          className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
          Cancel
        </button>
      </div>
    </div>
  );
}