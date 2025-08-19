"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileIcon, X, FileText, Image, Code, FileVideo, FileAudio, Archive } from "lucide-react"

interface FilePreviewProps {
  file: File
  onRemove?: () => void
  showPreview?: boolean
}

export const FilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  (props, ref) => {
    const { showPreview = true } = props

    if (props.file.type.startsWith("image/")) {
      return <ImageFilePreview {...props} ref={ref} showPreview={showPreview} />
    }

    if (
      props.file.type.startsWith("text/") ||
      props.file.name.endsWith(".txt") ||
      props.file.name.endsWith(".md") ||
      props.file.name.endsWith(".json") ||
      props.file.name.endsWith(".js") ||
      props.file.name.endsWith(".ts") ||
      props.file.name.endsWith(".jsx") ||
      props.file.name.endsWith(".tsx") ||
      props.file.name.endsWith(".css") ||
      props.file.name.endsWith(".html") ||
      props.file.name.endsWith(".xml") ||
      props.file.name.endsWith(".csv") ||
      props.file.name.endsWith(".log")
    ) {
      return <TextFilePreview {...props} ref={ref} showPreview={showPreview} />
    }

    if (props.file.type.startsWith("video/")) {
      return <VideoFilePreview {...props} ref={ref} showPreview={showPreview} />
    }

    if (props.file.type.startsWith("audio/")) {
      return <AudioFilePreview {...props} ref={ref} showPreview={showPreview} />
    }

    if (
      props.file.type.includes("zip") ||
      props.file.type.includes("rar") ||
      props.file.type.includes("7z") ||
      props.file.name.endsWith(".zip") ||
      props.file.name.endsWith(".rar") ||
      props.file.name.endsWith(".7z") ||
      props.file.name.endsWith(".tar") ||
      props.file.name.endsWith(".gz")
    ) {
      return <ArchiveFilePreview {...props} ref={ref} showPreview={showPreview} />
    }

    return <GenericFilePreview {...props} ref={ref} showPreview={showPreview} />
  }
)
FilePreview.displayName = "FilePreview"

const ImageFilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ file, onRemove, showPreview }, ref) => {
    const [imageUrl, setImageUrl] = useState<string>("")
    const [error, setError] = useState(false)

    useEffect(() => {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }, [file])

    return (
      <motion.div
        ref={ref}
        className="relative flex max-w-[200px] rounded-md border p-1.5 pr-2 text-xs"
        layout
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
      >
        <div className="flex w-full items-center space-x-2">
          {showPreview && !error ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm border bg-muted">
              <img
                alt={`Preview of ${file.name}`}
                className="h-full w-full object-cover"
                src={imageUrl}
                onError={() => setError(true)}
              />
            </div>
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border bg-muted">
              <Image className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex w-full flex-col">
            <span className="truncate text-muted-foreground">{file.name}</span>
            <span className="text-[10px] text-muted-foreground/70">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>

        {onRemove ? (
          <button
            className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border bg-background hover:bg-muted"
            type="button"
            onClick={onRemove}
            aria-label="Remove attachment"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </motion.div>
    )
  }
)
ImageFilePreview.displayName = "ImageFilePreview"

const TextFilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ file, onRemove, showPreview }, ref) => {
    const [preview, setPreview] = useState<string>("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      if (!showPreview) {
        setLoading(false)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setPreview(text.slice(0, 100) + (text.length > 100 ? "..." : ""))
        setLoading(false)
      }
      reader.onerror = () => {
        setLoading(false)
      }
      reader.readAsText(file)
    }, [file, showPreview])

    const getFileIcon = () => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      switch (ext) {
        case 'md':
          return <FileText className="h-5 w-5 text-muted-foreground" />
        case 'json':
        case 'js':
        case 'ts':
        case 'jsx':
        case 'tsx':
        case 'html':
        case 'xml':
        case 'css':
          return <Code className="h-5 w-5 text-muted-foreground" />
        default:
          return <FileText className="h-5 w-5 text-muted-foreground" />
      }
    }

    return (
      <motion.div
        ref={ref}
        className="relative flex max-w-[200px] rounded-md border p-1.5 pr-2 text-xs"
        layout
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
      >
        <div className="flex w-full items-center space-x-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border bg-muted p-0.5">
            {showPreview ? (
              <div className="h-full w-full overflow-hidden text-[6px] leading-none text-muted-foreground">
                {loading ? "Loading..." : preview || "Empty file"}
              </div>
            ) : (
              getFileIcon()
            )}
          </div>
          <div className="flex w-full flex-col">
            <span className="truncate text-muted-foreground">{file.name}</span>
            <span className="text-[10px] text-muted-foreground/70">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>

        {onRemove ? (
          <button
            className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border bg-background hover:bg-muted"
            type="button"
            onClick={onRemove}
            aria-label="Remove attachment"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </motion.div>
    )
  }
)
TextFilePreview.displayName = "TextFilePreview"

const VideoFilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ file, onRemove, showPreview }, ref) => {
    const [videoUrl, setVideoUrl] = useState<string>("")

    useEffect(() => {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      return () => URL.revokeObjectURL(url)
    }, [file])

    return (
      <motion.div
        ref={ref}
        className="relative flex max-w-[200px] rounded-md border p-1.5 pr-2 text-xs"
        layout
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
      >
        <div className="flex w-full items-center space-x-2">
          {showPreview ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm border bg-muted">
              <video
                className="h-full w-full object-cover"
                src={videoUrl}
                muted
                preload="metadata"
              />
            </div>
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border bg-muted">
              <FileVideo className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex w-full flex-col">
            <span className="truncate text-muted-foreground">{file.name}</span>
            <span className="text-[10px] text-muted-foreground/70">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>

        {onRemove ? (
          <button
            className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border bg-background hover:bg-muted"
            type="button"
            onClick={onRemove}
            aria-label="Remove attachment"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </motion.div>
    )
  }
)
VideoFilePreview.displayName = "VideoFilePreview"

const AudioFilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ file, onRemove, showPreview }, ref) => {
    const [audioUrl, setAudioUrl] = useState<string>("")

    useEffect(() => {
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      return () => URL.revokeObjectURL(url)
    }, [file])

    return (
      <motion.div
        ref={ref}
        className="relative flex max-w-[200px] rounded-md border p-1.5 pr-2 text-xs"
        layout
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
      >
        <div className="flex w-full items-center space-x-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border bg-muted">
            <FileAudio className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex w-full flex-col">
            <span className="truncate text-muted-foreground">{file.name}</span>
            <span className="text-[10px] text-muted-foreground/70">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>

        {showPreview && (
          <audio
            className="absolute -bottom-6 left-0 h-6 w-full opacity-0"
            src={audioUrl}
            controls
            preload="metadata"
          />
        )}

        {onRemove ? (
          <button
            className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border bg-background hover:bg-muted"
            type="button"
            onClick={onRemove}
            aria-label="Remove attachment"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </motion.div>
    )
  }
)
AudioFilePreview.displayName = "AudioFilePreview"

const ArchiveFilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ file, onRemove, showPreview }, ref) => {
    return (
      <motion.div
        ref={ref}
        className="relative flex max-w-[200px] rounded-md border p-1.5 pr-2 text-xs"
        layout
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
      >
        <div className="flex w-full items-center space-x-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border bg-muted">
            <Archive className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex w-full flex-col">
            <span className="truncate text-muted-foreground">{file.name}</span>
            <span className="text-[10px] text-muted-foreground/70">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>

        {onRemove ? (
          <button
            className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border bg-background hover:bg-muted"
            type="button"
            onClick={onRemove}
            aria-label="Remove attachment"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </motion.div>
    )
  }
)
ArchiveFilePreview.displayName = "ArchiveFilePreview"

const GenericFilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ file, onRemove, showPreview }, ref) => {
    return (
      <motion.div
        ref={ref}
        className="relative flex max-w-[200px] rounded-md border p-1.5 pr-2 text-xs"
        layout
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
      >
        <div className="flex w-full items-center space-x-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border bg-muted">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex w-full flex-col">
            <span className="truncate text-muted-foreground">{file.name}</span>
            <span className="text-[10px] text-muted-foreground/70">
              {file.size > 1024 * 1024 
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : `${(file.size / 1024).toFixed(1)} KB`
              }
            </span>
          </div>
        </div>

        {onRemove ? (
          <button
            className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border bg-background hover:bg-muted"
            type="button"
            onClick={onRemove}
            aria-label="Remove attachment"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </motion.div>
    )
  }
)
GenericFilePreview.displayName = "GenericFilePreview"
