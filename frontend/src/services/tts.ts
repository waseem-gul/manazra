import OpenAI from 'openai';

interface TTSResponse {
    input: string;
    instructions: string;
}

interface QueueItem {
    id: string;
    responseText: string;
    voice: string;
    onStart?: () => void;
    onEnd?: () => void;
}

interface PreparedAudio {
    id: string;
    audio: HTMLAudioElement;
    audioUrl: string;
    onStart?: () => void;
    onEnd?: () => void;
}

class TTSService {
    private openai: OpenAI | null = null;
    private currentAudio: HTMLAudioElement | null = null;
    private currentAudioId: string | null = null;
    
    // Queue for text that needs to be converted to audio
    private textQueue: QueueItem[] = [];
    
    // Queue for audio that's ready to play
    private audioQueue: PreparedAudio[] = [];
    
    private isProcessingText = false;
    private isProcessingPlayback = false;
    private idCounter = 0;

    private initializeOpenAI() {
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please configure it in settings.');
        }

        if (!this.openai) {
            this.openai = new OpenAI({
                apiKey,
                dangerouslyAllowBrowser: true
            });
        }
    }

    async playTTSResponse(responseText: string, voice: string = 'nova', onStart?: () => void, onEnd?: () => void): Promise<void> {
        const id = `tts_${++this.idCounter}`;
        
        // Add to text queue for processing
        this.textQueue.push({
            id,
            responseText,
            voice,
            onStart,
            onEnd
        });

        console.log(`🎤 TTS: Added item ${id} to text queue, total items:`, this.textQueue.length);

        // Start processing if not already processing
        this.processTextQueue();
        this.processAudioQueue();
    }

    private async processTextQueue(): Promise<void> {
        if (this.isProcessingText || this.textQueue.length === 0) {
            return;
        }

        this.isProcessingText = true;
        console.log('🎤 TTS: Starting text processing, items in queue:', this.textQueue.length);

        while (this.textQueue.length > 0) {
            const item = this.textQueue.shift()!;
            console.log(`🎤 TTS: Processing text for item ${item.id} with voice:`, item.voice);
            
            try {
                await this.convertTextToAudio(item);
            } catch (error) {
                console.error(`🎤 TTS: Error converting text to audio for item ${item.id}:`, error);
                // If conversion fails, we still need to call onEnd to prevent hanging
                if (item.onEnd) item.onEnd();
            }
        }

        console.log('🎤 TTS: Text processing completed');
        this.isProcessingText = false;
    }

    private async convertTextToAudio(item: QueueItem): Promise<void> {
        try {
            console.log(`🎤 TTS: Converting text to audio for item ${item.id}`);
            
            // Parse the LLM response to extract input and instructions
            const ttsData = this.parseVoiceResponse(item.responseText);
            console.log(`🎤 TTS: Parsed data for item ${item.id}:`, ttsData);
            
            this.initializeOpenAI();

            console.log(`🎤 TTS: Creating OpenAI speech request for item ${item.id}...`);
            // Create TTS audio using OpenAI
            const response = await this.openai!.audio.speech.create({
                model: 'tts-1',
                voice: item.voice as any,
                input: ttsData.input,
                response_format: 'mp3',
                speed: 1.0
            });

            console.log(`🎤 TTS: OpenAI response received for item ${item.id}, converting to audio...`);
            // Convert response to audio
            const audioBuffer = await response.arrayBuffer();
            const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log(`🎤 TTS: Audio blob created for item ${item.id}, URL:`, audioUrl);

            // Create audio element
            const audio = new Audio(audioUrl);
            audio.preload = 'auto';
            audio.volume = 1;
            
            // Wait for audio to be ready
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Audio load timeout'));
                }, 10000);

                audio.addEventListener('canplay', () => {
                    clearTimeout(timeout);
                    console.log(`🎤 TTS: Audio ready for item ${item.id}`);
                    resolve();
                }, { once: true });

                audio.addEventListener('error', (error) => {
                    clearTimeout(timeout);
                    console.error(`🎤 TTS: Audio load error for item ${item.id}:`, error);
                    reject(error);
                }, { once: true });
            });

            // Add to audio queue
            this.audioQueue.push({
                id: item.id,
                audio,
                audioUrl,
                onStart: item.onStart,
                onEnd: item.onEnd
            });

            console.log(`🎤 TTS: Item ${item.id} added to audio queue, total ready:`, this.audioQueue.length);
            
            // Start playing if nothing is currently playing
            this.processAudioQueue();

        } catch (error) {
            console.error(`🎤 TTS: Error in convertTextToAudio for item ${item.id}:`, error);
            throw error;
        }
    }

    private async processAudioQueue(): Promise<void> {
        if (this.isProcessingPlayback || this.audioQueue.length === 0) {
            return;
        }

        // If something is currently playing, wait for it to finish
        if (this.isPlaying()) {
            console.log('🎤 TTS: Audio currently playing, waiting for completion...');
            return;
        }

        this.isProcessingPlayback = true;
        console.log('🎤 TTS: Starting audio playback, items in queue:', this.audioQueue.length);

        const item = this.audioQueue.shift()!;
        console.log(`🎤 TTS: Playing audio for item ${item.id}`);
        
        this.currentAudio = item.audio;
        this.currentAudioId = item.id;

        // Set up event listeners
        this.currentAudio.addEventListener('play', () => {
            console.log(`🎤 TTS: Audio playback started for item ${item.id}`);
            if (item.onStart) item.onStart();
        });

        this.currentAudio.addEventListener('ended', () => {
            console.log(`🎤 TTS: Audio playback ended for item ${item.id}`);
            URL.revokeObjectURL(item.audioUrl);
            this.currentAudio = null;
            this.currentAudioId = null;
            if (item.onEnd) item.onEnd();
            
            this.isProcessingPlayback = false;
            // Process next item in queue
            this.processAudioQueue();
        });

        this.currentAudio.addEventListener('error', (error) => {
            console.error(`🎤 TTS: Audio playback error for item ${item.id}:`, error);
            URL.revokeObjectURL(item.audioUrl);
            this.currentAudio = null;
            this.currentAudioId = null;
            if (item.onEnd) item.onEnd();
            
            this.isProcessingPlayback = false;
            // Process next item in queue
            this.processAudioQueue();
        });

        try {
            await this.currentAudio.play();
            console.log(`🎤 TTS: Audio play() called successfully for item ${item.id}`);
        } catch (playError: any) {
            console.error(`🎤 TTS: Play failed for item ${item.id}:`, playError);
            
            if (playError.name === 'NotAllowedError') {
                console.log('🎤 TTS: Autoplay blocked by browser');
                this.showAutoplayNotification("Audio playback blocked");
            }
            
            // Clean up and continue
            URL.revokeObjectURL(item.audioUrl);
            this.currentAudio = null;
            this.currentAudioId = null;
            if (item.onEnd) item.onEnd();
            
            this.isProcessingPlayback = false;
            this.processAudioQueue();
        }
    }

    private parseVoiceResponse(responseText: string): TTSResponse {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(responseText);
            
            if (parsed.input && parsed.instructions) {
                return {
                    input: parsed.input,
                    instructions: parsed.instructions
                };
            }
        } catch (e) {
            // If JSON parsing fails, treat the entire response as input
            console.warn('Failed to parse voice response as JSON, using as plain text');
        }

        // Fallback: use the entire response as input with default instructions
        return {
            input: responseText,
            instructions: 'Deliver in a natural, conversational tone with clear pronunciation'
        };
    }

    private showAutoplayNotification(text: string) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            max-width: 300px;
            z-index: 10000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        notification.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold;">🔇 Audio Blocked</div>
            <div style="font-size: 12px; opacity: 0.8;">Browser blocked autoplay. Click anywhere on the page to enable audio for future responses.</div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }

    stopCurrentAudio(): void {
        if (this.currentAudio) {
            console.log('🎤 TTS: Stopping current audio');
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
            this.currentAudioId = null;
        }
        
        // Clear all queues when stopping
        this.textQueue = [];
        
        // Clean up prepared audio
        this.audioQueue.forEach(item => {
            URL.revokeObjectURL(item.audioUrl);
        });
        this.audioQueue = [];
        
        this.isProcessingText = false;
        this.isProcessingPlayback = false;
    }

    skipCurrentAudio(): void {
        if (this.currentAudio) {
            console.log('🎤 TTS: Skipping current audio');
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            
            // Trigger the ended event to move to next audio
            this.currentAudio.dispatchEvent(new Event('ended'));
        }
    }

    isPlaying(): boolean {
        return this.currentAudio !== null && !this.currentAudio.paused && !this.currentAudio.ended;
    }

    getQueueLength(): number {
        return this.textQueue.length + this.audioQueue.length;
    }

    getCurrentAudioInfo(): { isPlaying: boolean; duration: number; currentTime: number; remainingTime: number } | null {
        if (!this.currentAudio) {
            return null;
        }

        return {
            isPlaying: !this.currentAudio.paused && !this.currentAudio.ended,
            duration: this.currentAudio.duration || 0,
            currentTime: this.currentAudio.currentTime || 0,
            remainingTime: (this.currentAudio.duration || 0) - (this.currentAudio.currentTime || 0)
        };
    }

    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const tempOpenAI = new OpenAI({
                apiKey,
                dangerouslyAllowBrowser: true
            });

            // Test the API key with a simple request
            const response = await tempOpenAI.audio.speech.create({
                model: 'tts-1',
                voice: 'nova',
                input: 'test',
                response_format: 'mp3'
            });

            return response instanceof Response;
        } catch (error) {
            console.error('OpenAI API key validation failed:', error);
            return false;
        }
    }
}

export const ttsService = new TTSService();
export default ttsService; 