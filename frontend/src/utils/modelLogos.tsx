import React from 'react';

// Model company mapping based on model names
export const getModelCompany = (modelName: string): string => {
    const name = modelName.toLowerCase();

    if (name.includes('gpt') || name.includes('openai')) {
        return 'openai';
    } else if (name.includes('gemini') || name.includes('google')) {
        return 'google';
    } else if (name.includes('claude') || name.includes('anthropic')) {
        return 'anthropic';
    } else if (name.includes('llama') || name.includes('meta')) {
        return 'meta';
    } else if (name.includes('mistral')) {
        return 'mistral';
    } else if (name.includes('xai') || name.includes('grok')) {
        return 'x';
    }

    return 'generic';
};

// Company display names
export const getCompanyDisplayName = (company: string): string => {
    const companyNames = {
        openai: 'OpenAI',
        google: 'Google',
        anthropic: 'Anthropic',
        meta: 'Meta',
        mistral: 'Mistral AI',
        cohere: 'Cohere',
        nvidia: 'NVIDIA',
        deepseek: 'DeepSeek',
        alibaba: 'Alibaba',
        '01ai': '01.AI',
        generic: 'AI Model'
    };

    return companyNames[company as keyof typeof companyNames] || 'AI Model';
};

// Logo component with fallback
interface ModelLogoProps {
    modelName: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const ModelLogo: React.FC<ModelLogoProps> = ({ modelName, size = 'md', className = '' }) => {
    const company = getModelCompany(modelName);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    };

    const baseClass = `${sizeClasses[size]} ${className}`;

    // Try to load the actual logo first, fallback to placeholder
    const logoPath = `/logos/${company}.svg`;

    return (
        <div className={`${baseClass} flex items-center justify-center`}>
            <img
                src={logoPath}
                alt={`${getCompanyDisplayName(company)} logo`}
                className={baseClass}
                onError={(e) => {
                    // Fallback to placeholder div if image fails to load
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                        parent.innerHTML = `
                            <div class="${baseClass} bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                ${getCompanyDisplayName(company).substring(0, 2).toUpperCase()}
                            </div>
                        `;
                    }
                }}
            />
        </div>
    );
};

export default ModelLogo; 