import React from 'react';
import { X } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/60 overflow-hidden relative p-6 sm:p-8 text-center animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: 'rgb(4, 42, 59)' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0a3a52] rounded-xl transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SISCOP v.1.0 (Fontes reduzidas em 2x: SISCOP 30px negrito prateado / v.1.0 15px cinza mais escuro) */}
        <div className="flex items-baseline justify-center gap-2 leading-none pt-1">
          <span
            className="font-bold tracking-tight"
            style={{ fontSize: '30px', color: '#E2E8F0' }}
          >
            SISCOP
          </span>
          <span
            className="font-mono font-semibold"
            style={{ fontSize: '15px', color: '#94A3B8' }}
          >
            v.1.0
          </span>
        </div>

        {/* Linha Divisória 1 (cinza um pouco mais escuro) */}
        <div
          className="w-24 h-px mx-auto my-4"
          style={{ backgroundColor: '#52667A' }}
        />

        {/* Developed Section (Fontes reduzidas em 2x: Developed 18px negrito itálico / Rafael 18px / Registro 12px) */}
        <div className="space-y-0.5">
          <div
            className="font-bold italic leading-tight"
            style={{ fontSize: '18px', color: '#E2E8F0' }}
          >
            Developed
          </div>
          <div
            className="font-medium leading-tight"
            style={{ fontSize: '18px', color: '#E2E8F0' }}
          >
            Rafael L. B. Silva
          </div>
          <div
            className="font-mono leading-tight"
            style={{ fontSize: '12px', color: '#94A3B8' }}
          >
            (24876-1)
          </div>
        </div>

        {/* Linha Divisória 2 (cinza um pouco mais escuro) */}
        <div
          className="w-24 h-px mx-auto my-4"
          style={{ backgroundColor: '#52667A' }}
        />

        {/* Powered Section (Fontes reduzidas em 2x: Powered 18px negrito itálico / AI Studio Google 18px) */}
        <div className="space-y-0.5">
          <div
            className="font-bold italic leading-tight"
            style={{ fontSize: '18px', color: '#E2E8F0' }}
          >
            Powered
          </div>
          <div
            className="font-medium leading-tight"
            style={{ fontSize: '18px', color: '#E2E8F0' }}
          >
            AI Studio Google
          </div>
        </div>

        {/* Espaço de distância de duas linhas + Copyright (Fonte 2x reduzida: 12px cinza um pouco mais escuro) */}
        <div className="mt-6 pt-1 text-center">
          <span
            className="font-normal tracking-wide block"
            style={{ fontSize: '12px', color: '#94A3B8' }}
          >
            &copy; Todos os Direitos Reservados - 2026
          </span>
        </div>
      </div>
    </div>
  );
};
