import React, { useState, useMemo, useEffect } from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { ArrowLeft, Volume2, VolumeX, Mic, MicOff, Users, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ttsService from '../services/tts';

// Color palette for models - distinct colors that work well together
const MODEL_COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-600', accent: 'bg-blue-500', ring: 'ring-blue-200' },
    { bg: 'bg-purple-100', text: 'text-purple-600', accent: 'bg-purple-500', ring: 'ring-purple-200' },
    { bg: 'bg-green-100', text: 'text-green-600', accent: 'bg-green-500', ring: 'ring-green-200' },
    { bg: 'bg-orange-100', text: 'text-orange-600', accent: 'bg-orange-500', ring: 'ring-orange-200' },
    { bg: 'bg-pink-100', text: 'text-pink-600', accent: 'bg-pink-500', ring: 'ring-pink-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600', accent: 'bg-indigo-500', ring: 'ring-indigo-200' },
    { bg: 'bg-teal-100', text: 'text-teal-600', accent: 'bg-teal-500', ring: 'ring-teal-200' },
    { bg: 'bg-red-100', text: 'text-red-600', accent: 'bg-red-500', ring: 'ring-red-200' },
];

// Voice assignments for different models
const VOICE_ASSIGNMENTS = ['nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'];

const VoiceConversationView: React.FC = () => {
    const {
        currentConversation,
        isGenerating,
        streamingResponses,
        currentlyPlayingAudio,
        setCurrentlyPlayingAudio,
        clearConversation
    } = useConversation();

    const [isMuted, setIsMuted] = useState(false);
    const [currentSubtitle, setCurrentSubtitle] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [processedResponses, setProcessedResponses] = useState<Set<string>>(new Set());
    const [responseQueue, setResponseQueue] = useState<Array<any>>([]);
    const [isProcessingQueue, setIsProcessingQueue] = useState(false);
    const [audioBlocked, setAudioBlocked] = useState(false);

    // Enable audio context on user interaction
    useEffect(() => {
        const enableAudio = () => {
            if (audioBlocked) {
                setAudioBlocked(false);
                console.log('🎤 Audio context enabled by user interaction');
            }
        };

        document.addEventListener('click', enableAudio);
        document.addEventListener('keydown', enableAudio);
        document.addEventListener('touchstart', enableAudio);

        return () => {
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };
    }, [audioBlocked]);

    // Create a color mapping for models
    const modelColors = useMemo(() => {
        if (!currentConversation) return {};

        const colorMap: Record<string, typeof MODEL_COLORS[0]> = {};
        currentConversation.models.forEach((model, index) => {
            colorMap[model.id] = MODEL_COLORS[index % MODEL_COLORS.length];
        });
        return colorMap;
    }, [currentConversation]);

    // Add new completed responses to the queue
    useEffect(() => {
        if (!currentConversation || isMuted) return;

        // Check for newly completed responses that haven't been processed yet
        const completedResponses = currentConversation.responses.filter(
            response => !processedResponses.has(`${response.model.id}-${response.timestamp}`)
        );

        if (completedResponses.length > 0) {
            // Add all new responses to the queue
            setResponseQueue(prev => [...prev, ...completedResponses]);

            // Mark them as processed (added to queue)
            setProcessedResponses(prev => {
                const newSet = new Set(prev);
                completedResponses.forEach(response => {
                    newSet.add(`${response.model.id}-${response.timestamp}`);
                });
                return newSet;
            });
        }
    }, [currentConversation?.responses, isMuted, processedResponses, currentConversation]);

    // Process the response queue one item at a time
    useEffect(() => {
        if (isProcessingQueue || responseQueue.length === 0 || isMuted) return;

        const processNextResponse = async () => {
            setIsProcessingQueue(true);
            const response = responseQueue[0];

            try {
                const jsonResponse = JSON.parse(response.response);

                // Display only the input text in subtitles
                if (jsonResponse.input) {
                    setCurrentSubtitle(jsonResponse.input);

                    // Check if OpenAI API key is available
                    const openaiApiKey = localStorage.getItem('openai_api_key');
                    if (!openaiApiKey) {
                        setCurrentSubtitle('OpenAI API key required for voice playback. Please configure it in settings.');
                        await new Promise(resolve => setTimeout(resolve, 4000));
                        setCurrentSubtitle('');
                    } else {
                        // Get voice for this model
                        const modelIndex = currentConversation!.models.findIndex(m => m.id === response.model.id);
                        const voice = VOICE_ASSIGNMENTS[modelIndex % VOICE_ASSIGNMENTS.length];

                        // Play TTS with the full JSON response (TTS service will parse it internally)
                        await ttsService.playTTSResponse(
                            response.response,
                            voice,
                            () => {
                                // Audio started playing
                                setCurrentlyPlayingAudio(response.model.id);
                            },
                            () => {
                                // Audio finished playing
                                setCurrentlyPlayingAudio(null);
                                // Clear subtitle after audio finishes
                                setCurrentSubtitle('');
                            }
                        );
                    }
                }
            } catch (error) {
                console.error('Failed to parse JSON response or play TTS:', error);
                // Fallback to raw response if JSON parsing fails
                setCurrentSubtitle(response.response);
                // Wait a bit for user to read the text
                await new Promise(resolve => setTimeout(resolve, 3000));
                setCurrentSubtitle('');
            }

            // Remove the processed response from queue
            setResponseQueue(prev => prev.slice(1));
            setIsProcessingQueue(false);
        };

        processNextResponse();
    }, [responseQueue, isProcessingQueue, isMuted, currentConversation, setCurrentlyPlayingAudio]);

    // Don't show streaming responses in voice mode - only show completed responses with TTS

    const handleBackToSetup = () => {
        clearConversation();
        setProcessedResponses(new Set());
        setCurrentSubtitle('');
        setResponseQueue([]);
        setIsProcessingQueue(false);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (!isMuted) {
            setCurrentlyPlayingAudio(null);
        }
    };

    const formatModelName = (name: string) => {
        return name.split('/').pop() || name;
    };

    if (!currentConversation) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <Volume2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Voice Conversation Yet</h3>
                    <p className="opacity-75">Start a voice conversation to begin</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-pink-500/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <div className="relative z-10 p-6">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <button
                        onClick={handleBackToSetup}
                        className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Setup</span>
                    </button>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{currentConversation.models.length} Models</span>
                        </div>

                        {audioBlocked && (
                            <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 rounded-lg text-yellow-300">
                                <VolumeX className="w-4 h-4" />
                                <span className="text-sm">Click to enable audio</span>
                            </div>
                        )}

                        <button
                            onClick={toggleMute}
                            className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>

                        {ttsService.isPlaying() && (
                            <button
                                onClick={() => ttsService.skipCurrentAudio()}
                                className="p-2 rounded-lg transition-colors bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                                title="Skip current audio"
                            >
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6">
                {/* Topic Display */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {currentConversation.topic}
                    </h1>
                </div>

                {/* Models Circle */}
                <div className="relative mb-12">
                    <div className="flex items-center justify-center space-x-8">
                        {currentConversation.models.map((model, index) => {
                            const colors = modelColors[model.id];
                            const isActive = currentlyPlayingAudio === model.id;
                            const isStreaming = streamingResponses[model.id] && streamingResponses[model.id].length > 0;

                            return (
                                <motion.div
                                    key={model.id}
                                    className="relative"
                                    animate={{
                                        scale: isActive ? 1.2 : 1,
                                        y: isActive ? -10 : 0,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 25,
                                    }}
                                >
                                    {/* Pulsing ring when active */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1.5, opacity: 0.3 }}
                                                exit={{ scale: 2, opacity: 0 }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                                className={`absolute inset-0 rounded-full ${colors.accent} blur-sm`}
                                            />
                                        )}
                                    </AnimatePresence>

                                    {/* Model Avatar */}
                                    <div
                                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                            ? `${colors.accent} ring-4 ${colors.ring}`
                                            : `${colors.bg} ${colors.text}`
                                            }`}
                                    >
                                        <div className="text-sm font-bold text-center">
                                            {formatModelName(model.name).substring(0, 3).toUpperCase()}
                                        </div>
                                    </div>

                                    {/* Model Name */}
                                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-center whitespace-nowrap">
                                        {formatModelName(model.name)}
                                    </div>

                                    {/* Speaking indicator */}
                                    {isStreaming && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Subtitle Display */}
                <div className="w-full max-w-4xl">
                    <AnimatePresence mode="wait">
                        {currentSubtitle && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 text-center"
                            >
                                <div className="text-xl md:text-2xl leading-relaxed">
                                    {currentSubtitle}
                                </div>

                                {/* Speaking indicator */}
                                {currentlyPlayingAudio && (
                                    <div className="flex items-center justify-center mt-4 space-x-2">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Waiting State */}
                    {!currentSubtitle && !isGenerating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-white/60"
                        >
                            <div className="text-lg mb-2">Ready to listen...</div>
                            <div className="text-sm">Models will start speaking soon</div>
                        </motion.div>
                    )}

                    {/* Audio Queue State */}
                    {!currentSubtitle && !isGenerating && ttsService.getQueueLength() > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-white/60 mt-4"
                        >
                            <div className="text-sm">Waiting for previous audio to finish...</div>
                            <div className="flex justify-center space-x-1 mt-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </motion.div>
                    )}

                    {/* Generating State */}
                    {isGenerating && !currentSubtitle && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-white/60"
                        >
                            <div className="text-lg mb-2">Generating responses...</div>
                            <div className="flex justify-center space-x-1">
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 p-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-white/60 text-sm">
                        <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Started {new Date(currentConversation.createdAt).toLocaleTimeString()}</span>
                        </div>
                        {responseQueue.length > 0 && (
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                <span>{responseQueue.length} response{responseQueue.length > 1 ? 's' : ''} queued</span>
                            </div>
                        )}
                        {ttsService.getQueueLength() > 0 && (
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span>{ttsService.getQueueLength()} audio{ttsService.getQueueLength() > 1 ? 's' : ''} queued</span>
                            </div>
                        )}
                        {ttsService.isPlaying() && (
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                <span>Playing audio</span>
                                {(() => {
                                    const audioInfo = ttsService.getCurrentAudioInfo();
                                    if (audioInfo && audioInfo.remainingTime > 0) {
                                        return ` (${Math.ceil(audioInfo.remainingTime)}s left)`;
                                    }
                                    return '';
                                })()}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 text-white/60 text-sm">
                        <span>Voice Mode</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceConversationView; 