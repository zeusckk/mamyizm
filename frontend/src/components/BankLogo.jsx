import React, { useState } from 'react';
import { getBank, bankLogoUrl, getBankInitials } from '../data/banks';

/**
 * BankLogo: renders Clearbit logo for known Turkish banks with brand-color fallback to initials.
 * Props: code (preferred) OR name. size in px.
 */
export const BankLogo = ({ code, name, size = 40, className = '', rounded = 'rounded-lg' }) => {
  const [err, setErr] = useState(false);
  const bank = getBank(code) || { name: name || 'Banka', color: '#64748B', text: '#FFFFFF', domain: '' };
  const url = bankLogoUrl(code);
  const initials = getBankInitials(code || name);
  const showInitials = err || !url;

  if (showInitials) {
    return (
      <div
        className={`${rounded} flex items-center justify-center font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, background: bank.color, color: bank.text, fontSize: size * 0.36, letterSpacing: '-0.02em' }}
        aria-label={bank.name}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${rounded} bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label={bank.name}
    >
      <img
        src={url}
        alt={bank.name}
        onError={() => setErr(true)}
        className="w-full h-full object-contain p-1"
        loading="lazy"
      />
    </div>
  );
};

export default BankLogo;
