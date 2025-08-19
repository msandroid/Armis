"use client"

import Image from 'next/image'

interface HeaderProps {
  className?: string
}

export function Header({ className = '' }: HeaderProps) {
  return (
    <header className={`flex items-center px-4 py-2 bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="relative w-8 h-8">
          <Image
            src="/icon.png"
            alt="Armis"
            width={32}
            height={32}
            className="rounded-md"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-gray-900">Armis</h1>
        </div>
      </div>
    </header>
  )
}
