#!/usr/bin/env python3
"""
AI SDK Providers - 高品質ロゴ画像ダウンローダー
各プロバイダーの公式ロゴを高解像度で取得します
"""

import os
import requests
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
import json

# プロバイダーとロゴURLのマッピング（高品質版）
PROVIDERS = {
    # 主要プロバイダー - 高解像度ロゴ
    'xai-grok': {
        'urls': [
            'https://x.ai/logo.png',
            'https://x.ai/assets/logo.png',
            'https://x.ai/favicon.ico'
        ],
        'name': 'xAI Grok'
    },
    'vercel': {
        'urls': [
            'https://vercel.com/logo.png',
            'https://vercel.com/static/logo.png',
            'https://vercel.com/favicon.ico'
        ],
        'name': 'Vercel'
    },
    'openai': {
        'urls': [
            'https://openai.com/logo.png',
            'https://openai.com/static/logo.png',
            'https://openai.com/favicon.ico'
        ],
        'name': 'OpenAI'
    },
    'azure-openai': {
        'urls': [
            'https://azure.microsoft.com/logo.png',
            'https://azure.microsoft.com/static/logo.png',
            'https://azure.microsoft.com/favicon.ico'
        ],
        'name': 'Azure OpenAI'
    },
    'anthropic': {
        'urls': [
            'https://www.anthropic.com/logo.png',
            'https://www.anthropic.com/static/logo.png',
            'https://www.anthropic.com/favicon.ico'
        ],
        'name': 'Anthropic'
    },
    'amazon-bedrock': {
        'urls': [
            'https://aws.amazon.com/bedrock/logo.png',
            'https://aws.amazon.com/logo.png',
            'https://aws.amazon.com/favicon.ico'
        ],
        'name': 'Amazon Bedrock'
    },
    'groq': {
        'urls': [
            'https://groq.com/logo.png',
            'https://groq.com/static/logo.png',
            'https://groq.com/favicon.ico'
        ],
        'name': 'Groq'
    },
    'fal-ai': {
        'urls': [
            'https://fal.ai/logo.png',
            'https://fal.ai/static/logo.png',
            'https://fal.ai/favicon.ico'
        ],
        'name': 'Fal AI'
    },
    'deepinfra': {
        'urls': [
            'https://deepinfra.com/logo.png',
            'https://deepinfra.com/static/logo.png',
            'https://deepinfra.com/favicon.ico'
        ],
        'name': 'DeepInfra'
    },
    'google-generative-ai': {
        'urls': [
            'https://ai.google.dev/logo.png',
            'https://ai.google.dev/static/logo.png',
            'https://ai.google.dev/favicon.ico'
        ],
        'name': 'Google Generative AI'
    },
    'google-vertex-ai': {
        'urls': [
            'https://cloud.google.com/vertex-ai/logo.png',
            'https://cloud.google.com/logo.png',
            'https://cloud.google.com/favicon.ico'
        ],
        'name': 'Google Vertex AI'
    },
    'mistral-ai': {
        'urls': [
            'https://mistral.ai/logo.png',
            'https://mistral.ai/static/logo.png',
            'https://mistral.ai/favicon.ico'
        ],
        'name': 'Mistral AI'
    },
    'together-ai': {
        'urls': [
            'https://together.ai/logo.png',
            'https://together.ai/static/logo.png',
            'https://together.ai/favicon.ico'
        ],
        'name': 'Together.ai'
    },
    'cohere': {
        'urls': [
            'https://cohere.com/logo.png',
            'https://cohere.com/static/logo.png',
            'https://cohere.com/favicon.ico'
        ],
        'name': 'Cohere'
    },
    'fireworks': {
        'urls': [
            'https://fireworks.ai/logo.png',
            'https://fireworks.ai/static/logo.png',
            'https://fireworks.ai/favicon.ico'
        ],
        'name': 'Fireworks'
    },
    'deepseek': {
        'urls': [
            'https://deepseek.com/logo.png',
            'https://deepseek.com/static/logo.png',
            'https://deepseek.com/favicon.ico'
        ],
        'name': 'DeepSeek'
    },
    'cerebras': {
        'urls': [
            'https://cerebras.net/logo.png',
            'https://cerebras.net/static/logo.png',
            'https://cerebras.net/favicon.ico'
        ],
        'name': 'Cerebras'
    },
    'perplexity': {
        'urls': [
            'https://perplexity.ai/logo.png',
            'https://perplexity.ai/static/logo.png',
            'https://perplexity.ai/favicon.ico'
        ],
        'name': 'Perplexity'
    },
    'luma-ai': {
        'urls': [
            'https://lumalabs.ai/logo.png',
            'https://lumalabs.ai/static/logo.png',
            'https://lumalabs.ai/favicon.ico'
        ],
        'name': 'Luma AI'
    },
    
    # 音声・音響系プロバイダー
    'elevenlabs': {
        'urls': [
            'https://elevenlabs.io/logo.png',
            'https://elevenlabs.io/static/logo.png',
            'https://elevenlabs.io/favicon.ico'
        ],
        'name': 'ElevenLabs'
    },
    'assemblyai': {
        'urls': [
            'https://www.assemblyai.com/logo.png',
            'https://www.assemblyai.com/static/logo.png',
            'https://www.assemblyai.com/favicon.ico'
        ],
        'name': 'AssemblyAI'
    },
    'deepgram': {
        'urls': [
            'https://deepgram.com/logo.png',
            'https://deepgram.com/static/logo.png',
            'https://deepgram.com/favicon.ico'
        ],
        'name': 'Deepgram'
    },
    'gladia': {
        'urls': [
            'https://gladia.io/logo.png',
            'https://gladia.io/static/logo.png',
            'https://gladia.io/favicon.ico'
        ],
        'name': 'Gladia'
    },
    'lmnt': {
        'urls': [
            'https://lmnt.com/logo.png',
            'https://lmnt.com/static/logo.png',
            'https://lmnt.com/favicon.ico'
        ],
        'name': 'LMNT'
    },
    'hume': {
        'urls': [
            'https://hume.ai/logo.png',
            'https://hume.ai/static/logo.png',
            'https://hume.ai/favicon.ico'
        ],
        'name': 'Hume'
    },
    'rev-ai': {
        'urls': [
            'https://www.rev.ai/logo.png',
            'https://www.rev.ai/static/logo.png',
            'https://www.rev.ai/favicon.ico'
        ],
        'name': 'Rev.ai'
    },
    
    # コミュニティプロバイダー
    'ollama': {
        'urls': [
            'https://ollama.ai/logo.png',
            'https://ollama.ai/static/logo.png',
            'https://ollama.ai/favicon.ico'
        ],
        'name': 'Ollama'
    },
    'portkey': {
        'urls': [
            'https://portkey.ai/logo.png',
            'https://portkey.ai/static/logo.png',
            'https://portkey.ai/favicon.ico'
        ],
        'name': 'Portkey'
    },
    'openrouter': {
        'urls': [
            'https://openrouter.ai/logo.png',
            'https://openrouter.ai/static/logo.png',
            'https://openrouter.ai/favicon.ico'
        ],
        'name': 'OpenRouter'
    },
    'crosshatch': {
        'urls': [
            'https://crosshatch.ai/logo.png',
            'https://crosshatch.ai/static/logo.png',
            'https://crosshatch.ai/favicon.ico'
        ],
        'name': 'Crosshatch'
    },
    'mixedbread': {
        'urls': [
            'https://mixedbread.ai/logo.png',
            'https://mixedbread.ai/static/logo.png',
            'https://mixedbread.ai/favicon.ico'
        ],
        'name': 'Mixedbread'
    },
    'voyage-ai': {
        'urls': [
            'https://voyageai.com/logo.png',
            'https://voyageai.com/static/logo.png',
            'https://voyageai.com/favicon.ico'
        ],
        'name': 'Voyage AI'
    },
    'jina-ai': {
        'urls': [
            'https://jina.ai/logo.png',
            'https://jina.ai/static/logo.png',
            'https://jina.ai/favicon.ico'
        ],
        'name': 'Jina AI'
    },
    'mem0': {
        'urls': [
            'https://mem0.ai/logo.png',
            'https://mem0.ai/static/logo.png',
            'https://mem0.ai/favicon.ico'
        ],
        'name': 'Mem0'
    },
    'letta': {
        'urls': [
            'https://letta.ai/logo.png',
            'https://letta.ai/static/logo.png',
            'https://letta.ai/favicon.ico'
        ],
        'name': 'Letta'
    },
    'spark': {
        'urls': [
            'https://spark.ai/logo.png',
            'https://spark.ai/static/logo.png',
            'https://spark.ai/favicon.ico'
        ],
        'name': 'Spark'
    },
    'inflection-ai': {
        'urls': [
            'https://inflection.ai/logo.png',
            'https://inflection.ai/static/logo.png',
            'https://inflection.ai/favicon.ico'
        ],
        'name': 'Inflection AI'
    },
    'langdb': {
        'urls': [
            'https://langdb.com/logo.png',
            'https://langdb.com/static/logo.png',
            'https://langdb.com/favicon.ico'
        ],
        'name': 'LangDB'
    },
    'sambanova': {
        'urls': [
            'https://sambanova.ai/logo.png',
            'https://sambanova.ai/static/logo.png',
            'https://sambanova.ai/favicon.ico'
        ],
        'name': 'SambaNova'
    },
    'dify': {
        'urls': [
            'https://dify.ai/logo.png',
            'https://dify.ai/static/logo.png',
            'https://dify.ai/favicon.ico'
        ],
        'name': 'Dify'
    },
    'sarvam': {
        'urls': [
            'https://sarvam.ai/logo.png',
            'https://sarvam.ai/static/logo.png',
            'https://sarvam.ai/favicon.ico'
        ],
        'name': 'Sarvam'
    },
    'builtin-ai': {
        'urls': [
            'https://builtin.ai/logo.png',
            'https://builtin.ai/static/logo.png',
            'https://builtin.ai/favicon.ico'
        ],
        'name': 'Built-in AI'
    },
    
    # アダプター・統合
    'langchain': {
        'urls': [
            'https://langchain.com/logo.png',
            'https://langchain.com/static/logo.png',
            'https://langchain.com/favicon.ico'
        ],
        'name': 'LangChain'
    },
    'llamaindex': {
        'urls': [
            'https://www.llamaindex.ai/logo.png',
            'https://www.llamaindex.ai/static/logo.png',
            'https://www.llamaindex.ai/favicon.ico'
        ],
        'name': 'LlamaIndex'
    },
    
    # オブザーバビリティ統合
    'braintrust': {
        'urls': [
            'https://braintrust.com/logo.png',
            'https://braintrust.com/static/logo.png',
            'https://braintrust.com/favicon.ico'
        ],
        'name': 'Braintrust'
    },
    'helicone': {
        'urls': [
            'https://helicone.ai/logo.png',
            'https://helicone.ai/static/logo.png',
            'https://helicone.ai/favicon.ico'
        ],
        'name': 'Helicone'
    },
    'laminar': {
        'urls': [
            'https://laminar.ai/logo.png',
            'https://laminar.ai/static/logo.png',
            'https://laminar.ai/favicon.ico'
        ],
        'name': 'Laminar'
    },
    'langfuse': {
        'urls': [
            'https://langfuse.com/logo.png',
            'https://langfuse.com/static/logo.png',
            'https://langfuse.com/favicon.ico'
        ],
        'name': 'Langfuse'
    },
    'langwatch': {
        'urls': [
            'https://langwatch.ai/logo.png',
            'https://langwatch.ai/static/logo.png',
            'https://langwatch.ai/favicon.ico'
        ],
        'name': 'LangWatch'
    },
    'maxim': {
        'urls': [
            'https://maxim.ai/logo.png',
            'https://maxim.ai/static/logo.png',
            'https://maxim.ai/favicon.ico'
        ],
        'name': 'Maxim'
    },
    'patronus': {
        'urls': [
            'https://patronus.ai/logo.png',
            'https://patronus.ai/static/logo.png',
            'https://patronus.ai/favicon.ico'
        ],
        'name': 'Patronus'
    },
    'signoz': {
        'urls': [
            'https://signoz.io/logo.png',
            'https://signoz.io/static/logo.png',
            'https://signoz.io/favicon.ico'
        ],
        'name': 'SigNoz'
    },
    'traceloop': {
        'urls': [
            'https://traceloop.com/logo.png',
            'https://traceloop.com/static/logo.png',
            'https://traceloop.com/favicon.ico'
        ],
        'name': 'Traceloop'
    },
    'weave': {
        'urls': [
            'https://weave.ai/logo.png',
            'https://weave.ai/static/logo.png',
            'https://weave.ai/favicon.ico'
        ],
        'name': 'Weave'
    }
}

