import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';

export interface Model {
    id: string;
    name: string;
    description: string;
    contextLength: number;
    pricing: {
        prompt: number;
        completion: number;
    };
    topProvider: {
        context_length: number;
        max_completion_tokens: number;
        is_moderated: boolean;
    };
}

export interface Tone {
    id: string;
    name: string;
    description: string;
}

export interface ConversationResponse {
    model: Model;
    response: string;
    timestamp: string;
    error?: boolean;
}

export interface Conversation {
    id: string;
    topic: string;
    models: Model[];
    systemPrompts: Record<string, string>;
    tones: Record<string, string>;
    responseCount: number;
    messages: Array<{ role: string; content: string }>;
    responses: ConversationResponse[];
    createdAt: string;
    updatedAt: string;
}

interface ConversationContextType {
    // State
    availableModels: Model[];
    popularModels: Model[];
    availableTones: Tone[];
    selectedModels: Model[];
    systemPrompts: Record<string, string>;
    tones: Record<string, string>;
    currentConversation: Conversation | null;
    isLoading: boolean;
    isGenerating: boolean;

    // Actions
    fetchModels: () => Promise<void>;
    fetchPopularModels: () => Promise<void>;
    fetchTones: () => Promise<void>;
    addModel: (model: Model) => void;
    removeModel: (modelId: string) => void;
    updateSystemPrompt: (modelId: string, prompt: string) => void;
    updateTone: (modelId: string, tone: string) => void;
    startConversation: (topic: string, responseCount: number) => Promise<void>;
    continueConversation: (followupPrompt: string) => Promise<void>;
    clearConversation: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const useConversation = () => {
    const context = useContext(ConversationContext);
    if (context === undefined) {
        throw new Error('useConversation must be used within a ConversationProvider');
    }
    return context;
};

interface ConversationProviderProps {
    children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
    const [availableModels, setAvailableModels] = useState<Model[]>([]);
    const [popularModels, setPopularModels] = useState<Model[]>([]);
    const [availableTones, setAvailableTones] = useState<Tone[]>([]);
    const [selectedModels, setSelectedModels] = useState<Model[]>([]);
    const [systemPrompts, setSystemPrompts] = useState<Record<string, string>>({});
    const [tones, setTones] = useState<Record<string, string>>({});
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchModels = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/models');
            setAvailableModels(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch models');
            console.error('Error fetching models:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPopularModels = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/models/popular');
            setPopularModels(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch popular models');
            console.error('Error fetching popular models:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTones = useCallback(async () => {
        try {
            const response = await api.get('/conversations/tones');
            setAvailableTones(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch tones');
            console.error('Error fetching tones:', error);
        }
    }, []);

    const addModel = useCallback((model: Model) => {
        setSelectedModels(prev => {
            if (prev.find(m => m.id === model.id)) {
                return prev;
            }
            return [...prev, model];
        });
    }, []);

    const removeModel = useCallback((modelId: string) => {
        setSelectedModels(prev => prev.filter(m => m.id !== modelId));
        setSystemPrompts(prev => {
            const newPrompts = { ...prev };
            delete newPrompts[modelId];
            return newPrompts;
        });
        setTones(prev => {
            const newTones = { ...prev };
            delete newTones[modelId];
            return newTones;
        });
    }, []);

    const updateSystemPrompt = useCallback((modelId: string, prompt: string) => {
        setSystemPrompts(prev => ({
            ...prev,
            [modelId]: prompt
        }));
    }, []);

    const updateTone = useCallback((modelId: string, tone: string) => {
        setTones(prev => ({
            ...prev,
            [modelId]: tone
        }));
    }, []);

    const startConversation = useCallback(async (topic: string, responseCount: number) => {
        if (selectedModels.length === 0) {
            toast.error('Please select at least one model');
            return;
        }

        try {
            setIsGenerating(true);
            const response = await api.post('/conversations/start', {
                topic,
                models: selectedModels,
                systemPrompts,
                tones,
                responseCount
            });

            setCurrentConversation(response.data.data);
            toast.success('Conversation started successfully!');
        } catch (error) {
            toast.error('Failed to start conversation');
            console.error('Error starting conversation:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [selectedModels, systemPrompts, tones]);

    const continueConversation = useCallback(async (followupPrompt: string) => {
        if (!currentConversation) {
            toast.error('No active conversation');
            return;
        }

        try {
            setIsGenerating(true);
            const response = await api.post('/conversations/followup', {
                messages: currentConversation.messages,
                models: currentConversation.models,
                systemPrompts: currentConversation.systemPrompts,
                tones: currentConversation.tones,
                followupPrompt
            });

            setCurrentConversation(prev => prev ? {
                ...prev,
                messages: response.data.data.messages,
                responses: [...prev.responses, ...response.data.data.responses],
                updatedAt: response.data.data.timestamp
            } : null);

            toast.success('Follow-up responses generated!');
        } catch (error) {
            toast.error('Failed to generate follow-up responses');
            console.error('Error generating follow-up:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [currentConversation]);

    const clearConversation = useCallback(() => {
        setCurrentConversation(null);
        setSelectedModels([]);
        setSystemPrompts({});
        setTones({});
    }, []);

    const value: ConversationContextType = {
        availableModels,
        popularModels,
        availableTones,
        selectedModels,
        systemPrompts,
        tones,
        currentConversation,
        isLoading,
        isGenerating,
        fetchModels,
        fetchPopularModels,
        fetchTones,
        addModel,
        removeModel,
        updateSystemPrompt,
        updateTone,
        startConversation,
        continueConversation,
        clearConversation,
    };

    return (
        <ConversationContext.Provider value={value}>
            {children}
        </ConversationContext.Provider>
    );
}; 