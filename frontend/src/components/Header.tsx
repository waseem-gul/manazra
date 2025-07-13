import React from 'react';
import { MessageSquare, Github, ExternalLink } from 'lucide-react';

const Header: React.FC = () => {
    return (
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-primary p-2 rounded-lg">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Manazra</h1>
                            <p className="text-sm text-gray-500">AI Conversation Tool</p>
                        </div>
                    </div>

                    <nav className="flex items-center space-x-6">
                        <a
                            href="#features"
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#about"
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            About
                        </a>
                        <a
                            href="https://github.com/waseem-gul/manazra"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <Github className="w-5 h-5" />
                            <span>GitHub</span>
                        </a>
                        <a
                            href="https://manazra.com/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 btn btn-primary"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>Docs</span>
                        </a>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header; 