import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT_DIR = r"C:\Dev\Stu_Diario_Oficial\public\assets\graphics"
os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------------------------------
# 1. GENERATE 22 VECTOR SVG ASSETS
# -------------------------------------------------------------------------

svgs = {
    "escudo-soberania-documental.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
  <defs>
    <linearGradient id="g-gold" x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#facc15"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <radialGradient id="g-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
  </defs>
  <circle cx="120" cy="120" r="112" fill="url(#g-bg)" stroke="url(#g-gold)" stroke-width="4"/>
  <circle cx="120" cy="120" r="98" stroke="#34d399" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="6 4"/>
  <path d="M120 34 L184 62 V118 C184 162 156 196 120 210 C84 196 56 162 56 118 V62 Z" fill="#0f172a" stroke="url(#g-gold)" stroke-width="3.5"/>
  <path d="M120 52 L168 73 V116 C168 150 147 177 120 189 C93 177 72 150 72 116 V73 Z" fill="#1e293b" fill-opacity="0.7" stroke="#38bdf8" stroke-width="1.2"/>
  <!-- Book & Scale inside shield -->
  <path d="M92 128 C92 122 106 120 120 125 C134 120 148 122 148 128 V158 C148 153 134 151 120 156 C106 151 92 153 92 158 Z" fill="#10b981" fill-opacity="0.25" stroke="#34d399" stroke-width="2.2"/>
  <line x1="120" y1="74" x2="120" y2="156" stroke="#facc15" stroke-width="2.5"/>
  <line x1="90" y1="92" x2="150" y2="92" stroke="#facc15" stroke-width="2.5"/>
  <polygon points="90,92 80,112 100,112" fill="#facc15" fill-opacity="0.6"/>
  <polygon points="150,92 140,112 160,112" fill="#facc15" fill-opacity="0.6"/>
  <circle cx="120" cy="72" r="5" fill="#facc15"/>
  <text x="120" y="228" text-anchor="middle" fill="#34d399" font-family="monospace" font-size="9" font-weight="bold" letter-spacing="2">SOBERANÍA DOCUMENTAL SV</text>
</svg>""",

    "sello-laip-dominio-publico.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" fill="none">
  <defs>
    <linearGradient id="laip-grad" x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>
  <circle cx="110" cy="110" r="100" fill="#020617" stroke="url(#laip-grad)" stroke-width="4"/>
  <circle cx="110" cy="110" r="86" stroke="#facc15" stroke-width="1.5" stroke-dasharray="4 4"/>
  <path d="M75 95 H145 V145 H75 Z" fill="#0f172a" stroke="#34d399" stroke-width="2.5" rx="6"/>
  <path d="M92 95 V78 C92 66 128 66 128 78 V86" stroke="#facc15" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="110" cy="116" r="6" fill="#facc15"/>
  <line x1="110" y1="122" x2="110" y2="134" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
  <text x="110" y="46" text-anchor="middle" fill="#facc15" font-family="monospace" font-weight="bold" font-size="11">LAIP ARTS. 10 Y 11</text>
  <text x="110" y="176" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-weight="bold" font-size="10">DOMINIO PÚBLICO</text>
</svg>""",

    "sello-certificacion-stu.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" fill="none">
  <circle cx="110" cy="110" r="98" fill="#090d16" stroke="#facc15" stroke-width="3.5"/>
  <circle cx="110" cy="110" r="84" stroke="#10b981" stroke-width="2"/>
  <polygon points="110,42 126,78 165,82 135,108 144,146 110,126 76,146 85,108 55,82 94,78" fill="#facc15" fill-opacity="0.18" stroke="#facc15" stroke-width="2"/>
  <path d="M92 110 L105 123 L132 94" stroke="#34d399" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="110" y="175" text-anchor="middle" fill="#ffffff" font-family="monospace" font-weight="bold" font-size="10">COPIA FIEL INDEXADA</text>
  <text x="110" y="190" text-anchor="middle" fill="#34d399" font-family="monospace" font-size="8">GRUPO STU · SHA256 VERIFIED</text>
</svg>""",

    "icono-aceptacion-herencia.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0f172a" stroke="#10b981" stroke-width="2.5"/>
  <path d="M36 30 H72 L86 44 V90 H36 Z" fill="#1e293b" stroke="#34d399" stroke-width="2.2"/>
  <path d="M72 30 V44 H86" stroke="#34d399" stroke-width="2.2"/>
  <circle cx="61" cy="56" r="9" stroke="#facc15" stroke-width="2.2" fill="#facc15" fill-opacity="0.2"/>
  <path d="M47 76 C47 68 75 68 75 76" stroke="#facc15" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="44" y1="84" x2="78" y2="84" stroke="#38bdf8" stroke-width="2"/>
</svg>""",

    "icono-edicto-judicial.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
  <path d="M42 74 L74 42" stroke="#facc15" stroke-width="4.5" stroke-linecap="round"/>
  <rect x="64" y="28" width="24" height="12" rx="3" transform="rotate(45 64 28)" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"/>
  <rect x="28" y="82" width="44" height="8" rx="3" fill="#10b981"/>
  <circle cx="82" cy="80" r="10" fill="#facc15" fill-opacity="0.2" stroke="#facc15" stroke-width="2"/>
</svg>""",

    "icono-declaratoria-rebeldia.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0f172a" stroke="#f43f5e" stroke-width="2.5"/>
  <polygon points="60,24 94,86 26,86" fill="#f43f5e" fill-opacity="0.18" stroke="#f43f5e" stroke-width="3" stroke-linejoin="round"/>
  <line x1="60" y1="46" x2="60" y2="66" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
  <circle cx="60" cy="76" r="3" fill="#facc15"/>
</svg>""",

    "icono-titulo-supletorio.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0f172a" stroke="#a855f7" stroke-width="2.5"/>
  <path d="M32 42 L52 34 L72 42 L90 34 V80 L72 88 L52 80 L32 88 Z" fill="#1e293b" stroke="#c084fc" stroke-width="2.2"/>
  <line x1="52" y1="34" x2="52" y2="80" stroke="#c084fc" stroke-width="1.8" stroke-dasharray="3 3"/>
  <line x1="72" y1="42" x2="72" y2="88" stroke="#c084fc" stroke-width="1.8" stroke-dasharray="3 3"/>
  <circle cx="62" cy="58" r="8" fill="#facc15" fill-opacity="0.3" stroke="#facc15" stroke-width="2"/>
</svg>""",

    "icono-subasta-publica.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0f172a" stroke="#f59e0b" stroke-width="2.5"/>
  <path d="M30 86 H90" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
  <rect x="38" y="52" width="44" height="34" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
  <polygon points="34,52 60,30 86,52" fill="#f59e0b" fill-opacity="0.25" stroke="#fbbf24" stroke-width="2.2"/>
  <text x="60" y="75" text-anchor="middle" fill="#34d399" font-family="monospace" font-weight="bold" font-size="16">$</text>
</svg>""",

    "icono-aviso-sociedad.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0f172a" stroke="#06b6d4" stroke-width="2.5"/>
  <rect x="32" y="32" width="32" height="58" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
  <rect x="64" y="48" width="26" height="42" fill="#0f172a" stroke="#10b981" stroke-width="2"/>
  <rect x="40" y="40" width="6" height="6" fill="#facc15"/>
  <rect x="50" y="40" width="6" height="6" fill="#facc15"/>
  <rect x="40" y="52" width="6" height="6" fill="#38bdf8"/>
  <rect x="50" y="52" width="6" height="6" fill="#38bdf8"/>
  <rect x="40" y="64" width="6" height="6" fill="#34d399"/>
  <rect x="50" y="64" width="6" height="6" fill="#34d399"/>
</svg>""",

    "icono-decreto-acuerdo.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0f172a" stroke="#818cf8" stroke-width="2.5"/>
  <polygon points="60,24 92,42 28,42" fill="#818cf8" fill-opacity="0.25" stroke="#818cf8" stroke-width="2.2"/>
  <line x1="38" y1="46" x2="38" y2="80" stroke="#c7d2fe" stroke-width="4" stroke-linecap="round"/>
  <line x1="53" y1="46" x2="53" y2="80" stroke="#c7d2fe" stroke-width="4" stroke-linecap="round"/>
  <line x1="67" y1="46" x2="67" y2="80" stroke="#c7d2fe" stroke-width="4" stroke-linecap="round"/>
  <line x1="82" y1="46" x2="82" y2="80" stroke="#c7d2fe" stroke-width="4" stroke-linecap="round"/>
  <rect x="26" y="82" width="68" height="8" rx="2" fill="#818cf8"/>
</svg>""",

    "icono-registro-marca.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0f172a" stroke="#22d3ee" stroke-width="2.5"/>
  <circle cx="60" cy="60" r="32" fill="#06b6d4" fill-opacity="0.15" stroke="#22d3ee" stroke-width="2.5"/>
  <text x="60" y="69" text-anchor="middle" fill="#facc15" font-family="sans-serif" font-weight="900" font-size="28">R</text>
</svg>""",

    "icono-detector-dui.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0f172a" stroke="#facc15" stroke-width="2.5"/>
  <rect x="22" y="34" width="76" height="52" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
  <circle cx="40" cy="55" r="8" fill="#facc15" fill-opacity="0.4" stroke="#facc15" stroke-width="2"/>
  <path d="M30 74 C30 67 50 67 50 74" stroke="#facc15" stroke-width="2"/>
  <line x1="58" y1="48" x2="88" y2="48" stroke="#34d399" stroke-width="3" stroke-linecap="round"/>
  <line x1="58" y1="58" x2="84" y2="58" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="58" y1="68" x2="88" y2="68" stroke="#facc15" stroke-width="2.5" stroke-linecap="round"/>
</svg>""",

    "icono-sincronizacion-pdf.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0f172a" stroke="#10b981" stroke-width="2.5"/>
  <rect x="20" y="28" width="34" height="64" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
  <rect x="66" y="28" width="34" height="64" rx="4" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
  <rect x="25" y="48" width="24" height="8" rx="2" fill="#facc15"/>
  <rect x="71" y="48" width="24" height="8" rx="2" fill="#facc15"/>
  <path d="M54 52 H66" stroke="#facc15" stroke-width="3" stroke-dasharray="2 2"/>
</svg>""",

    "diagrama-ocr-limpio.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 180" fill="none">
  <rect x="4" y="4" width="672" height="172" rx="20" fill="#090d16" stroke="#1e293b" stroke-width="2"/>
  <!-- Step 1 -->
  <rect x="24" y="34" width="136" height="112" rx="14" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
  <text x="92" y="65" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-weight="bold" font-size="11">1. GACETA PDF</text>
  <text x="92" y="88" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="10">164 Págs · Tomo 453</text>
  <text x="92" y="106" text-anchor="middle" fill="#facc15" font-family="monospace" font-size="9">PDF.js + Canvas HD</text>
  <!-- Arrow 1 -->
  <path d="M168 90 H196" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Step 2 -->
  <rect x="202" y="34" width="136" height="112" rx="14" fill="#0f172a" stroke="#10b981" stroke-width="2"/>
  <text x="270" y="65" text-anchor="middle" fill="#34d399" font-family="monospace" font-weight="bold" font-size="11">2. MOTOR OCR</text>
  <text x="270" y="88" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="10">De-hyphenation</text>
  <text x="270" y="106" text-anchor="middle" fill="#facc15" font-family="monospace" font-size="9">Letras ↔ Dígitos DUI</text>
  <!-- Arrow 2 -->
  <path d="M346 90 H374" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Step 3 -->
  <rect x="380" y="34" width="136" height="112" rx="14" fill="#0f172a" stroke="#facc15" stroke-width="2"/>
  <text x="448" y="65" text-anchor="middle" fill="#facc15" font-family="monospace" font-weight="bold" font-size="11">3. ÍNDICE O(1)</text>
  <text x="448" y="88" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="10">532+ Edictos Reales</text>
  <text x="448" y="106" text-anchor="middle" fill="#34d399" font-family="monospace" font-size="9">Respuesta &lt; 1ms</text>
  <!-- Arrow 3 -->
  <path d="M524 90 H548" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Step 4 -->
  <rect x="554" y="34" width="102" height="112" rx="14" fill="#0f172a" stroke="#c084fc" stroke-width="2"/>
  <text x="605" y="65" text-anchor="middle" fill="#c084fc" font-family="monospace" font-weight="bold" font-size="11">4. SYNC</text>
  <text x="605" y="88" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="10">Bidireccional</text>
  <text x="605" y="106" text-anchor="middle" fill="#facc15" font-family="monospace" font-size="9">Radar PDF</text>
</svg>""",

    "diagrama-arquitectura-o1.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 160" fill="none">
  <rect x="4" y="4" width="592" height="152" rx="18" fill="#020617" stroke="#1e293b" stroke-width="2"/>
  <circle cx="90" cy="80" r="45" fill="#0f172a" stroke="#10b981" stroke-width="2.5"/>
  <text x="90" y="76" text-anchor="middle" fill="#34d399" font-family="monospace" font-weight="bold" font-size="11">HASH MAP</text>
  <text x="90" y="92" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="10">O(1) DUI</text>
  <line x1="135" y1="80" x2="225" y2="80" stroke="#facc15" stroke-width="2.5" stroke-dasharray="4 4"/>
  <rect x="225" y="38" width="150" height="84" rx="14" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
  <text x="300" y="72" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-weight="bold" font-size="12">MOTOR BIPARTITO</text>
  <text x="300" y="94" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="10">Numérico + Textual</text>
  <line x1="375" y1="80" x2="465" y2="80" stroke="#34d399" stroke-width="2.5" stroke-dasharray="4 4"/>
  <circle cx="510" cy="80" r="45" fill="#0f172a" stroke="#facc15" stroke-width="2.5"/>
  <text x="510" y="76" text-anchor="middle" fill="#facc15" font-family="monospace" font-weight="bold" font-size="11">VISOR PDF</text>
  <text x="510" y="92" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="10">TEXT LAYER</text>
</svg>""",

    "diagrama-flujo-alertas.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 160" fill="none">
  <rect x="4" y="4" width="592" height="152" rx="18" fill="#020617" stroke="#1e293b" stroke-width="2"/>
  <rect x="30" y="42" width="140" height="76" rx="12" fill="#0f172a" stroke="#34d399" stroke-width="2"/>
  <text x="100" y="75" text-anchor="middle" fill="#34d399" font-family="monospace" font-weight="bold" font-size="11">INGESTA DIARIA</text>
  <text x="100" y="95" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="10">Imprenta Nacional</text>
  <path d="M170 80 H230" stroke="#38bdf8" stroke-width="2.5"/>
  <rect x="230" y="42" width="140" height="76" rx="12" fill="#0f172a" stroke="#facc15" stroke-width="2"/>
  <text x="300" y="75" text-anchor="middle" fill="#facc15" font-family="monospace" font-weight="bold" font-size="11">DETECCIÓN DUI</text>
  <text x="300" y="95" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="10">Match Instantáneo</text>
  <path d="M370 80 H430" stroke="#34d399" stroke-width="2.5"/>
  <rect x="430" y="42" width="140" height="76" rx="12" fill="#0f172a" stroke="#f43f5e" stroke-width="2"/>
  <text x="500" y="75" text-anchor="middle" fill="#fb7185" font-family="monospace" font-weight="bold" font-size="11">ALERTA CIUDADANA</text>
  <text x="500" y="95" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="10">Defensa a Tiempo</text>
</svg>""",

    "portada-tomo-453.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" fill="none">
  <rect x="12" y="10" width="176" height="260" rx="10" fill="#0f172a" stroke="#facc15" stroke-width="3"/>
  <rect x="22" y="10" width="12" height="260" fill="#facc15" fill-opacity="0.25"/>
  <rect x="46" y="34" width="124" height="64" rx="6" fill="#020617" stroke="#34d399" stroke-width="1.5"/>
  <text x="108" y="58" text-anchor="middle" fill="#facc15" font-family="monospace" font-weight="bold" font-size="13">DIARIO OFICIAL</text>
  <text x="108" y="76" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="11">TOMO N° 453</text>
  <text x="108" y="90" text-anchor="middle" fill="#34d399" font-family="monospace" font-size="9">EL SALVADOR · 2026</text>
  <circle cx="108" cy="156" r="32" fill="#1e293b" stroke="#facc15" stroke-width="2"/>
  <path d="M94 156 L104 166 L124 146" stroke="#34d399" stroke-width="4" stroke-linecap="round"/>
  <text x="108" y="226" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="10">EDICIÓN N° 198</text>
  <text x="108" y="244" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-weight="bold" font-size="10">164 PÁGINAS HD</text>
</svg>""",

    "portada-tomo-452.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" fill="none">
  <rect x="12" y="10" width="176" height="260" rx="10" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
  <rect x="22" y="10" width="12" height="260" fill="#38bdf8" fill-opacity="0.25"/>
  <rect x="46" y="34" width="124" height="64" rx="6" fill="#020617" stroke="#38bdf8" stroke-width="1.5"/>
  <text x="108" y="58" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-weight="bold" font-size="13">DIARIO OFICIAL</text>
  <text x="108" y="76" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="11">TOMO N° 452</text>
  <text x="108" y="90" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="9">ARCHIVO HISTÓRICO</text>
  <circle cx="108" cy="156" r="32" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
  <text x="108" y="162" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-weight="bold" font-size="16">452</text>
  <text x="108" y="236" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="10">COLECCIÓN SOBERANA</text>
</svg>""",

    "portada-tomo-451.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" fill="none">
  <rect x="12" y="10" width="176" height="260" rx="10" fill="#0f172a" stroke="#10b981" stroke-width="3"/>
  <rect x="22" y="10" width="12" height="260" fill="#10b981" fill-opacity="0.25"/>
  <rect x="46" y="34" width="124" height="64" rx="6" fill="#020617" stroke="#10b981" stroke-width="1.5"/>
  <text x="108" y="58" text-anchor="middle" fill="#34d399" font-family="monospace" font-weight="bold" font-size="13">DIARIO OFICIAL</text>
  <text x="108" y="76" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="11">TOMO N° 451</text>
  <text x="108" y="90" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="9">ARCHIVO HISTÓRICO</text>
  <circle cx="108" cy="156" r="32" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
  <text x="108" y="162" text-anchor="middle" fill="#34d399" font-family="monospace" font-weight="bold" font-size="16">451</text>
  <text x="108" y="236" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="10">COLECCIÓN SOBERANA</text>
</svg>""",

    "portada-tomo-450.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" fill="none">
  <rect x="12" y="10" width="176" height="260" rx="10" fill="#0f172a" stroke="#a855f7" stroke-width="3"/>
  <rect x="22" y="10" width="12" height="260" fill="#a855f7" fill-opacity="0.25"/>
  <rect x="46" y="34" width="124" height="64" rx="6" fill="#020617" stroke="#a855f7" stroke-width="1.5"/>
  <text x="108" y="58" text-anchor="middle" fill="#c084fc" font-family="monospace" font-weight="bold" font-size="13">DIARIO OFICIAL</text>
  <text x="108" y="76" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="11">TOMO N° 450</text>
  <text x="108" y="90" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="9">ARCHIVO HISTÓRICO</text>
  <circle cx="108" cy="156" r="32" fill="#1e293b" stroke="#a855f7" stroke-width="2"/>
  <text x="108" y="162" text-anchor="middle" fill="#c084fc" font-family="monospace" font-weight="bold" font-size="16">450</text>
  <text x="108" y="236" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="10">COLECCIÓN SOBERANA</text>
</svg>""",

    "badge-coincidencia-exacta.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" fill="none">
  <rect x="2" y="2" width="196" height="56" rx="28" fill="#022c22" stroke="#10b981" stroke-width="2.5"/>
  <circle cx="32" cy="30" r="14" fill="#10b981"/>
  <path d="M26 30 L30 34 L39 25" stroke="#020617" stroke-width="3" stroke-linecap="round"/>
  <text x="114" y="27" text-anchor="middle" fill="#34d399" font-family="monospace" font-weight="bold" font-size="11">MATCH EXACTO</text>
  <text x="114" y="42" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="9">VERIFICADO EN PDF</text>
</svg>""",

    "ilustracion-balanza-digital.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" fill="none">
  <rect x="4" y="4" width="312" height="192" rx="24" fill="#090d16" stroke="#1e293b" stroke-width="2"/>
  <circle cx="160" cy="100" r="70" stroke="#10b981" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="5 5"/>
  <line x1="160" y1="36" x2="160" y2="164" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
  <line x1="110" y1="164" x2="210" y2="164" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
  <line x1="88" y1="68" x2="232" y2="68" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
  <polygon points="88,68 68,112 108,112" fill="#34d399" fill-opacity="0.25" stroke="#34d399" stroke-width="2"/>
  <polygon points="232,68 212,112 252,112" fill="#38bdf8" fill-opacity="0.25" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="160" cy="36" r="7" fill="#facc15"/>
</svg>"""
}

