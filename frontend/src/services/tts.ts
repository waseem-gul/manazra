import OpenAI from 'openai';

interface TTSResponse {
    input: string;
    instructions: string;
}

class TTSService {
    private openai: OpenAI | null = null;
    private currentAudio: HTMLAudioElement | null = null;
    private audioQueue: Array<{
        responseText: string;
        voice: string;
        onStart?: () => void;
        onEnd?: () => void;
    }> = [];
    private isProcessingQueue = false;

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
        // Add to queue instead of playing immediately
        this.audioQueue.push({
            responseText,
            voice,
            onStart,
            onEnd
        });

        // Process queue if not already processing
        if (!this.isProcessingQueue) {
            this.processQueue();
        }
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessingQueue || this.audioQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        console.log('🎤 TTS: Starting queue processing, items in queue:', this.audioQueue.length);

        while (this.audioQueue.length > 0) {
            const item = this.audioQueue[0];
            console.log('🎤 TTS: Processing queue item for voice:', item.voice);
            
            // Wait for current audio to finish if it's playing
            if (this.isPlaying()) {
                console.log('🎤 TTS: Waiting for current audio to finish...');
                await this.waitForAudioToFinish();
                console.log('🎤 TTS: Current audio finished, proceeding with next item');
            }

            // Remove the item from queue before processing
            this.audioQueue.shift();

            try {
                await this.playSingleTTSResponse(item.responseText, item.voice, item.onStart, item.onEnd);
            } catch (error) {
                console.error('🎤 TTS: Error playing audio from queue:', error);
                if (item.onEnd) item.onEnd();
                // Continue with next item even if this one fails
            }
        }

        console.log('🎤 TTS: Queue processing completed');
        this.isProcessingQueue = false;
    }

    private async waitForAudioToFinish(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.currentAudio) {
                console.log('🎤 TTS: No current audio, proceeding immediately');
                resolve();
                return;
            }

            console.log('🎤 TTS: Starting to wait for audio to finish...');
            
            // Add a timeout to prevent infinite waiting
            const timeout = setTimeout(() => {
                console.warn('🎤 TTS: Audio finish wait timeout, proceeding anyway');
                resolve();
            }, 30000); // 30 second timeout

            const checkEnded = () => {
                if (this.currentAudio && this.currentAudio.ended) {
                    console.log('🎤 TTS: Audio finished naturally');
                    clearTimeout(timeout);
                    resolve();
                } else {
                    // Check again in 100ms
                    setTimeout(checkEnded, 100);
                }
            };

            checkEnded();
        });
    }

    private async playSingleTTSResponse(responseText: string, voice: string = 'nova', onStart?: () => void, onEnd?: () => void): Promise<void> {
        try {
            console.log('🎤 TTS: Starting playback for voice:', voice);
            
            // Parse the LLM response to extract input and instructions
            const ttsData = this.parseVoiceResponse(responseText);
            console.log('🎤 TTS: Parsed data:', ttsData);
            
            this.initializeOpenAI();
            
            if (onStart) onStart();

            console.log('🎤 TTS: Creating OpenAI speech request...');
            // Create TTS audio using OpenAI
            const response = await this.openai!.audio.speech.create({
                model: 'tts-1',
                voice: voice as any, // Use the provided voice parameter
                input: ttsData.input,
                response_format: 'mp3',
                speed: 1.0
            });

            console.log('🎤 TTS: OpenAI response received, converting to audio...');
            // Convert response to audio and play
            const audioBuffer = await response.arrayBuffer();
            const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('🎤 TTS: Audio blob created, URL:', audioUrl);

            // Create and play new audio
            this.currentAudio = new Audio(audioUrl);
            
            // Set audio properties for better compatibility
            this.currentAudio.preload = 'auto';
            this.currentAudio.volume = 1;
            
            // Add more detailed event listeners
            this.currentAudio.addEventListener('loadstart', () => {
                console.log('🎤 TTS: Audio load started');
            });
            this.currentAudio.addEventListener('canplay', () => {
                console.log('🎤 TTS: Audio can play');
            });
            this.currentAudio.addEventListener('play', () => {
                console.log('🎤 TTS: Audio playback started');
            });
            this.currentAudio.addEventListener('ended', () => {
                console.log('🎤 TTS: Audio playback ended');
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
                if (onEnd) onEnd();
            });
            this.currentAudio.addEventListener('error', (error) => {
                console.error('🎤 TTS: Audio playback error:', error);
                console.error('🎤 TTS: Audio error details:', this.currentAudio?.error);
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
                if (onEnd) onEnd();
            });

            console.log('🎤 TTS: Attempting to play audio...');
            
            // Simple play attempt - if it fails, well show a message
            try {
                await this.currentAudio.play();
                console.log('🎤 TTS: Audio play() called successfully');
            } catch (playError: any) {
                console.error('🎤 TTS: Play failed:', playError);
                
                // Show a user-friendly message about autoplay
                if (playError.name === 'NotAllowedError') {
                    console.log('🎤 TTS: Autoplay blocked by browser - this is normal for subsequent audio');
                    
                    // Create a user-friendly notification
                    this.showAutoplayNotification(ttsData.input);
                    
                    // Dont throw the error, just log it and continue
                    // The audio will be available for manual play if needed
                    if (onEnd) onEnd();
                } else {
                    throw playError;
                }
            }

        } catch (error) {
            console.error('🎤 TTS Error:', error);
            if (onEnd) onEnd();
            throw error;
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
        }
        // Clear the queue when stopping
        this.audioQueue = [];
        this.isProcessingQueue = false;
    }

    skipCurrentAudio(): void {
        if (this.currentAudio) {
            console.log('🎤 TTS: Skipping current audio');
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        // Don't clear the queue, just continue with next item
    }

    isPlaying(): boolean {
        return this.currentAudio !== null && !this.currentAudio.paused && !this.currentAudio.ended;
    }

    getQueueLength(): number {
        return this.audioQueue.length;
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