import React from 'react'
import { getProviderLogoIcon } from './provider-logo-icons'

interface IconProps {
  className?: string
  size?: number
}

// Google Gemini Icon
export const GeminiIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="geminiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="25%" stopColor="#9C27B0" />
        <stop offset="50%" stopColor="#673AB7" />
        <stop offset="75%" stopColor="#FF5722" />
        <stop offset="100%" stopColor="#FFC107" />
      </linearGradient>
    </defs>
    <path
      d="M12 2L2 7v10l10 5 10-5V7l-10-5z"
      fill="url(#geminiGradient)"
      stroke="currentColor"
      strokeWidth="0.5"
    />
    <circle cx="12" cy="12" r="3" fill="white" opacity="0.8" />
  </svg>
)

// OpenAI Icon
export const OpenAIIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.508 4.508 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.612-1.5z"
      fill="#412991"
    />
  </svg>
)

// Anthropic Claude Icon
export const AnthropicIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C17.523 2 22 6.477 22 12s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 1.5A8.5 8.5 0 1 0 20.5 12 8.51 8.51 0 0 0 12 3.5z"
      fill="#D97706"
    />
    <path
      d="M9.5 8.5h1.25L13 16h-1.5l-.5-1.5h-2L8.5 16H7l2.25-7.5zm1.75 4.5L10.5 10l-.75 3h1.5z"
      fill="#D97706"
    />
  </svg>
)

// Mistral Icon
export const MistralIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2L22 7v10l-10 5L2 17V7l10-5z"
      fill="#FF7000"
      stroke="#FF7000"
      strokeWidth="1"
    />
    <path
      d="M12 8v8M8 10l8 4M8 14l8-4"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

// Ollama Icon
export const OllamaIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#000000" />
    <path
      d="M8 10c0-2.21 1.79-4 4-4s4 1.79 4 4v4c0 2.21-1.79 4-4 4s-4-1.79-4-4v-4z"
      fill="white"
    />
    <circle cx="10" cy="11" r="1" fill="#000000" />
    <circle cx="14" cy="11" r="1" fill="#000000" />
    <path
      d="M10 14c0 1.1.9 2 2 2s2-.9 2-2"
      stroke="#000000"
      strokeWidth="1"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
)

// Llama.cpp Icon
export const LlamaCppIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#00D2FF" />
    <path
      d="M7 8h2v8H7z M11 8h2v8h-2z M15 8h2v8h-2z"
      fill="white"
    />
    <path
      d="M6 6h12v2H6z M6 16h12v2H6z"
      fill="white"
    />
  </svg>
)

// Groq Icon
export const GroqIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C17.523 2 22 6.477 22 12s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"
      fill="#F55036"
    />
    <path
      d="M8 8h8l-4 8-4-8z"
      fill="white"
    />
  </svg>
)

// xAI Grok Icon
export const XAIIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="24" height="24" rx="4" fill="#000000" />
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

// Cohere Icon
export const CohereIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#39ADBB" />
    <path
      d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z"
      stroke="white"
      strokeWidth="2"
      fill="none"
    />
    <circle cx="12" cy="12" r="2" fill="white" />
  </svg>
)

// Cuboid Icon for Settings - Models
export const CuboidIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* 外枠 */}
    <path 
      d="M3 7l9-4 9 4v10l-9 4-9-4V7z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    {/* 中央ライン（奥行き表現） */}
    <path 
      d="M3 7l9 4 9-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    <path 
      d="M12 11v10" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

// Veo Icon
export const VeoIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#10B981" />
    <circle cx="12" cy="12" r="4" fill="white" />
    <path
      d="M10 12l2 2 4-4"
      stroke="#10B981"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

// Inworld AI Icon
export const InworldAIIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#4F46E5" />
    <path
      d="M8 12l3 3 5-5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

// Provider icon mapping
export const getProviderIcon = (providerId: string): React.FC<IconProps> => {
  // 新しいロゴアイコンシステムを優先的に使用
  try {
    const LogoIcon = getProviderLogoIcon(providerId)
    if (LogoIcon) {
      return LogoIcon
    }
  } catch (error) {
    console.warn('Logo icon not found for provider:', providerId, error)
  }

  // フォールバック: 既存のSVGアイコン
  switch (providerId) {
    case 'google':
      return GeminiIcon
    case 'openai':
      return OpenAIIcon
    case 'anthropic':
      return AnthropicIcon
    case 'mistral':
      return MistralIcon
    case 'ollama':
      return OllamaIcon
    case 'llama-cpp':
      return LlamaCppIcon
    case 'groq':
      return GroqIcon
    case 'xai':
      return XAIIcon
    case 'veo':
      return VeoIcon
    case 'inworld':
      return InworldAIIcon
    case 'cohere':
      return CohereIcon
    default:
      // Default fallback icon
      return ({ className = '', size = 24 }: IconProps) => (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <circle cx="12" cy="12" r="10" fill="#6B7280" />
          <path
            d="M12 8v8M8 12h8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
  }
}
