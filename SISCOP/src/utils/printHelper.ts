/**
 * Utilitário Unificado de Impressão de Alta Precisão do SISCOP
 * Garante fidelidade gráfica, dimensões exatas (A4 Retrato / A4 Paisagem),
 * limpeza de cabeçalhos/rodapés indesejados e isolamento estrito de documentos.
 */

export interface PrintOptions {
  orientation: 'landscape' | 'portrait';
  bodyClass: string;
  pageMargin?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Dispara a impressão do navegador com injeção dinâmica da regra @page
 * correspondente ao documento (Landscape para Carteirinhas, Portrait para Relatórios/Fichas)
 * e gerencia as classes no <body> com limpeza segura.
 */
export function executePrint({
  orientation,
  bodyClass,
  pageMargin = orientation === 'landscape' ? '0' : '6mm',
  onBeforePrint,
  onAfterPrint,
}: PrintOptions): void {
  // 1. Remover folha de estilo dinâmica anterior se houver
  const existingStyle = document.getElementById('siscop-dynamic-print-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // 2. Injetar a regra de paged media exata do documento a ser impresso
  const styleEl = document.createElement('style');
  styleEl.id = 'siscop-dynamic-print-style';
  styleEl.textContent = `
    @media print {
      @page {
        size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'} !important;
        margin: ${pageMargin} !important;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // 3. Adicionar classe de contexto ao body
  document.body.classList.add(bodyClass);

  if (onBeforePrint) {
    try {
      onBeforePrint();
    } catch (e) {
      console.warn('onBeforePrint warning:', e);
    }
  }

  // 4. Mecanismo de limpeza no afterprint
  let isCleanedUp = false;
  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    document.body.classList.remove(bodyClass);
    const styleToRemove = document.getElementById('siscop-dynamic-print-style');
    if (styleToRemove) {
      styleToRemove.remove();
    }
    window.removeEventListener('afterprint', cleanup);
    if (onAfterPrint) {
      try {
        onAfterPrint();
      } catch (e) {
        console.warn('onAfterPrint warning:', e);
      }
    }
  };

  window.addEventListener('afterprint', cleanup);

  // 5. Acionar window.print com breve delay para repintura completa do DOM
  setTimeout(() => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.warn('Erro ao acionar window.print():', err);
    } finally {
      // Fallback de limpeza caso o navegador não emita o evento afterprint
      setTimeout(cleanup, 2500);
    }
  }, 100);
}
