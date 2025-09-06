import React from 'react';
import { motion } from 'framer-motion';
import { ShimmerText } from './shimmer-text';

interface ModelDownloadShimmerProps {
  modelName: string;
  progress: number;
  status: 'starting' | 'downloading' | 'verifying' | 'completed' | 'error';
  className?: string;
  downloadedBytes?: number;
  totalBytes?: number;
}

export const ModelDownloadShimmer: React.FC<ModelDownloadShimmerProps> = ({
  modelName,
  progress,
  status,
  className = '',
  downloadedBytes,
  totalBytes
}) => {
  // デバッグ用：常に表示する（後で条件を調整）
  console.log('ModelDownloadShimmer render:', { modelName, progress, status, downloadedBytes, totalBytes })
  
  // ダウンロードが完了またはエラーの場合は表示しない
  if (status === 'completed' || status === 'error') {
    console.log('ModelDownloadShimmer: completed or error, not rendering')
    return null;
  }

  // ダウンロード中でない場合は表示しない（startingステータスの場合は表示する）
  if (!modelName || (progress === 0 && status !== 'starting')) {
    console.log('ModelDownloadShimmer: no model name or progress is 0 (and not starting), not rendering')
    return null;
  }

  // ファイルサイズをフォーマットする関数
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ダウンロード量の表示テキストを生成
  const getDownloadText = () => {
    if (downloadedBytes !== undefined && totalBytes !== undefined) {
      const downloaded = formatFileSize(downloadedBytes);
      const total = formatFileSize(totalBytes);
      return `${downloaded} / ${total} (${progress}%)`;
    }
    // 容量情報が利用できない場合は、パーセンテージのみを表示
    return `${progress}%`;
  };

  // ステータスに応じたメッセージを生成
  const getStatusMessage = () => {
    switch (status) {
      case 'starting':
        return `Getting Started ${modelName}...`;
      case 'downloading':
        return `Downloading ${modelName}...`;
      case 'verifying':
        return `Verifying ${modelName}...`;
      default:
        return `Processing ${modelName}...`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 p-4 ${className}`}
    >
      {/* ステータスメッセージ（Shimmer Effect） */}
      <ShimmerText className="text-sm font-medium text-blue-600 dark:text-blue-400">
        {getStatusMessage()}
      </ShimmerText>
      {/* 進行状況表示 */}
      {status === 'downloading' && (
        <span className="text-xs text-muted-foreground">
          {getDownloadText()}
        </span>
      )}
    </motion.div>
  );
};