for filename, content in svgs.items():
    with open(os.path.join(OUT_DIR, filename), "w", encoding="utf-8") as f:
        f.write(content.strip())

# -------------------------------------------------------------------------
# 2. GENERATE 22 HIGH-DEFINITION WEBP ASSETS USING PILLOW
# -------------------------------------------------------------------------

def create_gradient_card(width, height, c1, c2, accent, title, subtitle, badge_code):
    img = Image.new("RGBA", (width, height), (2, 6, 23, 255))
    draw = ImageDraw.Draw(img)

    # Smooth background gradient
    for y in range(height):
        ratio = y / float(height)
        r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
        g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
        b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    # Decorative grid lines
    for gx in range(0, width, 32):
        draw.line([(gx, 0), (gx, height)], fill=(255, 255, 255, 10), width=1)
    for gy in range(0, height, 32):
        draw.line([(0, gy), (width, gy)], fill=(255, 255, 255, 10), width=1)

    # Outer border
    draw.rounded_rectangle([6, 6, width - 7, height - 7], radius=24, outline=accent + (220,), width=3)
    draw.rounded_rectangle([16, 16, width - 17, height - 17], radius=18, outline=(255, 255, 255, 35), width=1)

    # Glowing emblem circle
    cx, cy = width // 2, int(height * 0.40)
    rad = min(width, height) // 5
    draw.ellipse([cx - rad - 12, cy - rad - 12, cx + rad + 12, cy + rad + 12], fill=accent + (35,), outline=accent + (120,), width=2)
    draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(15, 23, 42, 240), outline=accent + (255,), width=3)

    # Draw geometric legal emblem inside circle
    pts = []
    for i in range(6):
        ang = math.radians(i * 60 - 30)
        pts.append((cx + int((rad * 0.62) * math.cos(ang)), cy + int((rad * 0.62) * math.sin(ang))))
    draw.polygon(pts, outline=(250, 204, 21, 255), fill=accent + (60,))

    # Text / Labels
    draw.text((cx, cy - 6), badge_code, fill=(250, 204, 21, 255), anchor="mm")
    draw.text((cx, int(height * 0.73)), title, fill=(255, 255, 255, 255), anchor="mm")
    draw.text((cx, int(height * 0.85)), subtitle, fill=accent + (255,), anchor="mm")

    return img