def download_logo(provider_key, provider_info, output_dir):
    """指定されたプロバイダーのロゴをダウンロード"""
    name = provider_info['name']
    urls = provider_info['urls']
    
    print(f"🔍 Downloading {name} logo...")
    
    for i, url in enumerate(urls):
        try:
            response = requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            
            if response.status_code == 200:
                # ファイル拡張子を決定
                content_type = response.headers.get('content-type', '')
                if 'png' in content_type:
                    ext = 'png'
                elif 'svg' in content_type:
                    ext = 'svg'
                elif 'ico' in content_type:
                    ext = 'ico'
                else:
                    ext = 'png'  # デフォルト
                
                filename = f"{provider_key}.{ext}"
                filepath = output_dir / filename
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                print(f"✅ Downloaded: {filename}")
                return True
                
        except Exception as e:
            if i == len(urls) - 1:  # 最後のURLでも失敗
                print(f"❌ Failed to download {name}: {str(e)}")
                return False
            continue
    
    return False

def main():
    """メイン実行関数"""
    # 出力ディレクトリを作成
    output_dir = Path('logos-high-quality')
    output_dir.mkdir(exist_ok=True)
    
    print("🚀 Starting high-quality logo downloads...\n")
    
    results = {
        'success': [],
        'failed': []
    }
    
    for provider_key, provider_info in PROVIDERS.items():
        success = download_logo(provider_key, provider_info, output_dir)
        
        if success:
            results['success'].append(provider_info['name'])
        else:
            results['failed'].append(provider_info['name'])
        
        # レート制限を避けるため少し待機
        time.sleep(0.5)
    
    # 結果サマリー
    print(f"\n📊 Download Summary:")
    print(f"✅ Successfully downloaded: {len(results['success'])} logos")
    print(f"❌ Failed downloads: {len(results['failed'])} logos")
    
    if results['failed']:
        print(f"\n❌ Failed downloads:")
        for name in results['failed']:
            print(f"  - {name}")
    
    print(f"\n📁 Logos saved to: {output_dir}")
    
    # 結果をJSONファイルに保存
    with open(output_dir / 'download-results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Results saved to: {output_dir / 'download-results.json'}")

if __name__ == '__main__':
    main()
