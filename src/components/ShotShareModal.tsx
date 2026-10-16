import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ShotRecord } from '../types/espresso';
import { X, Share2, Download, Copy, Check, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';
import { THE_GOLDEN_ZONE } from '../lib/espressoMath';

interface ShotShareModalProps {
  isOpen: boolean;
  shot: ShotRecord | null;
  onClose: () => void;
}

export const ShotShareModal: React.FC<ShotShareModalProps> = ({ isOpen, shot, onClose }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const drawCard = useCallback(() => {
    if (!shot || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-res Instagram / mobile portrait ratio (1080 x 1350)
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // 1. Dark Espresso Warmth Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1E1510');
    bgGrad.addColorStop(0.5, '#261B14');
    bgGrad.addColorStop(1, '#18110D');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle outer border
    ctx.strokeStyle = '#3D2D22';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Inner subtle glow border
    ctx.strokeStyle = '#C26D52';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    // 2. Header: Logo & Branding
    ctx.fillStyle = '#C26D52';
    ctx.beginPath();
    ctx.arc(90, 95, 22, 0, Math.PI * 2);
    ctx.fill();

    // Coffee Bean curve inside logo
    ctx.strokeStyle = '#FAF7F2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(90, 95, 14, 0.4, 2.7);
    ctx.stroke();

    ctx.fillStyle = '#FAF7F2';
    ctx.font = 'bold 32px "Courier Prime", monospace';
    ctx.fillText('FLOWBEAN', 130, 95);

    ctx.fillStyle = '#C26D52';
    ctx.font = 'bold 16px "Courier Prime", monospace';
    ctx.fillText('ESPRESSO LAB TELEMETRY', 132, 118);

    // Date
    const shotDate = new Date(shot.timestamp);
    const dateStr = shotDate.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = shotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    ctx.textAlign = 'right';
    ctx.fillStyle = '#A39589';
    ctx.font = '20px "Courier Prime", monospace';
    ctx.fillText(`${dateStr} • ${timeStr}`, W - 60, 105);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = '#3D2D22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 150);
    ctx.lineTo(W - 60, 150);
    ctx.stroke();

    // 3. Hero Shot Info (Drink & Bean)
    // Drink badge
    ctx.fillStyle = '#C26D52';
    ctx.beginPath();
    ctx.roundRect(60, 180, 220, 38, 8);
    ctx.fill();
    ctx.fillStyle = '#FAF7F2';
    ctx.font = 'bold 18px "Courier Prime", monospace';
    ctx.fillText((shot.drinkName || 'Espresso').toUpperCase(), 76, 205);

    // Bean name
    ctx.fillStyle = '#FAF7F2';
    ctx.font = 'bold 44px sans-serif';
    const beanName = shot.coffeeName || 'House Blend Specialty';
    ctx.fillText(beanName.length > 28 ? beanName.slice(0, 26) + '...' : beanName, 60, 265);

    // Roast & Gear
    ctx.fillStyle = '#D4A373';
    ctx.font = '24px "Courier Prime", monospace';
    const gearText = `${shot.grinderName || 'Grinder'} @ ${shot.grindSetting || '–'}${shot.machineName ? ` • ${shot.machineName}` : ''}`;
    ctx.fillText(gearText, 60, 305);

    // 4. Primary KPI Metric Cards (Dose, Yield, Ratio, Time)
    const cardY = 340;
    const cardH = 130;
    const cardW = (W - 120 - 45) / 4;

    const kpis = [
      { label: 'DOSE', val: `${shot.doseGrams.toFixed(1)}g`, sub: 'in' },
      { label: 'YIELD', val: `${shot.actualYieldGrams.toFixed(1)}g`, sub: 'out' },
      { label: 'RATIO', val: `1:${(shot.doseGrams > 0 ? (shot.actualYieldGrams / shot.doseGrams).toFixed(1) : '2.0')}`, sub: 'ratio' },
      { label: 'TIME', val: `${shot.totalTimeSeconds.toFixed(1)}s`, sub: `${shot.preInfusionSeconds.toFixed(1)}s pre` },
    ];

    kpis.forEach((kpi, idx) => {
      const x = 60 + idx * (cardW + 15);
      // Card bg
      ctx.fillStyle = '#261C16';
      ctx.beginPath();
      ctx.roundRect(x, cardY, cardW, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = '#3D2D22';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#A39589';
      ctx.font = 'bold 16px "Courier Prime", monospace';
      ctx.fillText(kpi.label, x + 16, cardY + 32);

      // Value
      ctx.fillStyle = '#FAF7F2';
      ctx.font = 'bold 36px "Courier Prime", monospace';
      ctx.fillText(kpi.val, x + 16, cardY + 78);

      // Sub
      ctx.fillStyle = '#C26D52';
      ctx.font = '16px "Courier Prime", monospace';
      ctx.fillText(kpi.sub, x + 16, cardY + 110);
    });

    // 5. Extraction Flow Chart Canvas (Embedded)
    const chartX = 60;
    const chartY = 505;
    const chartW = W - 120;
    const chartH = 460;

    // Chart box background
    ctx.fillStyle = '#1A120D';
    ctx.beginPath();
    ctx.roundRect(chartX, chartY, chartW, chartH, 16);
    ctx.fill();
    ctx.strokeStyle = '#3D2D22';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chart Header inside box
    ctx.fillStyle = '#FAF7F2';
    ctx.font = 'bold 22px "Courier Prime", monospace';
    ctx.fillText('EXTRACTION DYNAMICS & FLOW RATE', chartX + 24, chartY + 40);

    const points = shot.dataPoints || [];
    if (points.length >= 2) {
      const pLeft = chartX + 70;
      const pRight = chartX + chartW - 70;
      const pTop = chartY + 65;
      const pBottom = chartY + chartH - 45;
      const pW = pRight - pLeft;
      const pH = pBottom - pTop;

      const maxT = Math.max(30, points[points.length - 1].timeSeconds);
      const maxW = Math.max(shot.targetYieldGrams * 1.15, 45);
      const maxF = 4.0;

      const mapX = (t: number) => pLeft + (t / maxT) * pW;
      const mapYWeight = (w: number) => pBottom - (w / maxW) * pH;
      const mapYFlow = (f: number) => pBottom - (Math.min(f, maxF) / maxF) * pH;

      // Golden Zone Band (1.2 to 1.8 g/s)
      const gzTop = mapYFlow(THE_GOLDEN_ZONE.MAX_FLOW_GPS);
      const gzBot = mapYFlow(THE_GOLDEN_ZONE.MIN_FLOW_GPS);
      ctx.fillStyle = 'rgba(212, 163, 115, 0.18)';
      ctx.fillRect(pLeft, gzTop, pW, gzBot - gzTop);

      ctx.strokeStyle = 'rgba(212, 163, 115, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(pLeft, gzTop);
      ctx.lineTo(pRight, gzTop);
      ctx.moveTo(pLeft, gzBot);
      ctx.lineTo(pRight, gzBot);
      ctx.stroke();
      ctx.setLineDash([]);

      // Golden zone badge
      ctx.fillStyle = 'rgba(255, 253, 249, 0.95)';
      ctx.beginPath();
      ctx.roundRect(pLeft + 12, gzTop + 4, 160, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#8A5A2B';
      ctx.font = 'bold 12px "Courier Prime", monospace';
      ctx.fillText('🎯 MÅL: 1.2–1.8 g/s', pLeft + 20, gzTop + 19);

      // Y-axis grid (Weight left)
      ctx.fillStyle = '#A39589';
      ctx.font = '14px "Courier Prime", monospace';
      [0, 15, 30, 45].filter(w => w <= maxW).forEach(w => {
        const y = mapYWeight(w);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pLeft, y);
        ctx.lineTo(pRight, y);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillText(`${w}g`, pLeft - 10, y + 5);
      });

      // Flow grid (Right)
      ctx.fillStyle = '#C26D52';
      [0, 1, 2, 3, 4].forEach(f => {
        const y = mapYFlow(f);
        ctx.textAlign = 'left';
        ctx.fillText(`${f} g/s`, pRight + 10, y + 5);
      });
      ctx.textAlign = 'left';

      // First drip line
      if (shot.preInfusionSeconds > 0 && shot.preInfusionSeconds < maxT) {
        const xPre = mapX(shot.preInfusionSeconds);
        ctx.strokeStyle = '#C26D52';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xPre, pTop);
        ctx.lineTo(xPre, pBottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#C26D52';
        ctx.font = 'bold 12px "Courier Prime", monospace';
        ctx.fillText(`First Drip (${shot.preInfusionSeconds.toFixed(1)}s)`, xPre + 6, pTop + 16);
      }

      // Draw Weight curve
      ctx.strokeStyle = '#FAF7F2';
      ctx.lineWidth = 4;
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = mapX(p.timeSeconds);
        const y = mapYWeight(p.weightGrams);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw Flow curve
      ctx.strokeStyle = '#C26D52';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = mapX(p.timeSeconds);
        const y = mapYFlow(p.flowRateGps);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Extraction Summary Metrics Bar
    const statsY = 995;
    ctx.fillStyle = '#261C16';
    ctx.beginPath();
    ctx.roundRect(60, statsY, W - 120, 80, 12);
    ctx.fill();
    ctx.strokeStyle = '#3D2D22';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FAF7F2';
    ctx.font = 'bold 20px "Courier Prime", monospace';
    const avgFlowText = `Gns. Flow: ${(shot.averageFlowGps || 0).toFixed(2)} g/s`;
    ctx.fillText(avgFlowText, 90, statsY + 46);

    ctx.fillStyle = '#D4A373';
    const profileText = `Profil: ${shot.flowProfile ? shot.flowProfile.toUpperCase() : 'STEADY'}`;
    ctx.fillText(profileText, 450, statsY + 46);

    ctx.fillStyle = '#72806B';
    const stabText = `Stabilitet: ${shot.flowStabilityPercent || 92}%`;
    ctx.fillText(stabText, 780, statsY + 46);

    // 7. Footer Viral Promotion Banner
    const footY = 1120;
    ctx.fillStyle = '#160E0A';
    ctx.beginPath();
    ctx.roundRect(60, footY, W - 120, 160, 16);
    ctx.fill();
    ctx.strokeStyle = '#C26D52';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FAF7F2';
    ctx.font = 'bold 26px "Courier Prime", monospace';
    ctx.fillText('☕ MÅLT MED FLOWBEAN', 95, footY + 55);

    ctx.fillStyle = '#A39589';
    ctx.font = '20px sans-serif';
    ctx.fillText('Real-Time Skala OCR & Matematisk Ekstraktionsdynamik for Baristaer', 95, footY + 92);

    ctx.fillStyle = '#C26D52';
    ctx.font = 'bold 22px "Courier Prime", monospace';
    ctx.fillText('👉 espressoflow.vercel.app', 95, footY + 130);

    // Generate data URL for preview
    const dataUrl = canvas.toDataURL('image/png');
    setCardImageUrl(dataUrl);
  }, [shot]);

  useEffect(() => {
    if (isOpen && shot) {
      // Delay slightly to ensure canvas ref is mounted
      const t = setTimeout(drawCard, 80);
      return () => clearTimeout(t);
    }
  }, [isOpen, shot, drawCard]);

  if (!isOpen || !shot) return null;

  const handleShare = async () => {
    if (!canvasRef.current) return;
    setIsSharing(true);

    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }

        const fileName = `flowbean-shot-${shot.drinkName ? shot.drinkName.toLowerCase().replace(/\s+/g, '-') : 'shot'}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        const shareData = {
          title: `Mit Espresso Shot: ${shot.drinkName || 'Espresso'}`,
          text: `☕ ${shot.coffeeName || 'Espresso'} • ${shot.doseGrams}g ➔ ${shot.actualYieldGrams.toFixed(1)}g i ${shot.totalTimeSeconds}s (Ratio 1:${(shot.actualYieldGrams / shot.doseGrams).toFixed(1)}). Målt med Flowbean!`,
          url: 'https://espressoflow.vercel.app',
          files: [file],
        };

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            // User cancelled or share failed
            console.debug('Share cancelled or unsupported:', err);
          }
        } else {
          // Fallback: download the file
          handleDownload();
        }
        setIsSharing(false);
      }, 'image/png');
    } catch {
      setIsSharing(false);
    }
  };

  const handleDownload = () => {
    if (!cardImageUrl) return;
    const a = document.createElement('a');
    a.href = cardImageUrl;
    a.download = `flowbean-shot-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyText = async () => {
    const text = `☕ ${shot.drinkName || 'Espresso'} — ${shot.coffeeName || 'Coffee Blend'}\n` +
      `📊 Dosis: ${shot.doseGrams}g ➔ Yield: ${shot.actualYieldGrams.toFixed(1)}g (Ratio 1:${(shot.actualYieldGrams / shot.doseGrams).toFixed(1)})\n` +
      `⏱ Tid: ${shot.totalTimeSeconds}s (Pre: ${shot.preInfusionSeconds}s, Flow: ${shot.flowTimeSeconds}s)\n` +
      `⚙️ Kværn: ${shot.grinderName} @ ${shot.grindSetting}\n` +
      `🌊 Gns. flow: ${shot.averageFlowGps} g/s\n\n` +
      `Analyseret med Flowbean: https://espressoflow.vercel.app`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-[#FFFDF9] border border-[#E8DFD5] shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8DFD5] flex items-center justify-between bg-[#FAF7F2] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C26D52]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2C2018]">
              {t('share.card_title') || 'Del Barista Shot Card'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A6E65] hover:bg-[#E8DFD5]/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center bg-[#FAF7F2]">
          {/* Hidden Canvas used for rendering */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Rendered Preview Card */}
          {cardImageUrl ? (
            <div className="w-full max-w-[340px] rounded-2xl overflow-hidden shadow-xl border-2 border-[#C26D52]/40 bg-[#1E1510] transition hover:scale-[1.01]">
              <img
                src={cardImageUrl}
                alt="Flowbean Barista Shot Card"
                className="w-full h-auto object-contain block"
              />
            </div>
          ) : (
            <div className="w-full h-80 flex items-center justify-center text-xs text-[#7A6E65]">
              Genererer shot-kort...
            </div>
          )}

          <p className="text-[11px] text-[#7A6E65] text-center mt-3 max-w-xs">
            Kortet indeholder din ekstraktionskurve, nøgletal og Flowbean-branding med link til appen.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E8DFD5] bg-[#FFFDF9] flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 py-3 px-4 rounded-xl bg-[#C26D52] hover:bg-[#A85840] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>{isSharing ? 'Åbner...' : (t('share.btn_share') || 'Del Shot Card')}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="py-3 px-3.5 rounded-xl border border-[#DECFC0] bg-white hover:bg-[#FAF7F2] text-[#2C2018] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
            title="Download PNG"
          >
            <Download className="w-4 h-4 text-[#7A6E65]" />
            <span className="hidden sm:inline">Hent</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="py-3 px-3.5 rounded-xl border border-[#DECFC0] bg-white hover:bg-[#FAF7F2] text-[#2C2018] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
            title="Kopiér opskrift og link"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-[#7A6E65]" />
            )}
            <span className="hidden sm:inline">{isCopied ? 'Kopieret' : 'Tekst'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