webp_specs = [
    ("tomo-historico-453.webp", 360, 480, (15, 23, 42), (2, 6, 23), (250, 204, 21), "TOMO 453 · N° 198", "23 OCTUBRE 2026 · 164 PÁGS", "T-453"),
    ("tomo-historico-452.webp", 360, 480, (15, 23, 42), (4, 18, 38), (56, 189, 248), "TOMO 452 · ARCHIVO", "GACETA OFICIAL SV", "T-452"),
    ("tomo-historico-451.webp", 360, 480, (15, 23, 42), (4, 28, 24), (16, 185, 129), "TOMO 451 · ARCHIVO", "GACETA OFICIAL SV", "T-451"),
    ("tomo-historico-450.webp", 360, 480, (24, 15, 42), (2, 6, 23), (168, 85, 247), "TOMO 450 · ARCHIVO", "GACETA OFICIAL SV", "T-450"),
    ("tomo-historico-449.webp", 360, 480, (28, 20, 12), (2, 6, 23), (245, 158, 11), "TOMO 449 · ARCHIVO", "GACETA OFICIAL SV", "T-449"),
    ("tomo-historico-448.webp", 360, 480, (12, 26, 34), (2, 6, 23), (6, 182, 212), "TOMO 448 · ARCHIVO", "GACETA OFICIAL SV", "T-448"),
    ("banner-soberania-documental.webp", 640, 260, (6, 28, 36), (2, 6, 23), (16, 185, 129), "SOBERANÍA DOCUMENTAL STU", "REPLICA INMUTABLE · LAIP ARTS. 10 Y 11", "LAIP"),
    ("banner-visor-interactivo.webp", 640, 260, (15, 23, 42), (2, 6, 23), (250, 204, 21), "VISOR EBOOK HIPER-INTERACTIVO", "PDF.JS + TEXT LAYER + SINCRONIZACIÓN", "PDF.JS"),
    ("banner-motor-ocr-dui.webp", 640, 260, (12, 20, 44), (2, 6, 23), (56, 189, 248), "DETECTOR DUAL DE DUI", "NUMÉRICO 00356274-2 + LETRAS NOTARIALES", "DUI-SV"),
    ("banner-prevencion-rebeldia.webp", 640, 260, (36, 12, 24), (2, 6, 23), (244, 63, 94), "ALERTA TEMPRANA JUDICIAL", "PREVENCIÓN DE CONDENAS EN REBELDÍA", "ALERTA"),
    ("card-aceptacion-herencia.webp", 400, 240, (8, 32, 28), (2, 6, 23), (52, 211, 153), "ACEPTACIÓN DE HERENCIA", "SUCESIONES Y DERECHOS HEREDITARIOS", "ART.1163"),
    ("card-edicto-judicial.webp", 400, 240, (10, 26, 44), (2, 6, 23), (56, 189, 248), "EDICTO JUDICIAL", "EMPLAZAMIENTOS Y CITACIONES", "CPCM"),
    ("card-declaratoria-rebeldia.webp", 400, 240, (38, 12, 20), (2, 6, 23), (244, 63, 94), "DECLARATORIA DE REBELDÍA", "MONITOREO PENAL Y EJECUTIVO", "URGENTE"),
    ("card-titulo-supletorio.webp", 400, 240, (28, 14, 44), (2, 6, 23), (192, 132, 252), "TÍTULO SUPLETORIO", "INMUEBLES Y DERECHO REGISTRAL", "CNR-PROP"),
    ("card-subasta-publica.webp", 400, 240, (38, 26, 8), (2, 6, 23), (251, 191, 36), "SUBASTA PÚBLICA", "REMATES Y EJECUCIONES JUDICIALES", "REMATE"),
    ("card-aviso-sociedad.webp", 400, 240, (8, 30, 38), (2, 6, 23), (34, 211, 238), "AVISO DE SOCIEDAD", "BALANCES, FUSIONES Y DISOLUCIONES", "MERCANTIL"),
    ("card-decreto-acuerdo.webp", 400, 240, (18, 20, 46), (2, 6, 23), (129, 140, 248), "DECRETO / ACUERDO", "ASAMBLEA LEGISLATIVA Y EJECUTIVO", "OFICIAL"),
    ("card-propiedad-intelectual.webp", 400, 240, (8, 34, 34), (2, 6, 23), (20, 184, 166), "REGISTRO DE MARCAS", "OPOSICIÓN DE TERCEROS (30 DÍAS)", "NIZA-CNR"),
    ("sello-autenticidad-digital.webp", 300, 300, (14, 28, 24), (2, 6, 23), (250, 204, 21), "AUTENTICIDAD VERIFICADA", "CUSTODIA DIGITAL GRUPO STU", "SHA-256"),
    ("sello-velocidad-o1.webp", 300, 300, (12, 22, 38), (2, 6, 23), (56, 189, 248), "LATENCIA SUB-MILISEGUNDO", "ÍNDICE EN MEMORIA O(1)", "O(1)"),
    ("sello-zero-logs-privacidad.webp", 300, 300, (10, 30, 24), (2, 6, 23), (16, 185, 129), "PRIVACIDAD CIUDADANA", "CONSULTA ANÓNIMA ZERO-LOGS", "0-LOGS"),
    ("ilustracion-archivo-nacional.webp", 640, 260, (18, 24, 38), (2, 6, 23), (52, 211, 153), "HEMEROTECA DIGITAL DE EL SALVADOR", "INDEXACIÓN COMPLETA TOMO 453 · 164 PÁGINAS", "ARCHIVO")
]

for filename, w, h, c1, c2, acc, title, sub, code in webp_specs:
    im = create_gradient_card(w, h, c1, c2, acc, title, sub, code)
    im.save(os.path.join(OUT_DIR, filename), "WEBP", quality=90)

all_files = sorted(os.listdir(OUT_DIR))
print(f"Generated {len(all_files)} graphic assets in {OUT_DIR}:")
print(f" - SVGs: {len([f for f in all_files if f.endswith('.svg')])}")
print(f" - WEBPs: {len([f for f in all_files if f.endswith('.webp')])}")
