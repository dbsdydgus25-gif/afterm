'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  block?: boolean
}

export default function Button({ children, variant = 'primary', block, className = '', ...props }: ButtonProps) {
  const baseClass = 'btn'
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-ghost'
  const blockClass = block ? 'btn-block' : ''
  
  return (
    <button className={`${baseClass} ${variantClass} ${blockClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
