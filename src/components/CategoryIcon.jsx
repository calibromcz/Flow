import React from 'react';
import * as Icons from 'lucide-react';
import { CATEGORY_ICONS_MAP } from './IconPicker';
import { usePrivacy } from '../context/PrivacyContext';

export const CategoryIcon = ({ name, className = "w-5 h-5", color = "#007AFF" }) => {
  const Fallback = Icons.Tag || 'span';

  // 1. Cerca nella nostra mappa sicura di icone stilizzate
  if (name && CATEGORY_ICONS_MAP && typeof CATEGORY_ICONS_MAP[name] === 'function') {
    const Component = CATEGORY_ICONS_MAP[name];
    return <Component className={className} strokeWidth={1.75} style={{ color }} />;
  }

  // 2. Se è un nome generico di Lucide
  if (name && typeof Icons[name] === 'function') {
    const Component = Icons[name];
    return <Component className={className} strokeWidth={1.75} style={{ color }} />;
  }

  // 3. Se il nome è un emoji o testo, mostralo pulito dentro uno span anziché crashare
  if (typeof name === 'string' && name.trim() && !/^[A-Za-z0-9_-]+$/.test(name)) {
    return <span className={`inline-flex items-center justify-center text-sm ${className}`}>{name}</span>;
  }

  // 4. Fallback di default
  if (typeof Fallback === 'function') {
    return <Fallback className={className} strokeWidth={1.75} style={{ color }} />;
  }
  return <span className={className} style={{ color }}>●</span>;
};

export const formatCurrency = (amount) => {
  const numeric = typeof amount === 'number' ? amount : (parseFloat(String(amount).replace(',', '.')) || 0);
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numeric);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

// Componente speciale che rispetta la Modalità Privacy con effetto Blur nativo
export const PrivacyAmount = ({ amount, prefix = '', className = '', blurClassName = 'blur-md opacity-75' }) => {
  const { isPrivacyMode } = usePrivacy();

  if (isPrivacyMode) {
    return (
      <span className={`inline-block select-none transition-all duration-300 ${blurClassName} ${className}`}>
        {prefix}•••• €
      </span>
    );
  }

  return (
    <span className={`transition-all duration-300 ${className}`}>
      {prefix}{formatCurrency(amount)}
    </span>
  );
};
