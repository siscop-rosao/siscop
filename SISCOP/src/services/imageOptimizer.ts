/**
 * Utilitário de otimização e compressão de imagens no cliente
 * Reduz o tamanho de fotos, brasões e banners para que fiquem com excelente
 * nitidez visual e com peso reduzido (20KB - 80KB), garantindo gravação instantânea
 * no Cloud Firestore e sincronização perfeita entre diferentes computadores.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export function optimizeImageBase64(
  dataUrlOrFile: string | File,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const {
    maxWidth = 400,
    maxHeight = 500,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const processImageElement = (img: HTMLImageElement) => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
        return;
      }

      // Preenche fundo branco se for JPEG para evitar transparência preta
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const optimized = canvas.toDataURL(mimeType, quality);
        resolve(optimized);
      } catch (e) {
        console.warn('[imageOptimizer] Erro ao converter canvas:', e);
        resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
      }
    };

    if (dataUrlOrFile instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();
        img.onload = () => processImageElement(img);
        img.onerror = () => resolve(src);
        img.src = src;
      };
      reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem'));
      reader.readAsDataURL(dataUrlOrFile);
    } else if (typeof dataUrlOrFile === 'string') {
      if (!dataUrlOrFile.startsWith('data:image/')) {
        resolve(dataUrlOrFile);
        return;
      }
      const img = new Image();
      img.onload = () => processImageElement(img);
      img.onerror = () => resolve(dataUrlOrFile);
      img.src = dataUrlOrFile;
    } else {
      resolve('');
    }
  });
}
