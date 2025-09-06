import React from 'react'

interface IconProps {
  className?: string
  size?: number
}

// ロゴ画像のインポート
// 注意: 実際のプロジェクトでは、これらの画像をpublicディレクトリに配置し、
// 動的にインポートするか、URLとして参照する必要があります

// ロゴ画像コンポーネント
const LogoIcon: React.FC<IconProps & { src: string; alt: string }> = ({ 
  className = '', 
  size = 24, 
  src, 
  alt 
}) => {
  const [hasError, setHasError] = React.useState(false)

  if (hasError) {
    // エラー時のフォールバックアイコン
    return (
      <div
        className={`bg-gray-200 rounded flex items-center justify-center ${className}`}
        style={{ 
          width: size, 
          height: size,
          fontSize: size * 0.4,
          fontWeight: 'bold',
          color: '#6B7280'
        }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ 
        width: size, 
        height: size,
        borderRadius: '4px' // ロゴに適度な角丸を追加
      }}
      onError={() => setHasError(true)}
    />
  )
}

// 各プロバイダーのロゴアイコン
export const XAIGrokLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/xai-grok.ico" 
    alt="xAI Grok" 
  />
)

export const VercelLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/vercel.ico" 
    alt="Vercel" 
  />
)

export const OpenAILogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/openai.ico" 
    alt="OpenAI" 
  />
)

export const AzureOpenAILogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/azure-openai.ico" 
    alt="Azure OpenAI" 
  />
)

export const AnthropicLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/anthropic.ico" 
    alt="Anthropic" 
  />
)

export const AmazonBedrockLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/amazon-bedrock.ico" 
    alt="Amazon Bedrock" 
  />
)

export const GroqLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/groq.ico" 
    alt="Groq" 
  />
)

export const FalAILogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/fal-ai.ico" 
    alt="Fal AI" 
  />
)

export const DeepInfraLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/deepinfra.ico" 
    alt="DeepInfra" 
  />
)

export const GoogleVertexAILogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/google-vertex-ai.ico" 
    alt="Google Vertex AI" 
  />
)

export const MistralAILogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/mistral-ai.ico" 
    alt="Mistral AI" 
  />
)

export const CohereLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/cohere.ico" 
    alt="Cohere" 
  />
)

export const FireworksLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/fireworks.ico" 
    alt="Fireworks" 
  />
)

export const ElevenLabsLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/elevenlabs.ico" 
    alt="ElevenLabs" 
  />
)

export const AssemblyAILogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/assemblyai.ico" 
    alt="AssemblyAI" 
  />
)

export const DeepgramLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/deepgram.ico" 
    alt="Deepgram" 
  />
)

export const OpenRouterLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/openrouter.ico" 
    alt="OpenRouter" 
  />
)

export const JinaAILogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/jina-ai.ico" 
    alt="Jina AI" 
  />
)

export const Mem0LogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/mem0.ico" 
    alt="Mem0" 
  />
)

export const LlamaIndexLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/llamaindex.ico" 
    alt="LlamaIndex" 
  />
)

export const LangfuseLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/langfuse.ico" 
    alt="Langfuse" 
  />
)

export const WeaveLogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/weave.ico" 
    alt="Weave" 
  />
)

export const InworldAILogoIcon: React.FC<IconProps> = (props) => (
  <LogoIcon 
    {...props} 
    src="/logos/inworld-ai.ico" 
    alt="Inworld AI" 
  />
)

// プロバイダーIDからロゴアイコンを取得する関数
export const getProviderLogoIcon = (providerId: string): React.FC<IconProps> => {
  switch (providerId.toLowerCase()) {
    case 'xai':
    case 'xai-grok':
      return XAIGrokLogoIcon
    case 'vercel':
      return VercelLogoIcon
    case 'openai':
      // OpenAIのSVGアイコンを直接使用
      return ({ className = '', size = 24 }: IconProps) => (
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
    case 'azure':
    case 'azure-openai':
      return AzureOpenAILogoIcon
    case 'anthropic':
      return AnthropicLogoIcon
    case 'amazon':
    case 'amazon-bedrock':
      return AmazonBedrockLogoIcon
    case 'groq':
      return GroqLogoIcon
    case 'fal':
    case 'fal-ai':
      return FalAILogoIcon
    case 'deepinfra':
      return DeepInfraLogoIcon
    case 'google':
    case 'google-vertex-ai':
    case 'google-generative-ai':
      return GoogleVertexAILogoIcon
    case 'mistral':
    case 'mistral-ai':
      return MistralAILogoIcon
    case 'cohere':
      return CohereLogoIcon
    case 'fireworks':
      return FireworksLogoIcon
    case 'elevenlabs':
      return ElevenLabsLogoIcon
    case 'assemblyai':
      return AssemblyAILogoIcon
    case 'deepgram':
      return DeepgramLogoIcon
    case 'openrouter':
      return OpenRouterLogoIcon
    case 'jina':
    case 'jina-ai':
      return JinaAILogoIcon
    case 'mem0':
      return Mem0LogoIcon
    case 'llamaindex':
      return LlamaIndexLogoIcon
    case 'langfuse':
      return LangfuseLogoIcon
    case 'weave':
      return WeaveLogoIcon
    case 'inworld':
    case 'inworld-ai':
      return InworldAILogoIcon
    case 'ollama':
      // Ollamaのロゴがない場合は、デフォルトアイコンを使用
      return ({ className = '', size = 24 }: IconProps) => (
        <div
          className={`bg-blue-500 rounded flex items-center justify-center ${className}`}
          style={{ 
            width: size, 
            height: size,
            fontSize: size * 0.4,
            fontWeight: 'bold',
            color: 'white'
          }}
        >
          O
        </div>
      )
    case 'llama-cpp':
      // Llama.cppのロゴがない場合は、デフォルトアイコンを使用
      return ({ className = '', size = 24 }: IconProps) => (
        <div
          className={`bg-orange-500 rounded flex items-center justify-center ${className}`}
          style={{ 
            width: size, 
            height: size,
            fontSize: size * 0.4,
            fontWeight: 'bold',
            color: 'white'
          }}
        >
          L
        </div>
      )
    default:
      // デフォルトアイコン（ロゴが見つからない場合）
      return ({ className = '', size = 24 }: IconProps) => (
        <div
          className={`bg-gray-200 rounded flex items-center justify-center ${className}`}
          style={{ 
            width: size, 
            height: size,
            fontSize: size * 0.4,
            fontWeight: 'bold',
            color: '#6B7280'
          }}
        >
          {providerId.charAt(0).toUpperCase()}
        </div>
      )
  }
}
