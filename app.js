/* ════════════════════════════════════════════════════════════════════════
   AMILMA SPEED TEST — SOC EDITION  |  app.js
   ────────────────────────────────────────────────────────────────────────
   Section 1  ▸  LENIS smooth scroll
   Section 2  ▸  CYBER CANVAS BACKGROUND (perspective grid, particles, scan)
   Section 3  ▸  GSAP intro timeline + hover effects
   Section 4  ▸  GSAP gauge + number animation helpers
   Section 5  ▸  SVG gauge geometry (buildTicks, arcPath, setGaugeRaw…)
   Section 6  ▸  IP info fetch
   Section 7  ▸  Speed-test helpers (sleep, setNum, setPhase, etc.)
   Section 8  ▸  Ping measurement
   Section 9  ▸  Download measurement
   Section 10 ▸  Upload measurement (XHR sliding-window + abort)
   Section 11 ▸  Grade function
   Section 12 ▸  Main test flow  (startTest)
   Section 13 ▸  History (localStorage)
   Section 14 ▸  Copy result
   Section 15 ▸  Init / boot
════════════════════════════════════════════════════════════════════════ */

'use strict';

const HAS_GSAP = typeof window !== 'undefined' && typeof window.gsap !== 'undefined';

/* ══════════════════════════════════════════════════════════════════════
   SECTION 0 ▸ INTERNATIONALISATION (i18n)
   Supported languages: en · bs · hr · sr (Cyrillic)
   Language persisted in localStorage('amilma_lang').
   Call setLang('bs') to switch. Call translate() to re-apply.
══════════════════════════════════════════════════════════════════════ */
let currentLang = localStorage.getItem('amilma_lang') || 'en';

const TRANSLATIONS = {
  en: {
    langCode:'en',
    panelCaption:'Speed Test Module', phaseStandby:'Standby',
    phaseClickStart:'Click Start to run network diagnostics',
    btnStart:'Start test', btnTesting:'Testing\u2026', btnRerun:'Run again',
    psDone:'Done',
    gradeLabel:'Grade', btnCopyResult:'Copy result', btnCopied:'Copied',
    infoIp:'IP Address', infoIsp:'ISP\u00a0/\u00a0Provider', infoLoc:'Location', infoServer:'Test Server',
    statusOnline:'Online', statusActive:'Active',
    toolkitHeading:'IP\u00a0\u0026\u00a0Network Toolkit',
    sysKicker:'System', sysTitle:'Quick Device Profile',
    kvPlatform:'Platform', kvBrowser:'Browser', kvLang:'Language', kvTz:'Timezone',
    kvConn:'Connection', kvRtt:'RTT\u00a0/\u00a0DL', kvHw:'CPU\u00a0/\u00a0RAM',
    cmdKicker:'Commands', cmdTitle:'Copy/paste for diagnostics',
    btnCopyJson:'Copy JSON', btnJsonCopied:'JSON copied', btnCopyIp:'Copy IP',
    cmdHint:'Commands adapted for your OS (Windows/Linux/macOS).',
    gamingKicker:'Gaming readiness', gamingTitle:'Gameplay assessment',
    profileFps:'Competitive FPS',    profileFpsNote:'Run test to assess.',
    profileVoice:'Voice chat',       profileVoiceNote:'Jitter and upload will be checked.',
    profileStream:'Stream upload',   profileStreamNote:'Upload stability check.',
    badgeWaiting:'Waiting', badgeOk:'Excellent', badgeWarn:'Stable', badgeBad:'Poor',
    seoHeading:'About the Tool \u2014 How It Works',
    seoCard1Title:'Internet speed test',
    seoCard1Html:'Amilma Network measures the real speed of your internet connection using Cloudflare CDN infrastructure deployed across more than 300 locations worldwide. You get precise <strong>download</strong> and <strong>upload</strong> speed values in Mbps, as well as <strong>ping</strong> latency and <strong>jitter</strong> stability \u2014 all in one test that takes less than 30 seconds.',
    seoCard2Title:'IP address &amp; ISP check',
    seoCard2Html:'We automatically detect your <strong>public IP address</strong>, internet service provider (<strong>ISP</strong>) and geographic location as soon as the page loads. No registration, no tracking cookies. Ideal for verifying your VPN connection, diagnosing network problems, or simply finding out who provides your internet service.',
    seoCard3Title:'Gaming &amp; streaming assessment',
    seoCard3Html:'Based on the measured values, the tool automatically assesses your connection\u2019s suitability for <strong>competitive FPS gaming</strong> (ping &lt;35\u202fms, jitter &lt;10\u202fms), <strong>voice chat</strong> apps like Discord and Teams, and <strong>livestreaming</strong> on platforms like Twitch and YouTube. You get a clear rating: Excellent, Stable, or Poor.',
    historyHeading:'Measurement History', btnClear:'Clear',
    hColTime:'Time', hColDl:'Download', hColUl:'Upload', hColPing:'Ping', hColJitter:'Jitter', hColGrade:'Grade',
    footerTagline:'Professional Network Intelligence',
    footerPrivacy:'Privacy', footerContact:'Contact', footerApi:'API',
    footerNote:'No tracking cookies. Measurement history and local toolkit data remain on your device in browser storage and are never sent to our servers.',
    footerCredit:'Amilma \u00a9 2026. Created with \u2665 in Bosnia and Herzegovina.',
    phasePing:'Ping / Latency', phaseDl:'Download throughput', phaseUl:'Upload throughput', phaseDone:'Test complete',
    gradeAplus:'Exceptional connection \u2014 4K streaming, gaming and video calls work flawlessly.',
    gradeA:    'Excellent connection \u2014 everything runs smoothly with no noticeable lag.',
    gradeBplus:'Very good connection \u2014 HD/4K and work from home without issues.',
    gradeB:    'Good connection \u2014 everyday use without major problems.',
    gradeC:    'Average connection \u2014 occasional quality drops are possible.',
    gradeD:    'Weak connection \u2014 consider a better plan or check your equipment.',
    copyHeader:'Amilma IP & Network Toolkit result:', copyGrade:'Grade:',
  },
  bs: {
    langCode:'bs',
    panelCaption:'Modul za test brzine', phaseStandby:'Standby',
    phaseClickStart:'Kliknite Start za mre\u017enu dijagnostiku',
    btnStart:'Pokreni test', btnTesting:'Mjerim\u2026', btnRerun:'Ponovi test',
    psDone:'Gotovo',
    gradeLabel:'Ocjena', btnCopyResult:'Kopiraj rezultat', btnCopied:'Kopirano',
    infoIp:'IP adresa', infoIsp:'ISP\u00a0/\u00a0Provajder', infoLoc:'Lokacija', infoServer:'Test server',
    statusOnline:'Online', statusActive:'Aktivan',
    toolkitHeading:'IP i mre\u017eni alati',
    sysKicker:'Sistem', sysTitle:'Brzi profil ure\u0111aja',
    kvPlatform:'Platforma', kvBrowser:'Preglednik', kvLang:'Jezik', kvTz:'Vrem.\u00a0zona',
    kvConn:'Veza', kvRtt:'RTT\u00a0/\u00a0DL', kvHw:'CPU\u00a0/\u00a0RAM',
    cmdKicker:'Komande', cmdTitle:'Kopiraj za dijagnostiku',
    btnCopyJson:'Kopiraj JSON', btnJsonCopied:'JSON kopiran', btnCopyIp:'Kopiraj IP',
    cmdHint:'Prila\u0111ene komande za va\u0161 OS (Windows/Linux/macOS).',
    gamingKicker:'Gaming procjena', gamingTitle:'Procjena za igranje',
    profileFps:'Kompetitivni FPS',   profileFpsNote:'Pokreni test za procjenu.',
    profileVoice:'Glasovni chat',    profileVoiceNote:'Provjera jittera i uploada.',
    profileStream:'Stream upload',   profileStreamNote:'Provjera stabilnosti uploada.',
    badgeWaiting:'\u010ceka', badgeOk:'Odli\u010dno', badgeWarn:'Solidno', badgeBad:'Rizi\u010dno',
    seoHeading:'O alatu \u2014 Kako funkcioni\u0161e',
    seoCard1Title:'Test brzine interneta',
    seoCard1Html:'Amilma Network mjeri stvarnu brzinu va\u0161e internet veze koriste\u0107i Cloudflare CDN infrastrukturu raspore\u0111enu u vi\u0161e od 300 lokacija \u0161irom svijeta. Dobijate precizne vrijednosti <strong>download</strong> i <strong>upload</strong> brzine u Mbps, kao i <strong>ping</strong> latenciju i <strong>jitter</strong> stabilnost \u2014 sve u jednom testu koji traje manje od 30 sekundi.',
    seoCard2Title:'Provjera IP adrese i ISP-a',
    seoCard2Html:'Automatski detektujemo va\u0161u <strong>javnu IP adresu</strong>, internet provajdera (<strong>ISP</strong>) i geografsku lokaciju odmah pri u\u010ditavanju stranice. Bez registracije, bez kola\u010di\u0107a za pra\u0107enje. Idealno za provjeru VPN veze, dijagnostiku mre\u017enih problema ili saznavanje ko vam pru\u017ea internet uslugu.',
    seoCard3Title:'Gaming &amp; streaming procjena',
    seoCard3Html:'Na osnovu izmjerenih vrijednosti alat automatski procjenjuje podobnost va\u0161e veze za <strong>competitive FPS gaming</strong> (ping &lt;35\u202fms, jitter &lt;10\u202fms), <strong>voice chat</strong> aplikacije poput Discorda i Teamsa, te <strong>livestreaming</strong> na platformama poput Twitcha i YouTubea. Dobijate jasnu ocjenu: Odli\u010dno, Solidno ili Rizi\u010dno.',
    historyHeading:'Historija mjerenja', btnClear:'Obri\u0161i',
    hColTime:'Vrijeme', hColDl:'Download', hColUl:'Upload', hColPing:'Ping', hColJitter:'Jitter', hColGrade:'Ocjena',
    footerTagline:'Profesionalna mre\u017ena inteligencija',
    footerPrivacy:'Privatnost', footerContact:'Kontakt', footerApi:'API',
    footerNote:'Bez kola\u010di\u0107a za pra\u0107enje. Historija mjerenja i lokalni toolkit podaci ostaju na va\u0161em ure\u0111aju u browser storageu i nikada se ne \u0161alju na na\u0161e servere.',
    footerCredit:'Amilma \u00a9 2026. Napravljeno s \u2665 u Bosni i Hercegovini.',
    phasePing:'Ping / Latencija', phaseDl:'Download propusnost', phaseUl:'Upload propusnost', phaseDone:'Mjerenje zavr\u0161eno',
    gradeAplus:'Iznimna veza \u2014 4K streaming, gaming i video pozivi rade vrhunski.',
    gradeA:    'Odli\u010dna veza \u2014 sve radi glatko bez primjetnih zastoja.',
    gradeBplus:'Vrlo dobra veza \u2014 HD/4K i rad od ku\u0107e bez problema.',
    gradeB:    'Dobra veza \u2014 svakodnevna upotreba bez ve\u0107ih pote\u0161ko\u0107a.',
    gradeC:    'Prosje\u010dna veza \u2014 povremeni padovi kvaliteta su mogu\u0107i.',
    gradeD:    'Slabija veza \u2014 razmotrite ja\u010di paket ili provjeru opreme.',
    copyHeader:'Amilma IP & Network Toolkit rezultat:', copyGrade:'Ocjena:',
  },
  hr: {
    langCode:'hr',
    panelCaption:'Modul za test brzine', phaseStandby:'Standby',
    phaseClickStart:'Kliknite Start za mre\u017enu dijagnostiku',
    btnStart:'Pokreni test', btnTesting:'Mjerim\u2026', btnRerun:'Ponovi test',
    psDone:'Gotovo',
    gradeLabel:'Ocjena', btnCopyResult:'Kopiraj rezultat', btnCopied:'Kopirano',
    infoIp:'IP adresa', infoIsp:'ISP\u00a0/\u00a0Davatelj', infoLoc:'Lokacija', infoServer:'Test server',
    statusOnline:'Online', statusActive:'Aktivan',
    toolkitHeading:'IP i mre\u017eni alati',
    sysKicker:'Sustav', sysTitle:'Brzi profil ure\u0111aja',
    kvPlatform:'Platforma', kvBrowser:'Preglednik', kvLang:'Jezik', kvTz:'Vremensko\u00a0podr.',
    kvConn:'Veza', kvRtt:'RTT\u00a0/\u00a0DL', kvHw:'CPU\u00a0/\u00a0RAM',
    cmdKicker:'Naredbe', cmdTitle:'Kopiraj za dijagnostiku',
    btnCopyJson:'Kopiraj JSON', btnJsonCopied:'JSON kopiran', btnCopyIp:'Kopiraj IP',
    cmdHint:'Prila\u0111ene naredbe za va\u0161 OS (Windows/Linux/macOS).',
    gamingKicker:'Gaming procjena', gamingTitle:'Procjena za igranje',
    profileFps:'Kompetitivni FPS',   profileFpsNote:'Pokreni test za procjenu.',
    profileVoice:'Glasovni chat',    profileVoiceNote:'Provjera jittera i uploada.',
    profileStream:'Stream upload',   profileStreamNote:'Provjera stabilnosti uploada.',
    badgeWaiting:'\u010ceka', badgeOk:'Odli\u010dno', badgeWarn:'Solidno', badgeBad:'Rizi\u010dno',
    seoHeading:'O alatu \u2014 Kako funkcionira',
    seoCard1Title:'Test brzine interneta',
    seoCard1Html:'Amilma Network mjeri stvarnu brzinu va\u0161e internetske veze koriste\u0107i Cloudflare CDN infrastrukturu raspodijeljenu na vi\u0161e od 300 lokacija diljem svijeta. Dobivate precizne vrijednosti <strong>download</strong> i <strong>upload</strong> brzine u Mbps, kao i <strong>ping</strong> latenciju i <strong>jitter</strong> stabilnost \u2014 sve u jednom testu koji traje manje od 30 sekundi.',
    seoCard2Title:'Provjera IP adrese i ISP-a',
    seoCard2Html:'Automatski otkrivamo va\u0161u <strong>javnu IP adresu</strong>, davatelja internetskih usluga (<strong>ISP</strong>) i geografsku lokaciju \u010dim se stranica u\u010dita. Bez registracije, bez kola\u010di\u0107a za pra\u0107enje. Idealno za provjeru VPN veze, dijagnostiku mre\u017enih problema ili saznavanje tko vam pru\u017ea internetsku uslugu.',
    seoCard3Title:'Gaming &amp; streaming procjena',
    seoCard3Html:'Na temelju izmjerenih vrijednosti alat automatski procjenjuje prikladnost va\u0161e veze za <strong>competitive FPS gaming</strong> (ping &lt;35\u202fms, jitter &lt;10\u202fms), <strong>voice chat</strong> aplikacije poput Discorda i Teamsa, te <strong>livestreaming</strong> na platformama poput Twitcha i YouTubea. Dobivate jasnu ocjenu: Odli\u010dno, Solidno ili Rizi\u010dno.',
    historyHeading:'Povijest mjerenja', btnClear:'Obri\u0161i',
    hColTime:'Vrijeme', hColDl:'Download', hColUl:'Upload', hColPing:'Ping', hColJitter:'Jitter', hColGrade:'Ocjena',
    footerTagline:'Profesionalna mre\u017ena inteligencija',
    footerPrivacy:'Privatnost', footerContact:'Kontakt', footerApi:'API',
    footerNote:'Bez kola\u010di\u0107a za pra\u0107enje. Povijest mjerenja i lokalni toolkit podaci ostaju na va\u0161em ure\u0111aju u browser storageu i nikada se ne \u0161alju na na\u0161e poslu\u017eitelje.',
    footerCredit:'Amilma \u00a9 2026. Napravljeno s \u2665 u Bosni i Hercegovini.',
    phasePing:'Ping / Latencija', phaseDl:'Download propusnost', phaseUl:'Upload propusnost', phaseDone:'Mjerenje zavr\u0161eno',
    gradeAplus:'Iznimna veza \u2014 4K streaming, gaming i videopozivi rade vrhunski.',
    gradeA:    'Odli\u010dna veza \u2014 sve radi glatko bez primjetnih zastoja.',
    gradeBplus:'Vrlo dobra veza \u2014 HD/4K i rad od ku\u0107e bez problema.',
    gradeB:    'Dobra veza \u2014 svakodnevna upotreba bez ve\u0107ih pote\u0161ko\u0107a.',
    gradeC:    'Prosje\u010dna veza \u2014 povremeni padovi kvalitete su mogu\u0107i.',
    gradeD:    'Slabija veza \u2014 razmotrite ja\u010di paket ili provjeru opreme.',
    copyHeader:'Amilma IP & Network Toolkit rezultat:', copyGrade:'Ocjena:',
  },
  sr: {
    langCode:'sr',
    panelCaption:'\u041c\u043e\u0434\u0443\u043b \u0437\u0430 \u0442\u0435\u0441\u0442 \u0431\u0440\u0437\u0438\u043d\u0435', phaseStandby:'Standby',
    phaseClickStart:'\u041a\u043b\u0438\u043a\u043d\u0438\u0442\u0435 Start \u0437\u0430 \u043c\u0440\u0435\u0436\u043d\u0443 \u0434\u0438\u0458\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0443',
    btnStart:'\u041f\u043e\u043a\u0440\u0435\u043d\u0438 \u0442\u0435\u0441\u0442', btnTesting:'\u041c\u0458\u0435\u0440\u0438\u043c\u2026', btnRerun:'\u041f\u043e\u043d\u043e\u0432\u0438 \u0442\u0435\u0441\u0442',
    psDone:'\u0413\u043e\u0442\u043e\u0432\u043e',
    gradeLabel:'\u041e\u0446\u0435\u043d\u0430', btnCopyResult:'\u041a\u043e\u043f\u0438\u0440\u0430\u0458 \u0440\u0435\u0437\u0443\u043b\u0442\u0430\u0442', btnCopied:'\u041a\u043e\u043f\u0438\u0440\u0430\u043d\u043e',
    infoIp:'\u0418\u041f \u0430\u0434\u0440\u0435\u0441\u0430', infoIsp:'ISP\u00a0/\u00a0\u041f\u0440\u043e\u0432\u0430\u0458\u0434\u0435\u0440', infoLoc:'\u041b\u043e\u043a\u0430\u0446\u0438\u0458\u0430', infoServer:'\u0422\u0435\u0441\u0442 \u0441\u0435\u0440\u0432\u0435\u0440',
    statusOnline:'Online', statusActive:'\u0410\u043a\u0442\u0438\u0432\u0430\u043d',
    toolkitHeading:'\u0418\u041f \u0438 \u043c\u0440\u0435\u0436\u043d\u0438 \u0430\u043b\u0430\u0442\u0438',
    sysKicker:'\u0421\u0438\u0441\u0442\u0435\u043c', sysTitle:'\u0411\u0440\u0437\u0438 \u043f\u0440\u043e\u0444\u0438\u043b \u0443\u0440\u0435\u0452\u0430\u0458\u0430',
    kvPlatform:'\u041f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430', kvBrowser:'\u041f\u0440\u0435\u0433\u043b\u0435\u0434\u0430\u0447', kvLang:'\u0408\u0435\u0437\u0438\u043a', kvTz:'\u0412\u0440\u0435\u043c.\u00a0\u0437\u043e\u043d\u0430',
    kvConn:'\u0412\u0435\u0437\u0430', kvRtt:'RTT\u00a0/\u00a0DL', kvHw:'CPU\u00a0/\u00a0RAM',
    cmdKicker:'\u041a\u043e\u043c\u0430\u043d\u0434\u0435', cmdTitle:'\u041a\u043e\u043f\u0438\u0440\u0430\u0458 \u0437\u0430 \u0434\u0438\u0458\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0443',
    btnCopyJson:'\u041a\u043e\u043f\u0438\u0440\u0430\u0458 JSON', btnJsonCopied:'JSON \u043a\u043e\u043f\u0438\u0440\u0430\u043d', btnCopyIp:'\u041a\u043e\u043f\u0438\u0440\u0430\u0458 \u0418\u041f',
    cmdHint:'\u041f\u0440\u0438\u043b\u0430\u0433\u043e\u0452\u0435\u043d\u0435 \u043a\u043e\u043c\u0430\u043d\u0434\u0435 \u0437\u0430 \u0432\u0430\u0448 \u041e\u0421 (Windows/Linux/macOS).',
    gamingKicker:'Gaming \u043f\u0440\u043e\u0446\u0435\u043d\u0430', gamingTitle:'\u041f\u0440\u043e\u0446\u0435\u043d\u0430 \u0437\u0430 \u0438\u0433\u0440\u0430\u045a\u0435',
    profileFps:'\u041a\u043e\u043c\u043f\u0435\u0442\u0438\u0442\u0438\u0432\u043d\u0438 FPS',    profileFpsNote:'\u041f\u043e\u043a\u0440\u0435\u043d\u0438 \u0442\u0435\u0441\u0442 \u0437\u0430 \u043f\u0440\u043e\u0446\u0435\u043d\u0443.',
    profileVoice:'\u0413\u043b\u0430\u0441\u043e\u0432\u043d\u0438 \u0447\u0435\u0442',         profileVoiceNote:'\u041f\u0440\u043e\u0432\u0435\u0440\u0430 \u045f\u0438\u0442\u0435\u0440\u0430 \u0438 \u043e\u0442\u043f\u0440\u0435\u043c\u0430\u045a\u0430.',
    profileStream:'Stream \u043e\u0442\u043f\u0440\u0435\u043c\u0430\u045a\u0435',             profileStreamNote:'\u041f\u0440\u043e\u0432\u0435\u0440\u0430 \u0441\u0442\u0430\u0431\u0438\u043b\u043d\u043e\u0441\u0442\u0438 \u043e\u0442\u043f\u0440\u0435\u043c\u0430\u045a\u0430.',
    badgeWaiting:'\u0427\u0435\u043a\u0430', badgeOk:'\u041e\u0434\u043b\u0438\u0447\u043d\u043e', badgeWarn:'\u0421\u043e\u043b\u0438\u0434\u043d\u043e', badgeBad:'\u0420\u0438\u0437\u0438\u0447\u043d\u043e',
    seoHeading:'\u041e \u0430\u043b\u0430\u0442\u0443 \u2014 \u041a\u0430\u043a\u043e \u0444\u0443\u043d\u043a\u0446\u0438\u043e\u043d\u0438\u0448\u0435',
    seoCard1Title:'\u0422\u0435\u0441\u0442 \u0431\u0440\u0437\u0438\u043d\u0435 \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442\u0430',
    seoCard1Html:'Amilma Network \u043c\u0435\u0440\u0438 \u0441\u0442\u0432\u0430\u0440\u043d\u0443 \u0431\u0440\u0437\u0438\u043d\u0443 \u0432\u0430\u0448\u0435 \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442 \u0432\u0435\u0437\u0435 \u043a\u043e\u0440\u0438\u0441\u0442\u0435\u045b\u0438 Cloudflare CDN \u0438\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0443 \u0440\u0430\u0441\u043f\u043e\u0440\u0435\u0452\u0435\u043d\u0443 \u043d\u0430 \u043f\u0440\u0435\u043a\u043e 300 \u043b\u043e\u043a\u0430\u0446\u0438\u0458\u0430 \u0448\u0438\u0440\u043e\u043c \u0441\u0432\u0435\u0442\u0430. \u0414\u043e\u0431\u0438\u0458\u0430\u0442\u0435 \u043f\u0440\u0435\u0446\u0438\u0437\u043d\u0435 \u0432\u0440\u0435\u0434\u043d\u043e\u0441\u0442\u0438 <strong>download</strong> \u0438 <strong>upload</strong> \u0431\u0440\u0437\u0438\u043d\u0435 \u0443 Mbps, \u043a\u0430\u043e \u0438 <strong>ping</strong> \u043b\u0430\u0442\u0435\u043d\u0446\u0438\u0458\u0443 \u0438 <strong>jitter</strong> \u0441\u0442\u0430\u0431\u0438\u043b\u043d\u043e\u0441\u0442 \u2014 \u0441\u0432\u0435 \u0443 \u0458\u0435\u0434\u043d\u043e\u043c \u0442\u0435\u0441\u0442\u0443 \u043a\u043e\u0458\u0438 \u0442\u0440\u0430\u0458\u0435 \u043c\u0430\u045a\u0435 \u043e\u0434 30 \u0441\u0435\u043a\u0443\u043d\u0434\u0438.',
    seoCard2Title:'\u041f\u0440\u043e\u0432\u0435\u0440\u0430 \u0418\u041f \u0430\u0434\u0440\u0435\u0441\u0435 \u0438 ISP-\u0430',
    seoCard2Html:'\u0410\u0443\u0442\u043e\u043c\u0430\u0442\u0441\u043a\u0438 \u0434\u0435\u0442\u0435\u043a\u0442\u0443\u0458\u0435\u043c\u043e \u0432\u0430\u0448\u0443 <strong>\u0458\u0430\u0432\u043d\u0443 \u0418\u041f \u0430\u0434\u0440\u0435\u0441\u0443</strong>, \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442 \u043f\u0440\u043e\u0432\u0430\u0458\u0434\u0435\u0440\u0430 (<strong>ISP</strong>) \u0438 \u0433\u0435\u043e\u0433\u0440\u0430\u0444\u0441\u043a\u0443 \u043b\u043e\u043a\u0430\u0446\u0438\u0458\u0443 \u0447\u0438\u043c \u0441\u0435 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430 \u0443\u0447\u0438\u0442\u0430. \u0411\u0435\u0437 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0458\u0435, \u0431\u0435\u0437 \u043a\u043e\u043b\u0430\u0447\u0438\u045b\u0430 \u0437\u0430 \u043f\u0440\u0430\u045b\u0435\u045a\u0435. \u0418\u0434\u0435\u0430\u043b\u043d\u043e \u0437\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u0443 VPN \u0432\u0435\u0437\u0435, \u0434\u0438\u0458\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0443 \u043c\u0440\u0435\u0436\u043d\u0438\u0445 \u043f\u0440\u043e\u0431\u043b\u0435\u043c\u0430 \u0438\u043b\u0438 \u0441\u0430\u0437\u043d\u0430\u0432\u0430\u045a\u0435 \u043a\u043e \u0432\u0430\u043c \u043f\u0440\u0443\u0436\u0430 \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442 \u0443\u0441\u043b\u0443\u0433\u0443.',
    seoCard3Title:'Gaming &amp; streaming \u043f\u0440\u043e\u0446\u0435\u043d\u0430',
    seoCard3Html:'\u041d\u0430 \u043e\u0441\u043d\u043e\u0432\u0443 \u0438\u0437\u043c\u0435\u0440\u0435\u043d\u0438\u0445 \u0432\u0440\u0435\u0434\u043d\u043e\u0441\u0442\u0438 \u0430\u043b\u0430\u0442 \u0430\u0443\u0442\u043e\u043c\u0430\u0442\u0441\u043a\u0438 \u043f\u0440\u043e\u0446\u0435\u045a\u0443\u0458\u0435 \u043f\u043e\u0433\u043e\u0434\u043d\u043e\u0441\u0442 \u0432\u0430\u0448\u0435 \u0432\u0435\u0437\u0435 \u0437\u0430 <strong>competitive FPS gaming</strong> (ping &lt;35\u202fms, jitter &lt;10\u202fms), <strong>voice chat</strong> \u0430\u043f\u043b\u0438\u043a\u0430\u0446\u0438\u0458\u0435 \u043f\u043e\u043f\u0443\u0442 Discorda \u0438 Teamsa, \u0438 <strong>livestreaming</strong> \u043d\u0430 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430\u043c\u0430 \u043f\u043e\u043f\u0443\u0442 Twitcha \u0438 YouTubea. \u0414\u043e\u0431\u0438\u0458\u0430\u0442\u0435 \u0458\u0430\u0441\u043d\u0443 \u043e\u0446\u0435\u043d\u0443: \u041e\u0434\u043b\u0438\u0447\u043d\u043e, \u0421\u043e\u043b\u0438\u0434\u043d\u043e \u0438\u043b\u0438 \u0420\u0438\u0437\u0438\u0447\u043d\u043e.',
    historyHeading:'\u0418\u0441\u0442\u043e\u0440\u0438\u0458\u0430 \u043c\u0435\u0440\u0435\u045a\u0430', btnClear:'\u041e\u0431\u0440\u0438\u0448\u0438',
    hColTime:'\u0412\u0440\u0435\u043c\u0435', hColDl:'Download', hColUl:'Upload', hColPing:'Ping', hColJitter:'Jitter', hColGrade:'\u041e\u0446\u0435\u043d\u0430',
    footerTagline:'\u041f\u0440\u043e\u0444\u0435\u0441\u0438\u043e\u043d\u0430\u043b\u043d\u0430 \u043c\u0440\u0435\u0436\u043d\u0430 \u0438\u043d\u0442\u0435\u043b\u0438\u0433\u0435\u043d\u0446\u0438\u0458\u0430',
    footerPrivacy:'\u041f\u0440\u0438\u0432\u0430\u0442\u043d\u043e\u0441\u0442', footerContact:'\u041a\u043e\u043d\u0442\u0430\u043a\u0442', footerApi:'API',
    footerNote:'\u0411\u0435\u0437 \u043a\u043e\u043b\u0430\u0447\u0438\u045b\u0430 \u0437\u0430 \u043f\u0440\u0430\u045b\u0435\u045a\u0435. \u0418\u0441\u0442\u043e\u0440\u0438\u0458\u0430 \u043c\u0435\u0440\u0435\u045a\u0430 \u0438 \u043b\u043e\u043a\u0430\u043b\u043d\u0438 toolkit \u043f\u043e\u0434\u0430\u0446\u0438 \u043e\u0441\u0442\u0430\u0458\u0443 \u043d\u0430 \u0432\u0430\u0448\u0435\u043c \u0443\u0440\u0435\u0452\u0430\u0458\u0443 \u0443 browser storageu \u0438 \u043d\u0438\u043a\u0430\u0434\u0430 \u0441\u0435 \u043d\u0435 \u0448\u0430\u0459\u0443 \u043d\u0430 \u043d\u0430\u0448\u0435 \u0441\u0435\u0440\u0432\u0435\u0440\u0435.',
    footerCredit:'Amilma \u00a9 2026. \u041d\u0430\u043f\u0440\u0430\u0432\u0459\u0435\u043d\u043e \u0441 \u2665 \u0443 \u0411\u043e\u0441\u043d\u0438 \u0438 \u0425\u0435\u0440\u0446\u0435\u0433\u043e\u0432\u0438\u043d\u0438.',
    phasePing:'Ping / \u041b\u0430\u0442\u0435\u043d\u0446\u0438\u0458\u0430', phaseDl:'Download \u043f\u0440\u043e\u043f\u0443\u0441\u043d\u043e\u0441\u0442', phaseUl:'Upload \u043f\u0440\u043e\u043f\u0443\u0441\u043d\u043e\u0441\u0442', phaseDone:'\u041c\u0435\u0440\u0435\u045a\u0435 \u0437\u0430\u0432\u0440\u0448\u0435\u043d\u043e',
    gradeAplus:'\u0418\u0437\u0443\u0437\u0435\u0442\u043d\u0430 \u0432\u0435\u0437\u0430 \u2014 4K streaming, gaming \u0438 \u0432\u0438\u0434\u0435\u043e \u043f\u043e\u0437\u0438\u0432\u0438 \u0440\u0430\u0434\u0435 \u0431\u0435\u0441\u043f\u0440\u0435\u043a\u043e\u0440\u043d\u043e.',
    gradeA:    '\u041e\u0434\u043b\u0438\u0447\u043d\u0430 \u0432\u0435\u0437\u0430 \u2014 \u0441\u0432\u0435 \u0440\u0430\u0434\u0438 \u0433\u043b\u0430\u0442\u043a\u043e \u0431\u0435\u0437 \u043f\u0440\u0438\u043c\u0435\u0442\u043d\u0438\u0445 \u0437\u0430\u0441\u0442\u043e\u0458\u0430.',
    gradeBplus:'\u0412\u0440\u043b\u043e \u0434\u043e\u0431\u0440\u0430 \u0432\u0435\u0437\u0430 \u2014 HD/4K \u0438 \u0440\u0430\u0434 \u043e\u0434 \u043a\u0443\u045b\u0435 \u0431\u0435\u0437 \u043f\u0440\u043e\u0431\u043b\u0435\u043c\u0430.',
    gradeB:    '\u0414\u043e\u0431\u0440\u0430 \u0432\u0435\u0437\u0430 \u2014 \u0441\u0432\u0430\u043a\u043e\u0434\u043d\u0435\u0432\u043d\u0430 \u0443\u043f\u043e\u0442\u0440\u0435\u0431\u0430 \u0431\u0435\u0437 \u0432\u0435\u045b\u0438\u0445 \u043f\u043e\u0442\u0435\u0448\u043a\u043e\u045b\u0430.',
    gradeC:    '\u041f\u0440\u043e\u0441\u0435\u0447\u043d\u0430 \u0432\u0435\u0437\u0430 \u2014 \u043f\u043e\u0432\u0440\u0435\u043c\u0435\u043d\u0438 \u043f\u0430\u0434\u043e\u0432\u0438 \u043a\u0432\u0430\u043b\u0438\u0442\u0435\u0442\u0430 \u0441\u0443 \u043c\u043e\u0433\u0443\u045b\u0438.',
    gradeD:    '\u0421\u043b\u0430\u0431\u0438\u0458\u0430 \u0432\u0435\u0437\u0430 \u2014 \u0440\u0430\u0437\u043c\u043e\u0442\u0440\u0438\u0442\u0435 \u0431\u043e\u0459\u0438 \u043f\u0430\u043a\u0435\u0442 \u0438\u043b\u0438 \u043f\u0440\u043e\u0432\u0435\u0440\u0443 \u043e\u043f\u0440\u0435\u043c\u0435.',
    copyHeader:'Amilma IP & Network Toolkit \u0440\u0435\u0437\u0443\u043b\u0442\u0430\u0442:', copyGrade:'\u041e\u0446\u0435\u043d\u0430:',
  },
};

function t(key){ return (TRANSLATIONS[currentLang] || TRANSLATIONS.en)[key] || ''; }

const ELITE_I18N = {
  en: {
    eliteHeading: 'Advanced Connection Details',
    eliteCopyReport: 'Copy Report',
    eliteReportCopied: 'Report copied',
    eliteSecKicker: 'Browser', eliteSecTitle: 'Privacy & Transport',
    eliteNetKicker: 'Network',  eliteNetTitle: 'Connection Intelligence',
    eliteAdvKicker: 'Advisory', eliteAdvTitle: 'Actionable Recommendations',
    kSecHttps: 'HTTPS', kSecDnt: 'Do Not Track', kSecCookie: 'Cookies', kSecStorage: 'Local Storage', kSecSw: 'Service Worker', kSecWebrtc: 'WebRTC',
    kNiProtocol: 'Protocol', kNiDns: 'DNS option', kNiPrivacy: 'Route visibility', kNiLatency: 'Latency Class', kNiRoute: 'Route Quality', kNiScore: 'Network Score', kNiClass: 'Overall Class',
    kNi4k: '4K Streams', kNiCalls: 'HD Calls', kNiBackup: '1 GB Upload',
    recDefault: 'Run a speed test to generate tailored optimization and security recommendations.',
  },
  bs: {
    eliteHeading: 'Napredni detalji veze',
    eliteCopyReport: 'Kopiraj izvještaj',
    eliteReportCopied: 'Izvještaj kopiran',
    eliteSecKicker: 'Preglednik', eliteSecTitle: 'Privatnost i transport',
    eliteNetKicker: 'Mreža', eliteNetTitle: 'Inteligencija veze',
    eliteAdvKicker: 'Preporuke', eliteAdvTitle: 'Akcione preporuke',
    kSecHttps: 'HTTPS', kSecDnt: 'Do Not Track', kSecCookie: 'Kolačići', kSecStorage: 'Lokalna pohrana', kSecSw: 'Service Worker', kSecWebrtc: 'WebRTC',
    kNiProtocol: 'Protokol', kNiDns: 'DNS opcija', kNiPrivacy: 'Vidljivost rute', kNiLatency: 'Klasa latencije', kNiRoute: 'Kvalitet rute', kNiScore: 'Mrežni score', kNiClass: 'Ukupna klasa',
    kNi4k: '4K streamovi', kNiCalls: 'HD pozivi', kNiBackup: 'Upload 1 GB',
    recDefault: 'Pokrenite test brzine kako biste dobili prilagođene preporuke za optimizaciju i sigurnost.',
  },
  hr: {
    eliteHeading: 'Napredni detalji veze',
    eliteCopyReport: 'Kopiraj izvještaj',
    eliteReportCopied: 'Izvještaj kopiran',
    eliteSecKicker: 'Preglednik', eliteSecTitle: 'Privatnost i prijenos',
    eliteNetKicker: 'Mreža', eliteNetTitle: 'Inteligencija veze',
    eliteAdvKicker: 'Preporuke', eliteAdvTitle: 'Akcijske preporuke',
    kSecHttps: 'HTTPS', kSecDnt: 'Do Not Track', kSecCookie: 'Kolačići', kSecStorage: 'Lokalna pohrana', kSecSw: 'Service Worker', kSecWebrtc: 'WebRTC',
    kNiProtocol: 'Protokol', kNiDns: 'DNS opcija', kNiPrivacy: 'Vidljivost rute', kNiLatency: 'Klasa latencije', kNiRoute: 'Kvaliteta rute', kNiScore: 'Mrežni score', kNiClass: 'Ukupna klasa',
    kNi4k: '4K streamovi', kNiCalls: 'HD pozivi', kNiBackup: 'Upload 1 GB',
    recDefault: 'Pokrenite test brzine kako biste dobili prilagođene preporuke za optimizaciju i sigurnost.',
  },
  sr: {
    eliteHeading: 'Напредни детаљи везе',
    eliteCopyReport: 'Копирај извештај',
    eliteReportCopied: 'Извештај копиран',
    eliteSecKicker: 'Прегледач', eliteSecTitle: 'Приватност и транспорт',
    eliteNetKicker: 'Мрежа', eliteNetTitle: 'Интелигенција везе',
    eliteAdvKicker: 'Препоруке', eliteAdvTitle: 'Акционе препоруке',
    kSecHttps: 'HTTPS', kSecDnt: 'Do Not Track', kSecCookie: 'Колачићи', kSecStorage: 'Локална меморија', kSecSw: 'Service Worker', kSecWebrtc: 'WebRTC',
    kNiProtocol: 'Протокол', kNiDns: 'DNS опција', kNiPrivacy: 'Видљивост руте', kNiLatency: 'Класа латенције', kNiRoute: 'Квалитет руте', kNiScore: 'Мрежни score', kNiClass: 'Укупна класа',
    kNi4k: '4K стримови', kNiCalls: 'HD позиви', kNiBackup: 'Upload 1 GB',
    recDefault: 'Покрените тест брзине да добијете прилагођене препоруке за оптимизацију и безбедност.',
  },
};

function et(key){
  const L = ELITE_I18N[currentLang] || ELITE_I18N.en;
  return L[key] || ELITE_I18N.en[key] || '';
}

function translate(){
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  document.documentElement.lang = T.langCode;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));

  const q1 = (sel, key) => { const el = document.querySelector(sel);  if(el) el.textContent = T[key] || ''; };
  const qH = (sel, key) => { const el = document.querySelector(sel);  if(el) el.innerHTML  = T[key] || ''; };
  const set = (id,  key) => { const el = document.getElementById(id); if(el) el.textContent = T[key] || ''; };

  q1('.panel-caption', 'panelCaption');

  if(!testing){
    set('phase-chip-text', 'phaseStandby');
    set('phase-label',     'phaseClickStart');
    const btnText = document.getElementById('btn-text');
    if(btnText) btnText.textContent = Object.keys(lastResult || {}).length ? T.btnRerun : T.btnStart;
  }

  const psDone = document.getElementById('ps-done');
  if(psDone) psDone.innerHTML = '<div class="ps-dot"></div>' + (T.psDone || 'Done');

  q1('.grade-label', 'gradeLabel');
  const shareSpan = document.querySelector('.btn-share span');
  if(shareSpan) shareSpan.textContent = T.btnCopyResult;

  const infoLabels = document.querySelectorAll('.info-label');
  ['infoIp','infoIsp','infoLoc','infoServer'].forEach((k,i) => { if(infoLabels[i]) infoLabels[i].textContent = T[k] || ''; });
  const statusTexts = document.querySelectorAll('.status-text');
  ['statusOnline','statusActive'].forEach((k,i) => { if(statusTexts[i]) statusTexts[i].textContent = T[k] || ''; });

  q1('#toolkit-block .section-heading', 'toolkitHeading');
  const kickers = document.querySelectorAll('.tool-card-kicker');
  const titles  = document.querySelectorAll('.tool-card-title');
  ['sysKicker','cmdKicker','gamingKicker'].forEach((k,i) => { if(kickers[i]) kickers[i].textContent = T[k] || ''; });
  ['sysTitle', 'cmdTitle', 'gamingTitle' ].forEach((k,i) => { if(titles[i])  titles[i].textContent  = T[k] || ''; });

  const kvKeys = document.querySelectorAll('.kv-key');
  ['kvPlatform','kvBrowser','kvLang','kvTz','kvConn','kvRtt','kvHw'].forEach((k,i) => {
    if(kvKeys[i]) kvKeys[i].textContent = T[k] || '';
  });

  const copyDiagBtn = document.getElementById('btn-copy-diag');
  if(copyDiagBtn && !copyDiagBtn.disabled) copyDiagBtn.textContent = T.btnCopyJson;
  const copyIpBtnEl = document.getElementById('btn-copy-ip');
  if(copyIpBtnEl && !copyIpBtnEl.disabled) copyIpBtnEl.textContent = T.btnCopyIp;
  set('tool-cmd-hint', 'cmdHint');

  const profileNames = document.querySelectorAll('.profile-name');
  ['profileFps','profileVoice','profileStream'].forEach((k,i) => {
    if(profileNames[i]) profileNames[i].textContent = T[k] || '';
  });
  const fpsBadge = document.getElementById('prof-fps-badge');
  if(fpsBadge && fpsBadge.classList.contains('neutral')){
    set('prof-fps-note',    'profileFpsNote');
    set('prof-voice-note',  'profileVoiceNote');
    set('prof-stream-note', 'profileStreamNote');
    document.querySelectorAll('.profile-badge.neutral').forEach(b => b.textContent = T.badgeWaiting || '');
  }

  q1('.seo-about .section-heading', 'seoHeading');
  const seoH3s = document.querySelectorAll('.seo-card h3');
  const seoPs  = document.querySelectorAll('.seo-card p');
  ['seoCard1Title','seoCard2Title','seoCard3Title'].forEach((k,i) => { if(seoH3s[i]) seoH3s[i].textContent = T[k] || ''; });
  ['seoCard1Html', 'seoCard2Html', 'seoCard3Html' ].forEach((k,i) => { if(seoPs[i])  seoPs[i].innerHTML  = T[k] || ''; });

  const histH2 = document.querySelector('#history-block .section-heading');
  if(histH2) histH2.textContent = T.historyHeading;
  const clearBtnEl = document.querySelector('#history-block .btn-clear-history');
  if(clearBtnEl) clearBtnEl.textContent = T.btnClear;
  const hCols = document.querySelectorAll('.h-col-label');
  ['hColTime','hColDl','hColUl','hColPing','hColJitter','hColGrade'].forEach((k,i) => {
    if(hCols[i]) hCols[i].textContent = T[k] || '';
  });

  q1('.footer-tagline', 'footerTagline');
  const ftLinks = document.querySelectorAll('.footer-links a');
  if(ftLinks[0]) ftLinks[0].textContent = T.footerPrivacy;
  if(ftLinks[1]) ftLinks[1].textContent = T.footerContact;
  if(ftLinks[2]) ftLinks[2].textContent = T.footerApi;
  q1('.footer-note',   'footerNote');
  q1('.footer-credit', 'footerCredit');

  const eliteMap = {
    'elite-heading': 'eliteHeading',
    'elite-sec-kicker': 'eliteSecKicker',
    'elite-sec-title': 'eliteSecTitle',
    'elite-net-kicker': 'eliteNetKicker',
    'elite-net-title': 'eliteNetTitle',
    'elite-adv-kicker': 'eliteAdvKicker',
    'elite-adv-title': 'eliteAdvTitle',
    'elite-k-sec-https': 'kSecHttps',
    'elite-k-sec-dnt': 'kSecDnt',
    'elite-k-sec-cookie': 'kSecCookie',
    'elite-k-sec-storage': 'kSecStorage',
    'elite-k-sec-sw': 'kSecSw',
    'elite-k-sec-webrtc': 'kSecWebrtc',
    'elite-k-ni-protocol': 'kNiProtocol',
    'elite-k-ni-dns': 'kNiDns',
    'elite-k-ni-privacy': 'kNiPrivacy',
    'elite-k-ni-latency': 'kNiLatency',
    'elite-k-ni-route': 'kNiRoute',
    'elite-k-ni-score': 'kNiScore',
    'elite-k-ni-class': 'kNiClass',
    'elite-k-ni-4k': 'kNi4k',
    'elite-k-ni-calls': 'kNiCalls',
    'elite-k-ni-backup': 'kNiBackup',
    'elite-rec-default': 'recDefault',
  };
  Object.entries(eliteMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if(el) el.textContent = et(key);
  });
  const copyReportBtn = document.getElementById('btn-copy-report');
  if(copyReportBtn && !copyReportBtn.disabled) copyReportBtn.textContent = et('eliteCopyReport');
}

function setLang(lang){
  if(!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('amilma_lang', lang);
  translate();
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 1 ▸ GSAP TICKER SETUP
══════════════════════════════════════════════════════════════════════ */
if(HAS_GSAP) {
  gsap.ticker.lagSmoothing(500, 33);
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 2 ▸ CYBER CANVAS BACKGROUND
   ──────────────────────────────────────────────────────────────────────
   • Perspective grid (red+blue vanishing lines)
   • Floating particles (red / blue / white)
   • Horizontal sweep scan line (periodic)
   • Phase-aware: colours shift with test state
══════════════════════════════════════════════════════════════════════ */
let networkBG;  // exposed so startTest() can call networkBG.setPhase()

(function initNetworkBG() {
  const canvas = document.getElementById('webgl-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W, H, t = 0;

  /* ── Phase palette ─────────────────────────────────── */
  let phase = 'idle';
  const PALETTES = {
    idle: { grid: '255,0,34',   gridB: '0,100,255',  particle: ['255,0,34','0,100,255','200,200,255'],  scanR: '255,0,34',  scanB: '0,200,255', gridAlpha: 1.00 },
    dl:   { grid: '0,120,255',  gridB: '0,70,200',   particle: ['0,120,255','0,200,255','120,200,255'], scanR: '0,100,200', scanB: '0,240,255', gridAlpha: 1.30 },
    ul:   { grid: '255,0,34',   gridB: '200,0,60',   particle: ['255,0,34','255,60,0','255,200,180'],   scanR: '255,0,34',  scanB: '255,80,0',  gridAlpha: 1.30 },
    ping: { grid: '255,80,0',   gridB: '200,40,0',   particle: ['255,80,0','255,0,34','255,200,80'],    scanR: '255,80,0',  scanB: '255,180,0', gridAlpha: 1.10 },
  };
  let pal = PALETTES.idle;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  /* Debounce: coalesce rapid window resize events into one canvas update */
  let _resizeTimer = null;
  window.addEventListener('resize', function() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(resize, 150);
  }, { passive: true });

  /* Pause the draw loop when canvas is scrolled out of view (saves CPU/battery) */
  let _bgPaused = false;
  if(typeof IntersectionObserver !== 'undefined'){
    new IntersectionObserver(entries => {
      _bgPaused = !entries[0].isIntersecting;
    }, { threshold: 0.01 }).observe(canvas);
  }

  /* ── Particles ─────────────────────────────────────── */
  const PTS = [];
  function mkPt() {
    const cols = pal.particle;
    return {
      x:       Math.random() * W,
      y:       Math.random() * H,
      vy:      -(Math.random() * 0.5 + 0.10),
      vx:      (Math.random() - 0.5) * 0.16,
      r:       Math.random() * 1.4 + 0.25,
      life:    0,
      maxLife: Math.random() * 280 + 140,
      rgb:     cols[Math.floor(Math.random() * cols.length)],
      maxA:    Math.random() * 0.38 + 0.07,
    };
  }
  for (let i = 0; i < 90; i++) PTS.push(mkPt());

  /* ── Sweep scan line ────────────────────────────────── */
  let scanY = -1, scanActive = false, scanA = 0;
  function triggerScan() {
    if (scanActive) return;
    scanActive = true;
    scanY = -H * 0.1;
    scanA = 1;
  }
  setTimeout(triggerScan, 900);
  setInterval(function() { if (Math.random() > 0.35) triggerScan(); }, 6000);

  /* ── Grid constants ─────────────────────────────────── */
  const GRID_COLS = 22;
  const GRID_ROWS = 15;

  /* ── Main draw loop ─────────────────────────────────── */
  function draw() {
    requestAnimationFrame(draw);
    /* Skip all drawing when the canvas is out of viewport (saves CPU/battery) */
    if(_bgPaused) return;
    ctx.clearRect(0, 0, W, H);
    t += 0.004;

    const ag = pal.gridAlpha;
    const gridRgb  = pal.grid;
    const gridRgb2 = pal.gridB;

    /* ─ Perspective grid ─ */
    const vanishX   = W / 2;
    const vanishY   = H * 0.48 + Math.sin(t * 0.7) * 10;
    const gridBottom = H + 80;
    const gridLeft   = -W * 0.18;
    const gridRight  =  W * 1.18;

    ctx.save();

    /* Vertical lines */
    for (let col = 0; col <= GRID_COLS; col++) {
      const px       = gridLeft + (gridRight - gridLeft) * (col / GRID_COLS);
      const isDark   = col % 4 !== 0;
      const useBlue  = col % 5 === 0;
      const rgb      = useBlue ? gridRgb2 : gridRgb;
      let alpha      = (isDark ? 0.028 : 0.065) * ag + 0.012 * Math.abs(Math.sin(col * 0.5 + t));
      if (isDark) alpha *= 0.5;

      const grad = ctx.createLinearGradient(vanishX, vanishY, px, gridBottom);
      grad.addColorStop(0,   `rgba(${rgb},0)`);
      grad.addColorStop(0.5, `rgba(${rgb},${alpha * 0.9})`);
      grad.addColorStop(1,   `rgba(${rgb},${alpha})`);
      ctx.beginPath();
      ctx.moveTo(vanishX, vanishY);
      ctx.lineTo(px, gridBottom);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = isDark ? 0.35 : 0.75;
      ctx.stroke();
    }

    /* Horizontal lines */
    for (let row = 0; row <= GRID_ROWS; row++) {
      const frac   = Math.pow(row / GRID_ROWS, 1.9);
      const rowY   = vanishY + (gridBottom - vanishY) * frac;
      const lx     = vanishX + (gridLeft  - vanishX) * frac;
      const rx     = vanishX + (gridRight - vanishX) * frac;
      const isMajor = row % 3 === 0;
      const rowAlpha = (0.035 + 0.058 * frac) * (isMajor ? 1.9 : 0.52) * ag;
      const useBlue  = row % 4 === 0;
      const rgb      = useBlue ? gridRgb2 : gridRgb;

      const hgrad = ctx.createLinearGradient(lx, rowY, rx, rowY);
      hgrad.addColorStop(0,    `rgba(${rgb},0)`);
      hgrad.addColorStop(0.25, `rgba(${rgb},${rowAlpha})`);
      hgrad.addColorStop(0.5,  `rgba(${rgb},${rowAlpha * 1.6})`);
      hgrad.addColorStop(0.75, `rgba(${rgb},${rowAlpha})`);
      hgrad.addColorStop(1,    `rgba(${rgb},0)`);
      ctx.beginPath();
      ctx.moveTo(lx, rowY);
      ctx.lineTo(rx, rowY);
      ctx.strokeStyle = hgrad;
      ctx.lineWidth   = isMajor ? 0.72 : 0.32;
      ctx.stroke();
    }

    /* Horizon glow */
    const hg = ctx.createLinearGradient(0, vanishY - 28, 0, vanishY + 44);
    hg.addColorStop(0,   `rgba(${gridRgb},0)`);
    hg.addColorStop(0.45, `rgba(${gridRgb},${0.09 * ag})`);
    hg.addColorStop(0.55, `rgba(${gridRgb2},${0.06 * ag})`);
    hg.addColorStop(1,   `rgba(${gridRgb},0)`);
    ctx.fillStyle = hg;
    ctx.fillRect(0, vanishY - 28, W, 72);

    ctx.restore();

    /* ─ Particles ─ */
    for (let i = 0; i < PTS.length; i++) {
      const p = PTS[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      const half = p.maxLife / 2;
      p.a = p.life < half
        ? (p.life / half) * p.maxA
        : ((p.maxLife - p.life) / half) * p.maxA;
      if (p.a <= 0 || p.y < -5) {
        Object.assign(p, mkPt());
        p.y    = H + 5;
        p.life = 0;
        p.rgb  = pal.particle[Math.floor(Math.random() * pal.particle.length)];
      }
      ctx.save();
      ctx.globalAlpha  = Math.max(0, p.a);
      ctx.fillStyle    = `rgb(${p.rgb})`;
      ctx.shadowColor  = `rgba(${p.rgb},.55)`;
      ctx.shadowBlur   = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* ─ Sweep scan line ─ */
    if (scanActive) {
      scanY += 4.5;
      const sa = Math.max(0, scanA * (1 - Math.abs(scanY - H * 0.5) / (H * 0.62)));
      if (sa > 0) {
        const sg = ctx.createLinearGradient(0, scanY - 3, 0, scanY + 3);
        sg.addColorStop(0,   `rgba(${pal.scanR},0)`);
        sg.addColorStop(0.5, `rgba(${pal.scanR},${sa * 0.72})`);
        sg.addColorStop(1,   `rgba(${pal.scanB},${sa * 0.28})`);
        ctx.fillStyle = sg;
        ctx.fillRect(0, scanY - 3, W, 6);

        ctx.save();
        ctx.globalAlpha  = sa * 0.55;
        ctx.strokeStyle  = `rgba(${pal.scanR},.65)`;
        ctx.lineWidth    = 1;
        ctx.shadowColor  = `rgba(${pal.scanR},.9)`;
        ctx.shadowBlur   = 14;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(W, scanY);
        ctx.stroke();
        ctx.restore();
      }
      if (scanY > H * 1.15) { scanActive = false; scanY = -1; }
    }
  }

  draw();

  /* ── Public API — called from startTest() ───────────── */
  networkBG = {
    setPhase(p) {
      phase = p;
      pal   = PALETTES[p] || PALETTES.idle;
      /* Refresh particle colours on next frames */
      for (let i = 0; i < PTS.length; i++) {
        PTS[i].rgb = pal.particle[Math.floor(Math.random() * pal.particle.length)];
      }
      if (p !== 'idle') triggerScan();
    },
  };
})();


/* ══════════════════════════════════════════════════════════════════════
   SECTION 3 ▸ GSAP INTRO TIMELINE + HOVER EFFECTS
   Runs on DOMContentLoaded (script is already at bottom, so DOM is ready,
   but wrapped for safety in case script is ever moved to <head>).
══════════════════════════════════════════════════════════════════════ */
(function initGSAP() {

  if(!HAS_GSAP) return;

  // ── Set initial invisible states ───────────────────────────────────
  gsap.set('.console-title', { y: -30, opacity: 0 });
  gsap.set('.console-sub',   { y: 20,  opacity: 0 });
  gsap.set('.main-card',     { y: 48,  opacity: 0, scale: 0.96 });
  gsap.set('.stat-tile',     { y: 30,  opacity: 0 });
  gsap.set('.info-item',     { y: 22,  opacity: 0 });

  // ── Intro timeline ─────────────────────────────────────────────────
  const tl = gsap.timeline({ delay: 0.18 });

  tl
    .to('.console-title', {
      y: 0, opacity: 1, duration: 0.70, ease: 'power3.out',
    })
    .to('.console-sub', {
      y: 0, opacity: 1, duration: 0.55, ease: 'power2.out',
    }, '-=0.38')
    .to('.main-card', {
      y: 0, opacity: 1, scale: 1, duration: 0.90,
      ease: 'power3.out',
    }, '-=0.40')
    .to('.stat-tile', {
      y: 0, opacity: 1, duration: 0.50, ease: 'power2.out',
      stagger: { each: 0.08, from: 'start' },
    }, '-=0.55')
    .to('.info-item', {
      y: 0, opacity: 1, duration: 0.42, ease: 'power2.out',
      stagger: { each: 0.06, from: 'start' },
    }, '-=0.40');

  // ── Tile hover — neon glow intensification ─────────────────────────
  const tileGlows = {
    dl:     '0,140,255',
    ul:     '255,0,51',
    ping:   '255,102,0',
    jitter: '136,0,255',
  };

  document.querySelectorAll('.stat-tile').forEach(tile => {
    const col = tileGlows[tile.dataset.key] || '255,255,255';

    tile.addEventListener('mouseenter', () => {
      gsap.to(tile, {
        y: -4,
        boxShadow: `0 0 0 1px rgba(${col},.22) inset, 0 0 32px rgba(${col},.18), 0 16px 40px rgba(0,0,0,.42)`,
        duration: 0.28, ease: 'power2.out', overwrite: 'auto',
      });
    });
    tile.addEventListener('mouseleave', () => {
      gsap.to(tile, {
        y: 0,
        boxShadow: '0 8px 24px rgba(0,0,0,.30), 0 2px 6px rgba(0,0,0,.18)',
        duration: 0.40, ease: 'power2.inOut', overwrite: 'auto',
      });
    });
  });

  // ── Button hover ──────────────────────────────────────────────────
  const startBtn = document.getElementById('start-btn');
  if(startBtn){
    startBtn.addEventListener('mouseenter', () => {
      gsap.to(startBtn, {
        scale: 1.03, duration: 0.22, ease: 'power1.out', overwrite: 'auto',
      });
    });
    startBtn.addEventListener('mouseleave', () => {
      gsap.to(startBtn, {
        scale: 1, duration: 0.30, ease: 'power1.inOut', overwrite: 'auto',
      });
    });
  }

})();


/* ══════════════════════════════════════════════════════════════════════
   SECTION 4 ▸ RAF GAUGE ENGINE + NUMBER ANIMATION
   Single requestAnimationFrame loop owns all real-time gauge updates.
   Linear-interpolation (lerp) at 60 fps eliminates the race between
   GSAP and the SVG's CSS stroke-dasharray transition — the root cause
   of the stutter/freeze seen during live Download/Upload measurement.
   During a test the CSS transitions on arc-fill and needle-wrap are
   temporarily overridden (transition:none) so the RAF loop drives them
   at native 60 fps; they are restored on idle so the GSAP intro and
   theme-switch still work smoothly.
══════════════════════════════════════════════════════════════════════ */

/* Legacy shims — kept so any existing GSAP calls don't break */
const gaugeProxy = { val: 0 };
const numProxy   = { val: 0 };

/* ── RAF engine private state ────────────────────────────────────── */
let _rafId         = null;
let _rafRunning    = false;
let _gaugeTarget   = 0;
let _gaugeSmooth   = 0;
let _numTarget     = 0;
let _numSmooth     = 0;
let _numIsSpeed    = true;
const _LERP_GAUGE  = 0.14;   // ~60fps: reaches 99% of target in ≈0.5s
const _LERP_NUM    = 0.18;

function _rafTick() {
  _rafId = requestAnimationFrame(_rafTick);

  _gaugeSmooth += (_gaugeTarget - _gaugeSmooth) * _LERP_GAUGE;
  _numSmooth   += (_numTarget   - _numSmooth)   * _LERP_NUM;

  /* Write to SVG gauge */
  setGaugeRaw(_gaugeSmooth);

  /* Write to centre number display */
  const el = document.getElementById('main-number');
  if(el){
    const v = _numSmooth;
    el.textContent = _numIsSpeed
      ? (v >= 100 ? Math.round(v).toString() : v.toFixed(1))
      : Math.round(v).toString();
  }
}

function _startRAF(){
  if(_rafRunning) return;
  _rafRunning = true;

  /* Override CSS transitions — RAF controls these at 60fps now */
  const af = document.getElementById('arc-fill');
  if(af) af.style.setProperty('transition', 'stroke .18s ease, filter .18s ease', 'important');
  const og = document.getElementById('arc-outer-glow');
  if(og) og.style.setProperty('transition', 'stroke .22s ease', 'important');
  const nw = document.getElementById('needle-wrap');
  if(nw) nw.style.setProperty('transition', 'none', 'important');

  _rafTick();
}

function _stopRAF(){
  if(!_rafRunning) return;
  _rafRunning = false;
  if(_rafId){ cancelAnimationFrame(_rafId); _rafId = null; }

  /* Restore inline transitions so GSAP intro / theme transitions work */
  const af = document.getElementById('arc-fill');
  if(af) af.style.removeProperty('transition');
  const og = document.getElementById('arc-outer-glow');
  if(og) og.style.removeProperty('transition');
  const nw = document.getElementById('needle-wrap');
  if(nw) nw.style.removeProperty('transition');
}

/** Set gauge arc to target value (smooth lerp via RAF). dur=0 = instant. */
function animGaugeTo(mbps, dur = 0.38){
  const v = Math.max(0, mbps || 0);
  if(dur === 0){
    _gaugeTarget = v;
    _gaugeSmooth = v;
    _numTarget   = v;
    _numSmooth   = v;
    setGaugeRaw(v);
    return;
  }
  _gaugeTarget = v;
}

/** Set centre number display to target value (smooth lerp via RAF). */
function animNumTo(target, isSpeed = true){
  if(target === null){
    const el = document.getElementById('main-number');
    if(el) el.textContent = '—';
    _numTarget = 0; _numSmooth = 0;
    return;
  }
  _numIsSpeed = isSpeed;
  _numTarget  = Math.max(0, parseFloat(target) || 0);
}

/** Legacy helper — immediate, no animation. */
function setNumImmediate(v){
  const el = document.getElementById('main-number');
  if(el) el.textContent = (v === null || v === undefined) ? '—' : v;
  if(v === null){ _numTarget = 0; _numSmooth = 0; }
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 5 ▸ SVG GAUGE GEOMETRY
══════════════════════════════════════════════════════════════════════ */
const GCX = 310, GCY = 300, GR = 260;
const SA  = Math.PI, EA = 2 * Math.PI;

function toXY(a, r)     { return [GCX + r*Math.cos(a), GCY + r*Math.sin(a)]; }
function arcPath(a1,a2,r){
  const [x1,y1] = toXY(a1,r), [x2,y2] = toXY(a2,r);
  return `M${x1} ${y1} A${r} ${r} 0 ${(a2-a1)>Math.PI?1:0} 1 ${x2} ${y2}`;
}
function setTextPos(id, angle, r, dy=0){
  const [x,y] = toXY(angle,r);
  const t = document.getElementById(id);
  t.setAttribute('x', x); t.setAttribute('y', y+dy);
}

document.getElementById('arc-bg-outer').setAttribute('d', arcPath(SA,EA,GR));
document.getElementById('arc-bg-inner').setAttribute('d', arcPath(SA,EA,GR-18));
document.getElementById('arc-fill').setAttribute('d',     arcPath(SA,EA,GR));
const _arcGlowEl = document.getElementById('arc-outer-glow');
if(_arcGlowEl) _arcGlowEl.setAttribute('d', arcPath(SA,EA,GR));

// Tick marks — colored by speed zone
(function buildTicks(){
  const g = document.getElementById('hud-ticks');
  let html = '';
  const total = 60;
  for(let i = 0; i <= total; i++){
    const t = i/total, a = SA + t*(EA-SA);
    const major  = (i % 10 === 0);
    const medium = (!major && i % 5 === 0);

    // Zone colour
    let color;
    if(t < 1/3)      color = major ? 'rgba(80,145,210,.85)'  : medium ? 'rgba(80,145,210,.52)'  : 'rgba(80,145,210,.25)';
    else if(t < 2/3) color = major ? 'rgba(0,215,155,.88)'   : medium ? 'rgba(0,215,155,.52)'   : 'rgba(0,215,155,.26)';
    else if(t < 0.9) color = major ? 'rgba(255,182,0,.90)'   : medium ? 'rgba(255,182,0,.55)'   : 'rgba(255,182,0,.28)';
    else             color = major ? 'rgba(255,45,55,1.0)'    : medium ? 'rgba(255,45,55,.70)'   : 'rgba(255,45,55,.40)';

    const outerR = GR + (major ? 24 : medium ? 15 : 8);
    const innerR = GR - (major ? 22 : medium ? 15 : 10);
    const sw     = major ? 2.2 : medium ? 1.4 : 0.7;

    const [x1,y1] = toXY(a, outerR);
    const [x2,y2] = toXY(a, innerR);
    html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
  }
  g.innerHTML = html;
})();

setTextPos('lbl-0',   SA,                         GR+30, 5);
setTextPos('lbl-10',  SA+(1/3)*(EA-SA),            GR+24, -4);
setTextPos('lbl-100', SA+(2/3)*(EA-SA),            GR+24, -4);
setTextPos('lbl-500', SA+0.899*(EA-SA),            GR+24, -4);
setTextPos('lbl-1g',  EA,                          GR+30, 5);

function speedToAngle(mbps){
  if(mbps <= 0) return SA;
  return SA + Math.min(Math.log10(Math.max(mbps,.5))/Math.log10(1000), 1) * (EA-SA);
}

function setGaugeRaw(mbps){          // low-level — writes directly to SVG
  const angle    = speedToAngle(mbps);
  const totalLen = GR * (EA-SA);
  const t        = (angle-SA)/(EA-SA);
  const dashArr  = `${Math.max(0,t*totalLen)} ${totalLen}`;
  document.getElementById('arc-fill').setAttribute('stroke-dasharray', dashArr);
  // Sync the wide glow trail
  const outerGlow = document.getElementById('arc-outer-glow');
  if(outerGlow) outerGlow.setAttribute('stroke-dasharray', dashArr);
  document.getElementById('needle-wrap').style.transform =
    `rotate(${(angle - Math.PI/2) * (180/Math.PI)}deg)`;
  // Flash sweep streak on movement
  const streak = document.getElementById('needle-streak');
  if(streak){
    streak.setAttribute('stroke', 'rgba(0,180,255,.40)');
    clearTimeout(setGaugeRaw._st);
    setGaugeRaw._st = setTimeout(() => { streak.setAttribute('stroke', 'rgba(0,180,255,.0)'); }, 170);
  }
}

function setGaugeTheme(mode){
  const arc   = document.getElementById('arc-fill');
  const blade = document.getElementById('needle-blade');
  const needle= document.getElementById('needle');
  const tip   = document.getElementById('needle-tip');
  const hub   = document.getElementById('hub-core');
  const outerGlow = document.getElementById('arc-outer-glow');
  const map = {
    dl:   { grad:'arcGradDL',   arcFilter:'glowCyan',   needleColor:'#00BBFF', bladeFilter:'glowBlade',  hubFilter:'glowCyan',   body:'phase-dl',
            rings:['rgba(0,170,255,.55)','rgba(0,170,255,.38)','rgba(0,170,255,.20)'] },
    ul:   { grad:'arcGradUL',   arcFilter:'glowGreen',  needleColor:'#FF0033', bladeFilter:'glowGreen',  hubFilter:'glowGreen',  body:'phase-ul',
            rings:['rgba(255,0,51,.55)', 'rgba(255,0,51,.38)', 'rgba(255,0,51,.20)'] },
    ping: { grad:'arcGradPing', arcFilter:'glowOrange', needleColor:'#FF6600', bladeFilter:'glowOrange', hubFilter:'glowOrange', body:'phase-ping',
            rings:['rgba(255,102,0,.55)','rgba(255,102,0,.38)','rgba(255,102,0,.20)'] },
  };
  const c = map[mode] || map.dl;
  arc.setAttribute('stroke', `url(#${c.grad})`);
  arc.setAttribute('filter', `url(#${c.arcFilter})`);
  if(outerGlow) outerGlow.setAttribute('stroke', `url(#${c.grad})`);
  if(blade) blade.setAttribute('filter', `url(#${c.bladeFilter})`);
  needle.setAttribute('stroke', c.needleColor);
  needle.setAttribute('filter', `url(#${c.arcFilter})`);
  tip.setAttribute('filter',    `url(#${c.arcFilter})`);
  hub.setAttribute('fill',      c.needleColor);
  hub.setAttribute('filter',    `url(#${c.hubFilter})`);
  // Hub emission rings
  ['hub-ring-1','hub-ring-2','hub-ring-3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if(el) el.setAttribute('stroke', c.rings[i]);
  });
  // Needle streak color
  const streak = document.getElementById('needle-streak');
  if(streak) streak.style.setProperty('--streak-color', c.needleColor);
  document.body.classList.remove('phase-ping','phase-dl','phase-ul');
  document.body.classList.add(c.body);
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 6 ▸ IP INFO FETCH
   Strategy (in order):
     1. Cloudflare /meta  — no rate-limit, always available, CORS-safe
     2. Cloudflare trace  — lightweight fallback for IP + country
     3. ipapi.co/json/    — last resort (1000 req/day free tier)
   Each source has an AbortController timeout (6 s → 5 s → 5 s).
══════════════════════════════════════════════════════════════════════ */

/** Fetch with automatic AbortController timeout. */
function fetchWithTimeout(url, opts, timeoutMs){
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: ctrl.signal })
    .finally(() => clearTimeout(tid));
}

/** Parse Cloudflare /cdn-cgi/trace text into a key→value map. */
function parseCFTrace(text){
  const map = {};
  for(const line of text.split('\n')){
    const eq = line.indexOf('=');
    if(eq > 0) map[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return map;
}

(async () => {
  /** Normalise whatever source returned into { ip, org, city, country } */
  let info = null;

  // ── Source 1: Cloudflare /meta (reliable, no rate-limit, rich data) ───
  try {
    const resp = await fetchWithTimeout(
      'https://speed.cloudflare.com/meta',
      { cache: 'no-store', mode: 'cors' },
      6000
    );
    if(resp.ok){
      const d = await resp.json();
      info = {
        ip:      d.clientIp   || d.ip   || '',
        org:     d.asnOrgName || (d.asn ? `AS${d.asn}` : ''),
        city:    d.city       || '',
        country: d.country    || '',
      };
    }
  } catch { /* try next source */ }

  // ── Source 2: Cloudflare trace (< 1 KB, ultra-reliable) ──────────────
  if(!info || !info.ip){
    try {
      const resp = await fetchWithTimeout(
        `https://speed.cloudflare.com/cdn-cgi/trace?r=${Math.random()}`,
        { cache: 'no-store', mode: 'cors' },
        5000
      );
      if(resp.ok){
        const d = parseCFTrace(await resp.text());
        if(d.ip){
          info = {
            ip:      d.ip,
            org:     d.colo ? `Cloudflare colo ${d.colo}` : '',
            city:    '',
            country: d.loc || '',
          };
        }
      }
    } catch { /* try next source */ }
  }

  // ── Source 3: ipapi.co (fallback, rate-limited) ───────────────────────
  if(!info || !info.ip){
    try {
      const resp = await fetchWithTimeout(
        'https://ipapi.co/json/',
        { cache: 'no-store', mode: 'cors' },
        5000
      );
      if(resp.ok){
        const d = await resp.json();
        info = {
          ip:      d.ip          || '',
          org:     d.org         || '',
          city:    d.city        || '',
          country: d.country_name|| '',
        };
      }
    } catch { /* all sources exhausted */ }
  }

  // ── Inject into DOM ───────────────────────────────────────────────────
  const ipEl  = document.getElementById('ip-val');
  const ispEl = document.getElementById('isp-val');
  const locEl = document.getElementById('loc-val');

  if(info && info.ip){
    const org = String(info.org || '').trim();
    if(ipEl)  ipEl.textContent  = info.ip;
    if(ispEl) ispEl.textContent = org
      ? org.replace(/^AS\d+\s*/i, '').substring(0, 32) || org.substring(0, 32)
      : '—';
    if(locEl) locEl.textContent = (info.city && info.country)
      ? `${info.city}, ${info.country}`
      : info.country || '—';
  } else {
    if(ipEl)  ipEl.textContent  = 'N/A';
    if(ispEl) ispEl.textContent = '—';
    if(locEl) locEl.textContent = '—';
  }

  // Re-render panels that depend on IP (Security Posture already rendered
  // by initToolkitPanel at boot; here we refresh Connection Intelligence
  // now that the real IP is known).
  refreshToolkitPanel();
})();


/* ══════════════════════════════════════════════════════════════════════
   SECTION 7 ▸ SPEED-TEST HELPERS
══════════════════════════════════════════════════════════════════════ */
const sleep = ms => new Promise(r => setTimeout(r, ms));

function setNum(v){
  // Animated wrapper — delegates to animNumTo
  animNumTo(v === null ? null : parseFloat(v), true);
}
function setPhase(t){
  document.getElementById('phase-label').textContent    = t;
  document.getElementById('phase-chip-text').textContent = t;
}
function setProg(pct, cls){
  const f = document.getElementById('prog-fill');
  const v = Math.max(0, Math.min(100, pct));
  f.style.width   = `${v}%`;
  f.className     = 'progress-bar-fill' + (cls ? ` ${cls}` : '');
  f.setAttribute('aria-valuenow', Math.round(v));
}
function setStep(active){
  ['ping','dl','ul','done'].forEach(s => {
    const el = document.getElementById('ps-'+s);
    el.className = 'ps';
    if(s === active) el.classList.add('active');
  });
}
function doneStep(s){
  const el = document.getElementById('ps-'+s);
  el.classList.remove('active');
  el.classList.add('done');
}
function updateTile(key, value, cls){
  const v = document.getElementById('val-'+key);
  v.textContent = value;
  v.className   = 'tile-value' + (cls ? ` ${cls}` : '');
  if(cls) document.querySelector(`.stat-tile[data-key="${key}"]`)?.classList.add('lit');
}
function resetTiles(){
  ['dl','ul','ping','jitter'].forEach(k => {
    updateTile(k, '—', null);
    document.querySelector(`.stat-tile[data-key="${k}"]`)?.classList.remove('lit');
  });
}
function setScanning(on){
  document.getElementById('progress-area').classList.toggle('scanning', !!on);
}

function setElText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = (value ?? '—');
}

function getConnInfo(){
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

function getOSKind(){
  const ua = navigator.userAgent || '';
  const plat = (navigator.platform || '').toLowerCase();
  if(/win/i.test(ua) || plat.includes('win')) return 'windows';
  if(/mac/i.test(ua) || plat.includes('mac')) return 'mac';
  if(/linux/i.test(ua) || plat.includes('linux')) return 'linux';
  return 'other';
}

function getBrowserName(){
  const ua = navigator.userAgent || '';
  if(/Edg\//.test(ua)) return 'Edge';
  if(/OPR\//.test(ua)) return 'Opera';
  if(/Chrome\//.test(ua)) return 'Chrome';
  if(/Firefox\//.test(ua)) return 'Firefox';
  if(/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'Web browser';
}

function copyWithFeedback(text, btn, okLabel){
  if(!text) return;
  const label = okLabel !== undefined ? okLabel : t('btnCopied');
  writeClipboardText(String(text)).then(() => {
    if(!btn) return;
    const orig = btn.textContent;
    btn.textContent = label;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1400);
  }).catch(() => {});
}

function writeClipboardText(value){
  const text = String(value ?? '');
  if(!text) return Promise.reject(new Error('empty'));

  if(navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if(ok) resolve();
      else reject(new Error('copy-failed'));
    } catch (error) {
      reject(error);
    }
  });
}

function buildDiagSnapshot(){
  const conn = getConnInfo();
  const nav = performance.getEntriesByType('navigation')[0];
  const protocol = nav?.nextHopProtocol || 'unknown';
  return {
    timestamp: new Date().toISOString(),
    publicIP: document.getElementById('ip-val')?.textContent || null,
    isp: document.getElementById('isp-val')?.textContent || null,
    location: document.getElementById('loc-val')?.textContent || null,
    platform: navigator.platform || null,
    userAgent: navigator.userAgent || null,
    language: navigator.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    deviceMemoryGB: navigator.deviceMemory || null,
    connection: conn ? {
      effectiveType: conn.effectiveType || null,
      downlinkMbps: conn.downlink || null,
      rttMs: conn.rtt || null,
      saveData: !!conn.saveData,
    } : null,
    protocol,
    security: {
      https: location.protocol === 'https:',
      doNotTrack: navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack || null,
      cookiesEnabled: !!navigator.cookieEnabled,
      localStorage: (() => {
        try { localStorage.setItem('__elite_probe', '1'); localStorage.removeItem('__elite_probe'); return true; }
        catch { return false; }
      })(),
      serviceWorker: 'serviceWorker' in navigator,
      webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection),
    },
    lastSpeedTest: Object.keys(lastResult || {}).length ? lastResult : null,
  };
}

function getProtocolLabel(){
  const nav = performance.getEntriesByType('navigation')[0];
  const raw = (nav?.nextHopProtocol || '').toLowerCase();
  if(raw.includes('h3') || raw.includes('quic')) return 'HTTP/3 (QUIC)';
  if(raw.includes('h2')) return 'HTTP/2';
  if(raw.includes('http/1.1')) return 'HTTP/1.1';
  return raw ? raw.toUpperCase() : 'Unknown';
}

function inferPrivacyRisk(ip, isp){
  if(!ip || ip === '—' || ip === 'N/A') return 'Unknown';
  const txt = `${ip} ${isp || ''}`.toLowerCase();
  if(txt.includes('cloudflare warp') || txt.includes('vpn') || txt.includes('tunnel')) return 'Masked route detected';
  return 'Public ISP route';
}

function deriveLatencyClass(ping, jitter){
  const p = Number(ping) || 0;
  const j = Number(jitter) || 0;
  if(!p) return 'Baseline pending';
  if(p <= 20 && j <= 6) return 'Elite';
  if(p <= 40 && j <= 12) return 'Competitive';
  if(p <= 70 && j <= 20) return 'Standard';
  return 'Degraded';
}

function deriveRouteQuality(lossRate, ping){
  const loss = Number(lossRate) || 0;
  const p = Number(ping) || 0;
  if(loss === 0 && p <= 35) return 'Clean route';
  if(loss < 2 && p <= 65) return 'Stable route';
  if(loss < 4) return 'Variable route';
  return 'Unstable route';
}

function deriveOverallClass(result, conn){
  if(!result || !result.dl) return 'Awaiting benchmark';
  const dl = Number(result.dl) || 0;
  const ul = Number(result.ul) || 0;
  const ping = Number(result.ping) || 0;
  const eff = (conn?.effectiveType || '').toLowerCase();

  if(dl >= 200 && ul >= 40 && ping <= 20) return 'Tier 1 · Exceptional';
  if(dl >= 80 && ul >= 15 && ping <= 35) return 'Tier 2 · Fast';
  if(dl >= 20 && ul >= 4) return 'Tier 3 · Everyday';
  if(eff.includes('2g') || eff.includes('slow-2g')) return 'Tier 5 · Constrained';
  return 'Tier 4 · Limited';
}

function calculateNetworkScore(result, lossRate){
  if(!result) return null;
  const dl = Math.max(0, Number(result.dl) || 0);
  const ul = Math.max(0, Number(result.ul) || 0);
  const ping = Math.max(0, Number(result.ping) || 0);
  const jitter = Math.max(0, Number(result.jitter) || 0);
  const loss = Math.max(0, Number(lossRate) || 0);

  /* A failed latency or throughput probe should never look like a great score. */
  if(dl <= 0 || ping <= 0) return null;

  /* Saturating components reward useful real-world capacity without letting
     gigabit throughput hide poor latency, instability, or packet loss. */
  const dlComponent = 30 * (1 - Math.exp(-dl / 50));
  const ulComponent = 15 * (1 - Math.exp(-ul / 20));
  const latencyComponent = 25 * Math.exp(-Math.max(0, ping - 5) / 60);
  const jitterComponent = 15 * Math.exp(-jitter / 12);
  const lossComponent = 15 * Math.exp(-loss * 0.65);
  const score = Math.max(0, Math.min(100,
    dlComponent + ulComponent + latencyComponent + jitterComponent + lossComponent
  ));
  return Math.round(score);
}

function buildRecommendations(result, lossRate){
  const recs = [];
  const dl = Number(result?.dl) || 0;
  const ul = Number(result?.ul) || 0;
  const ping = Number(result?.ping) || 0;
  const jitter = Number(result?.jitter) || 0;
  const loss = Number(lossRate) || 0;

  if(!result || !result.dl){
    return [et('recDefault') || 'Run the full benchmark to unlock adaptive recommendations for performance and route quality.'];
  }

  if(ping > 45 || jitter > 15) recs.push('Prioritize wired Ethernet or 5 GHz/6 GHz Wi-Fi and reduce concurrent background traffic for lower latency/jitter.');
  if(loss > 1) recs.push('Packet loss detected: reboot router/ONT, inspect cable quality, and run traceroute to identify unstable hops.');
  if(ul < 8) recs.push('Upload is a bottleneck for calls/streaming: disable cloud sync during sessions and consider a higher upstream plan.');
  if(dl < 25) recs.push('Download throughput is limited: verify router channel congestion and place AP/router in a central, elevated position.');
  if(dl >= 100 && ping <= 30 && jitter <= 10) recs.push('Connection is strong for gaming/4K workloads; maintain QoS/SQM rules and periodic firmware updates.');
  if(location.protocol !== 'https:') recs.push('Security warning: this context is not HTTPS. Use encrypted transport to protect diagnostics and clipboard data.');
  if(!(navigator.doNotTrack === '1' || window.doNotTrack === '1')) recs.push('Enable Do Not Track in your browser privacy settings for reduced telemetry footprint.');
  if(navigator.cookieEnabled) recs.push('For stricter privacy, consider third-party cookie blocking and tracker protection in browser settings.');
  if(recs.length < 3) recs.push('Use DNS 1.1.1.1 or 8.8.8.8 for faster resolver response if your ISP DNS is inconsistent.');
  if(recs.length < 4) recs.push('Run this test at peak and off-peak hours to detect contention patterns and ISP congestion windows.');

  return recs.slice(0, 5);
}

function setIntelText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = value ?? '—';
}

function setIntelMetric(id, value, level = 'neutral'){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = value ?? '—';
  el.classList.remove('intel-good', 'intel-warn', 'intel-bad', 'intel-neutral');
  el.classList.add(`intel-${level}`);
}

function estimateCapacity(dl, ul){
  const d = Number(dl) || 0;
  const u = Number(ul) || 0;

  const streams4k = Math.max(0, Math.floor(d / 25));
  const hdCalls = Math.max(0, Math.floor(Math.min(d / 3, u / 2)));

  const minutesPerGb = u > 0 ? (8192 / Math.max(0.01, u)) : null;
  let backup;
  if(minutesPerGb == null || !Number.isFinite(minutesPerGb)) backup = '—';
  else if(minutesPerGb < 1) backup = '<1 min';
  else if(minutesPerGb < 120) backup = `${Math.round(minutesPerGb)} min`;
  else backup = `${(minutesPerGb / 60).toFixed(1)} h`;

  return { streams4k, hdCalls, backup };
}

function renderEliteIntelligence(result = null, lossRate = 0){
  const conn = getConnInfo();
  const ip = document.getElementById('ip-val')?.textContent || '—';
  const isp = document.getElementById('isp-val')?.textContent || '—';

  const httpsOk = location.protocol === 'https:';
  setIntelMetric('sec-https', httpsOk ? 'Enabled' : 'Not secure', httpsOk ? 'good' : 'bad');
  const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  const dntEnabled = dnt === '1' || dnt === 'yes';
  setIntelMetric('sec-dnt', dntEnabled ? 'Enabled' : 'Disabled', dntEnabled ? 'good' : 'neutral');

  const cookiesEnabled = navigator.cookieEnabled;
  setIntelMetric('sec-cookie', cookiesEnabled ? 'Enabled' : 'Blocked', 'neutral');

  const storageState = (() => {
    try { localStorage.setItem('__elite_probe', '1'); localStorage.removeItem('__elite_probe'); return 'Available'; }
    catch { return 'Restricted'; }
  })();
  setIntelMetric('sec-storage', storageState, 'neutral');

  const swSupported = 'serviceWorker' in navigator;
  setIntelMetric('sec-sw', swSupported ? 'Supported' : 'Not supported', 'neutral');

  const rtcSupported = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
  setIntelMetric('sec-webrtc', rtcSupported ? 'Supported' : 'Not supported', 'neutral');

  const protocol = getProtocolLabel();
  setIntelMetric('ni-protocol', protocol, protocol.includes('HTTP/3') ? 'good' : 'warn');

  const dnsPref = '1.1.1.1 / 1.0.0.1 (optional)';
  setIntelMetric('ni-dns', dnsPref, 'neutral');

  const privacyRisk = inferPrivacyRisk(ip, isp);
  setIntelMetric('ni-privacy', privacyRisk, privacyRisk.includes('Masked') ? 'good' : 'neutral');

  const latencyClass = deriveLatencyClass(result?.ping, result?.jitter);
  setIntelMetric('ni-latency', latencyClass, latencyClass === 'Elite' || latencyClass === 'Competitive' ? 'good' : latencyClass === 'Standard' ? 'warn' : 'bad');

  const routeQuality = deriveRouteQuality(lossRate, result?.ping);
  setIntelMetric('ni-route', routeQuality, routeQuality === 'Clean route' || routeQuality === 'Stable route' ? 'good' : routeQuality === 'Variable route' ? 'warn' : 'bad');

  const score = calculateNetworkScore(result, lossRate);
  setIntelMetric('ni-score', score == null ? '—' : `${score}/100`, score == null ? 'neutral' : score >= 80 ? 'good' : score >= 60 ? 'warn' : 'bad');

  const overallClass = deriveOverallClass(result, conn);
  setIntelMetric('ni-class', overallClass, overallClass.includes('Tier 1') || overallClass.includes('Tier 2') ? 'good' : overallClass.includes('Tier 3') ? 'warn' : 'bad');

  const cap = estimateCapacity(result?.dl, result?.ul);
  setIntelMetric('ni-4k', `${cap.streams4k} simultaneous`, cap.streams4k >= 2 ? 'good' : cap.streams4k === 1 ? 'warn' : 'bad');
  setIntelMetric('ni-calls', `${cap.hdCalls} concurrent`, cap.hdCalls >= 3 ? 'good' : cap.hdCalls >= 1 ? 'warn' : 'bad');
  setIntelMetric('ni-backup', cap.backup, cap.backup === '—' ? 'neutral' : cap.backup.includes('h') ? 'bad' : 'good');

  const list = document.getElementById('rec-list');
  if(list){
    const recs = buildRecommendations(result, lossRate);
    list.innerHTML = recs.map(item => `<li>${item}</li>`).join('');
  }
}

function buildVisitorReport(){
  const diag = buildDiagSnapshot();
  const recItems = Array.from(document.querySelectorAll('#rec-list li')).map(li => li.textContent?.trim()).filter(Boolean);
  return {
    title: 'Amilma Connection Diagnostics Report',
    generatedAt: new Date().toISOString(),
    diagnostics: diag,
    eliteInsights: {
      protocol: document.getElementById('ni-protocol')?.textContent || null,
      privacyRisk: document.getElementById('ni-privacy')?.textContent || null,
      latencyClass: document.getElementById('ni-latency')?.textContent || null,
      routeQuality: document.getElementById('ni-route')?.textContent || null,
      networkScore: document.getElementById('ni-score')?.textContent || null,
      overallClass: document.getElementById('ni-class')?.textContent || null,
    },
    recommendations: recItems,
  };
}

function refreshToolkitPanel(){
  const conn = getConnInfo();
  setElText('sys-platform', navigator.platform || '—');
  setElText('sys-browser', getBrowserName());
  setElText('sys-lang', navigator.language || '—');
  setElText('sys-tz', Intl.DateTimeFormat().resolvedOptions().timeZone || '—');

  const connLabel = conn
    ? [conn.effectiveType || 'n/a', (typeof conn.downlink === 'number' ? `${conn.downlink} Mbps` : null)].filter(Boolean).join(' · ')
    : 'N/A';
  setElText('sys-conn', connLabel);

  const rttLabel = conn
    ? [typeof conn.rtt === 'number' ? `${conn.rtt} ms` : 'n/a', typeof conn.downlink === 'number' ? `${conn.downlink} Mbps` : null].filter(Boolean).join(' / ')
    : 'N/A';
  setElText('sys-rtt', rttLabel);

  const hw = [navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency}C` : null, navigator.deviceMemory ? `${navigator.deviceMemory}GB` : null]
    .filter(Boolean).join(' / ') || 'N/A';
  setElText('sys-hw', hw);
  renderEliteIntelligence(lastResult, 0);
}

function setProfileRow(key, state, note){
  const badge = document.getElementById(`prof-${key}-badge`);
  const noteEl = document.getElementById(`prof-${key}-note`);
  if(!badge || !noteEl) return;

  const map = {
    ok:      { label: t('badgeOk'),      cls: 'ok' },
    warn:    { label: t('badgeWarn'),    cls: 'warn' },
    bad:     { label: t('badgeBad'),     cls: 'bad' },
    neutral: { label: t('badgeWaiting'), cls: 'neutral' },
  };
  const m = map[state] || map.neutral;
  badge.className = `profile-badge ${m.cls}`;
  badge.textContent = m.label;
  noteEl.textContent = note;

  const row = badge.closest('.profile-row');
  if(row){
    row.classList.remove('state-ok', 'state-warn', 'state-bad', 'state-neutral');
    row.classList.add(`state-${m.cls}`);
  }
}

function updateGamingProfiles(data = null){
  if(!data || typeof data !== 'object' || data.dl == null){
    setProfileRow('fps',    'neutral', t('profileFpsNote'));
    setProfileRow('voice',  'neutral', t('profileVoiceNote'));
    setProfileRow('stream', 'neutral', t('profileStreamNote'));
    return;
  }

  const dl     = Number(data.dl)     || 0;
  const ul     = Number(data.ul)     || 0;
  const ping   = Number(data.ping)   || 0;
  const jitter = Number(data.jitter) || 0;
  const loss   = Number(data.lossRate) || 0;

  // ── Competitive FPS ──────────────────────────────────────────────
  // Excellent: ping <20 ms, jitter <5 ms, no loss  →  "Tournament ready"
  // Stable:    ping <50 ms, jitter <15 ms, loss <1% → "Casual gaming OK"
  // Poor:      anything worse                        → "High latency"
  const fpsState = ping < 20 && jitter < 5  && loss === 0 ? 'ok'
                 : ping < 50 && jitter < 15 && loss < 1  ? 'warn' : 'bad';
  const fpsNote  = fpsState === 'ok'   ? `Ping\u202f${ping}\u202fms · Jitter\u202f${jitter}\u202fms — tournament ready`
                 : fpsState === 'warn' ? `Ping\u202f${ping}\u202fms · Jitter\u202f${jitter}\u202fms — casual OK`
                 :                       `Ping\u202f${ping}\u202fms · Jitter\u202f${jitter}\u202fms — high latency`;
  setProfileRow('fps', fpsState, fpsNote);

  // ── Voice / Video Chat ───────────────────────────────────────────
  // Excellent: UL ≥1.5 Mbps, jitter <15 ms  →  "Crystal clear"
  // Stable:    UL ≥0.5 Mbps, jitter <30 ms  →  "Usable"
  const voiceState = ul >= 1.5 && jitter < 15 ? 'ok'
                   : ul >= 0.5 && jitter < 30 ? 'warn' : 'bad';
  const voiceNote  = voiceState === 'ok'   ? `UL\u202f${ul.toFixed(1)}\u202fMbps · Jitter\u202f${jitter}\u202fms — crystal clear`
                   : voiceState === 'warn' ? `UL\u202f${ul.toFixed(1)}\u202fMbps · Jitter\u202f${jitter}\u202fms — usable`
                   :                         `UL\u202f${ul.toFixed(1)}\u202fMbps — insufficient for calls`;
  setProfileRow('voice', voiceState, voiceNote);

  // ── Stream Upload (Twitch / YouTube Live) ────────────────────────
  // Excellent: UL ≥10 Mbps, DL ≥25 Mbps  →  "1080p60 streaming capable"
  // Stable:    UL ≥4 Mbps,  DL ≥10 Mbps  →  "720p streaming OK"
  const streamState = ul >= 10 && dl >= 25 ? 'ok'
                    : ul >= 4  && dl >= 10 ? 'warn' : 'bad';
  const streamNote  = streamState === 'ok'   ? `UL\u202f${ul.toFixed(1)}\u202fMbps — 1080p60 capable`
                    : streamState === 'warn' ? `UL\u202f${ul.toFixed(1)}\u202fMbps — 720p streaming OK`
                    :                          `UL\u202f${ul.toFixed(1)}\u202fMbps — upload too low`;
  setProfileRow('stream', streamState, streamNote);
}

function initToolkitPanel(){
  refreshToolkitPanel();
  updateGamingProfiles();
  renderEliteIntelligence();

  const conn = getConnInfo();
  if(conn && typeof conn.addEventListener === 'function'){
    conn.addEventListener('change', refreshToolkitPanel);
  }

  const ipBtn = document.getElementById('btn-copy-ip');
  const pingBtn = document.getElementById('btn-copy-ping');
  const traceBtn = document.getElementById('btn-copy-trace');
  const dnsBtn = document.getElementById('btn-copy-dns');
  const diagBtn = document.getElementById('btn-copy-diag');
  const reportBtn = document.getElementById('btn-copy-report');

  ipBtn?.addEventListener('click', () => {
    copyWithFeedback(document.getElementById('ip-val')?.textContent || 'N/A', ipBtn);
  });

  pingBtn?.addEventListener('click', () => {
    const cmd = getOSKind() === 'windows' ? 'ping -n 20 1.1.1.1' : 'ping -c 20 1.1.1.1';
    copyWithFeedback(cmd, pingBtn);
  });

  traceBtn?.addEventListener('click', () => {
    const os = getOSKind();
    const cmd = os === 'windows' ? 'tracert 1.1.1.1' : 'traceroute 1.1.1.1';
    copyWithFeedback(cmd, traceBtn);
  });

  dnsBtn?.addEventListener('click', () => {
    const cmd = 'nslookup amilma.ba 1.1.1.1';
    copyWithFeedback(cmd, dnsBtn);
  });

  diagBtn?.addEventListener('click', () => {
    copyWithFeedback(JSON.stringify(buildDiagSnapshot(), null, 2), diagBtn, t('btnJsonCopied'));
  });

  reportBtn?.addEventListener('click', () => {
    copyWithFeedback(JSON.stringify(buildVisitorReport(), null, 2), reportBtn, et('eliteReportCopied') || 'Report copied');
  });
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 8 ▸ PING MEASUREMENT
══════════════════════════════════════════════════════════════════════ */
const PING_PHASE_MAX_MS = 6000;

async function measurePing(n = 10){
  const samples = [];
  let losses    = 0;
  /* Hard ceiling: respect PHASE_MAX_MS even if individual probes are slow */
  const phaseDeadline = performance.now() + PING_PHASE_MAX_MS;

  for(let i = 0; i < n; i++){
    if(performance.now() >= phaseDeadline) { losses += (n - i); break; }

    const t0     = performance.now();
    const ctrl   = new AbortController();
    /* Per-probe timeout: 2 s, but never beyond the phase deadline */
    const probeMs = Math.min(2000, phaseDeadline - performance.now());
    const tid    = setTimeout(() => ctrl.abort(), probeMs);
    try {
      await fetch(`https://speed.cloudflare.com/__down?bytes=1000&r=${Math.random()}`,
        { cache:'no-store', mode:'cors', signal: ctrl.signal });
      samples.push(performance.now() - t0);
    } catch {
      losses++;
    } finally {
      clearTimeout(tid);
    }
    /* Inter-probe gap, capped at remaining budget */
    if(performance.now() + 45 < phaseDeadline) await sleep(45);
  }

  if(!samples.length) return { ping: 0, jitter: 0, lossRate: 100 };

  samples.sort((a, b) => a - b);
  const trim = samples.length > 4 ? samples.slice(2, -2) : samples;
  const avg  = trim.reduce((s, v) => s + v, 0) / trim.length;
  const jit  = Math.sqrt(trim.map(v => (v - avg) ** 2).reduce((s, v) => s + v, 0) / trim.length);
  return {
    ping:     Math.round(avg),
    jitter:   parseFloat(jit.toFixed(1)),
    lossRate: Math.round((losses / n) * 100),
  };
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 9 ▸ DOWNLOAD MEASUREMENT
   ReadableStream gives per-chunk byte counts at native OS speed —
   potentially 100s of callbacks/sec on fast connections.  A 500 ms
   rolling-average window throttles the live display so the gauge
   animation remains smooth and the number reads a stable average.
══════════════════════════════════════════════════════════════════════ */
const PHASE_MAX_MS = 9000;

async function measureDownload(onLive){
  /* Warmup — prime the TCP connection and CDN edge cache bypass */
  try {
    await fetchWithTimeout(
      `https://speed.cloudflare.com/__down?bytes=700000&r=${Math.random()}`,
      { cache:'no-store', mode:'cors' },
      3000
    );
  } catch {}

  /* 500 ms rolling-average state */
  let _rollingWindow = [];   // { t, b } samples
  let _lastEmit      = 0;
  const EMIT_INTERVAL = 500; // ms

  function _emitLive(nowMs, gotBytes, t0){
    /* Accumulate sample */
    _rollingWindow.push({ t: nowMs, b: gotBytes });
    /* Drop samples older than 500 ms */
    const cutoff = nowMs - EMIT_INTERVAL;
    while(_rollingWindow.length > 2 && _rollingWindow[0].t < cutoff)
      _rollingWindow.shift();
    /* Emit at most once per EMIT_INTERVAL */
    if(nowMs - _lastEmit < EMIT_INTERVAL) return;
    _lastEmit = nowMs;
    if(_rollingWindow.length < 2) return;
    const dt = (_rollingWindow[_rollingWindow.length-1].t - _rollingWindow[0].t) / 1000;
    const db =  _rollingWindow[_rollingWindow.length-1].b - _rollingWindow[0].b;
    if(dt <= 0 || db <= 0) return;
    const mbps = (db * 8) / (dt * 1e6);
    if(mbps > 0 && mbps < 100000) onLive(mbps);
  }

  const sizes = [
    { bytes: 1e6,   label: '1 MB'   },
    { bytes: 10e6,  label: '10 MB'  },
    { bytes: 25e6,  label: '25 MB'  },
    { bytes: 100e6, label: '100 MB' },
  ];
  const sizeResults = [];
  let totalBytes = 0, totalMs = 0;
  const phaseStart = performance.now();

  for(const sz of sizes){
    if(performance.now() - phaseStart >= PHASE_MAX_MS) break;
    const t0  = performance.now();
    let got   = 0;
    const ctrl = new AbortController();
    const remainingMs = Math.max(500, PHASE_MAX_MS - (t0 - phaseStart));
    const phaseTimer = setTimeout(() => ctrl.abort(), remainingMs);
    _rollingWindow = []; _lastEmit = 0;   // reset window per chunk file
    try {
      const resp = await fetch(
        `https://speed.cloudflare.com/__down?bytes=${sz.bytes}&r=${Math.random()}`,
        { cache:'no-store', mode:'cors', signal:ctrl.signal }
      );
      if(!resp.body || typeof resp.body.getReader !== 'function') continue;
      const reader = resp.body.getReader();
      /* Always release the reader — even if an unexpected error is thrown */
      try {
        while(true){
          if(performance.now() - phaseStart >= PHASE_MAX_MS){
            await reader.cancel().catch(() => {});
            break;
          }
          const { done, value } = await reader.read();
          if(done) break;
          /* Null-guard: spec guarantees Uint8Array but be defensive */
          got += value?.byteLength ?? value?.length ?? 0;
          const now = performance.now();
          /* Only start emitting after 300 ms warmup on this chunk */
          if(now - t0 > 300) _emitLive(now, got, t0);
        }
      } finally {
        reader.releaseLock();
      }
    } catch {
      /* Abort at the phase deadline is expected and the received bytes remain usable. */
    } finally {
      clearTimeout(phaseTimer);
    }
    const elapsed = performance.now() - t0;
    if(got > 0 && elapsed > 100)
      sizeResults.push({ label: sz.label, mbps: (got*8) / ((elapsed/1000)*1e6) });
    totalBytes += got;
    totalMs    += elapsed;
  }

  const mbps = totalMs > 0 ? (totalBytes*8) / ((totalMs/1000)*1e6) : 0;
  return { mbps, sizeResults };
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 10 ▸ UPLOAD MEASUREMENT
   XHR with 2.5 s sliding-window for live feedback.
   Falls back gracefully if abort fires before progress events.
══════════════════════════════════════════════════════════════════════ */
function makeUploadBlob(sizeBytes){
  const CHUNK = 65536;
  const chunk = new Uint8Array(CHUNK);
  crypto.getRandomValues(chunk);
  const parts = [];
  let rem = sizeBytes;
  while(rem > 0){
    const sz = Math.min(CHUNK, rem);
    parts.push(sz === CHUNK ? chunk : chunk.slice(0,sz));
    rem -= sz;
  }
  // text/plain keeps the request CORS-simple on more browsers/CDN edges (no preflight).
  return new Blob(parts, { type:'text/plain' });
}

function uploadChunk(sizeBytes, onLive, phaseStartTime, maxMs = PHASE_MAX_MS){
  return new Promise(resolve => {
    const blob    = makeUploadBlob(sizeBytes);
    const xhr     = new XMLHttpRequest();
    const t0      = performance.now();
    const samples = [];

    xhr.upload.addEventListener('progress', e => {
      if(!e.lengthComputable) return;
      if(performance.now() - phaseStartTime >= PHASE_MAX_MS || performance.now() - t0 >= maxMs){ xhr.abort(); return; }
      const now = performance.now();
      samples.push({ t: now, b: e.loaded });
      if((now - t0) < 600) return;
      const cutoff = now - 2500;
      while(samples.length > 2 && samples[0].t < cutoff) samples.shift();
      if(samples.length < 2) return;
      const wMs = samples[samples.length-1].t - samples[0].t;
      const wB  = samples[samples.length-1].b - samples[0].b;
      if(wMs < 200 || wB <= 0) return;
      const mbps = (wB*8)/((wMs/1000)*1e6);
      if(mbps > 0 && mbps < 10000) onLive(mbps);
    });

    xhr.addEventListener('load',    () => resolve({ bytes: sizeBytes, ms: performance.now()-t0 }));
    xhr.addEventListener('abort',   () => {
      const ms = performance.now()-t0;
      const lastLoaded = samples.length ? samples[samples.length-1].b : 0;
      resolve({ bytes: lastLoaded, ms: ms||1 });
    });
    xhr.addEventListener('error',   () => resolve({ bytes:0, ms:1 }));
    xhr.addEventListener('timeout', () => resolve({ bytes:0, ms:1 }));

    xhr.open('POST', `https://speed.cloudflare.com/__up?r=${Math.random()}`);
    const remainingMs = Math.max(750, PHASE_MAX_MS - (performance.now() - phaseStartTime));
    xhr.timeout = Math.max(1000, Math.min(maxMs, remainingMs) + 500);
    xhr.send(blob);
  });
}

async function uploadChunkFallback(sizeBytes, onLive, signal = null, maxMs = 5000){
  const t0   = performance.now();
  /* Own timeout so this cannot outlive the phase budget */
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), Math.max(750, maxMs));
  /* Merge with optional external signal */
  if(signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  try {
    await fetch(`https://speed.cloudflare.com/__up?r=${Math.random()}`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      body: makeUploadBlob(sizeBytes),
      signal: ctrl.signal,
    });
  } catch {
    return { bytes: 0, ms: Math.max(1, performance.now() - t0) };
  } finally {
    clearTimeout(tid);
  }
  const ms = Math.max(1, performance.now() - t0);
  const mbps = (sizeBytes * 8) / ((ms / 1000) * 1e6);
  if(mbps > 0 && mbps < 10000) onLive(mbps);
  return { bytes: sizeBytes, ms };
}

async function measureUpload(onLive){
  // Warmup (XHR first, then fetch fallback if CORS/progress path is blocked by the edge)
  let warm = await uploadChunk(512*1024, ()=>{}, performance.now(), 3000);
  if(!warm.bytes) warm = await uploadChunkFallback(512*1024, ()=>{}, null, 3000);

  const sizeDefs = [
    { bytes: 5e6,  label: '5 MB'  },
    { bytes: 20e6, label: '20 MB' },
    { bytes: 50e6, label: '50 MB' },
  ];
  const sizeResults = [];
  let totalBits = 0, totalSec = 0;
  const phaseStart = performance.now();

  for(const sz of sizeDefs){
    if(performance.now() - phaseStart >= PHASE_MAX_MS) break;

    let sample = await uploadChunk(sz.bytes, onLive, phaseStart);
    // Some browsers/CDN paths block XHR upload progress/POST CORS. Fallback still measures throughput.
    const remainingMs = PHASE_MAX_MS - (performance.now() - phaseStart);
    if(!sample.bytes && remainingMs > 750){
      sample = await uploadChunkFallback(sz.bytes, onLive, null, remainingMs);
    }

    if(sample.bytes > 0 && sample.ms > 0){
      const mbps = (sample.bytes * 8) / ((sample.ms / 1000) * 1e6);
      sizeResults.push({ label: sz.label, mbps });
      totalBits += sample.bytes * 8;
      totalSec  += sample.ms / 1000;
    }
  }

  const mbps = totalSec > 0 ? totalBits / totalSec / 1e6 : 0;
  return { mbps, sizeResults };
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 11 ▸ GRADE FUNCTION
══════════════════════════════════════════════════════════════════════ */
function grade(dl, ping, ul = 0, jitter = 0, lossRate = 0){
  const score = calculateNetworkScore({ dl, ul, ping, jitter }, lossRate);
  if(score == null) return ['D', t('gradeD')];
  if(score >= 92 && ping <= 20 && jitter <= 5  && lossRate < 1) return ['A+', t('gradeAplus')];
  if(score >= 80 && ping <= 40 && jitter <= 10 && lossRate < 1) return ['A',  t('gradeA')];
  if(score >= 68 && ping <= 60 && jitter <= 15 && lossRate < 2) return ['B+', t('gradeBplus')];
  if(score >= 52) return ['B',  t('gradeB')];
  if(score >= 35) return ['C',  t('gradeC')];
  return                  ['D',  t('gradeD')];
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 12 ▸ MAIN TEST FLOW
══════════════════════════════════════════════════════════════════════ */
let testing    = false;
let lastResult = {};

/**
 * Centralised UI teardown — ALWAYS called from the finally block of
 * startTest(), regardless of how the test ends (success, error, abort).
 * Ensures the button is NEVER left disabled / in "Testing…" state.
 */
function _restoreTestUI(btn){
  _stopRAF();
  testing = false;
  if(!btn) return;
  btn.disabled = false;
  document.getElementById('btn-dot')?.classList.remove('animating');
  const hasResult = Object.keys(lastResult).length > 0;
  document.getElementById('btn-text').textContent = hasResult ? t('btnRerun') : t('btnStart');
}

async function startTest(){
  if(testing) return;

  /* ── Everything inside try so finally ALWAYS restores the UI ──── */
  try {
    testing = true;

    // ── Reset UI ────────────────────────────────────────────────────
    resetTiles();
    document.getElementById('result-row').classList.remove('show');

    const btn = document.getElementById('start-btn');
    btn.disabled = true;
    document.getElementById('btn-dot').classList.add('animating');
    document.getElementById('btn-text').textContent = t('btnTesting');
    document.getElementById('progress-area').classList.add('show');
    setScanning(true);
    ['ping','dl','ul','done'].forEach(s => document.getElementById('ps-'+s).className='ps');

    animGaugeTo(0, 0);
    setNumImmediate(null);
    setGaugeTheme('dl');
    setPhase(t('phaseStandby') || 'Standby');
    setProg(0, '');
    if(networkBG) networkBG.setPhase('idle');
    _startRAF();


    // ── PHASE 1: PING ─────────────────────────────────────────────
    setGaugeTheme('ping');
    if(networkBG) networkBG.setPhase('ping');
    setStep('ping');
    setPhase(t('phasePing'));
    setProg(8, 'ping-phase');

    let ping = 0, jitter = 0, lossRate = 0;
    try {
      const r = await measurePing();
      ping     = r.ping     || 0;
      jitter   = r.jitter   || 0;
      lossRate = r.lossRate || 0;
    } catch {
      /* Network unreachable — keep defaults (0) and continue */
    }

    updateTile('ping',   ping,                                                   'ping-lit');
    updateTile('jitter', typeof jitter === 'number' ? jitter.toFixed(1) : jitter, 'jitter-lit');
    animNumTo(ping, false);
    animGaugeTo(Math.max(1, ping));
    doneStep('ping');
    setProg(20, '');

    // ── PHASE 2: DOWNLOAD ─────────────────────────────────────────
    setGaugeTheme('dl');
    if(networkBG) networkBG.setPhase('dl');
    setStep('dl');
    setPhase(t('phaseDl'));

    let dlSafe = 0, dlSizes = [];
    try {
      const dlResult = await measureDownload(mbps => {
        const live = Math.max(0, mbps || 0);
        animNumTo(live);
        updateTile('dl', live.toFixed(1), null);
        animGaugeTo(live);
        setProg(Math.min(20 + (Math.log10(Math.max(live, 1)) / Math.log10(1000)) * 40, 58), '');
      });
      dlSafe  = Math.max(0, dlResult.mbps  || 0);
      dlSizes = dlResult.sizeResults || [];
    } catch {
      /* Download failed — dlSafe stays 0 */
    }

    updateTile('dl', dlSafe.toFixed(1), 'dl-lit');
    animNumTo(dlSafe);
    animGaugeTo(dlSafe);
    doneStep('dl');
    setProg(62, '');

    // ── PHASE 3: UPLOAD ───────────────────────────────────────────
    setGaugeTheme('ul');
    if(networkBG) networkBG.setPhase('ul');
    setStep('ul');
    setPhase(t('phaseUl'));

    let ulSafe = 0, ulSizes = [];
    try {
      const ulResult = await measureUpload(mbps => {
        if(mbps <= 0 || mbps > 10000) return;
        animNumTo(mbps);
        updateTile('ul', mbps.toFixed(1), null);
        animGaugeTo(mbps);
        const cur = parseFloat(document.getElementById('prog-fill').style.width) || 62;
        if(cur < 95) setProg(Math.min(cur + 0.55, 95), 'ul-phase');
      });
      ulSafe  = Math.max(0, ulResult.mbps  || 0);
      ulSizes = ulResult.sizeResults || [];
    } catch {
      /* Upload failed — ulSafe stays 0 */
    }

    updateTile('ul', ulSafe.toFixed(1), 'ul-lit');
    animNumTo(ulSafe);
    animGaugeTo(ulSafe);
    doneStep('ul');
    setProg(100, '');
    doneStep('done');

    // ── FINALIZE ──────────────────────────────────────────────────
    if(networkBG) networkBG.setPhase('idle');
    setGaugeTheme('dl');
    animGaugeTo(dlSafe);
    animNumTo(dlSafe);
    setPhase(t('phaseDone'));
    setScanning(false);

    /* Flush RAF then snap gauge to exact final value */
    _stopRAF();
    setGaugeRaw(dlSafe);
    const _fnEl = document.getElementById('main-number');
    if(_fnEl) _fnEl.textContent = dlSafe >= 100 ? Math.round(dlSafe).toString() : dlSafe.toFixed(1);

    /* GSAP result reveal — bounce-in the banner */
    const resultRow = document.getElementById('result-row');
    const [g, desc] = grade(dlSafe, ping, ulSafe, jitter, lossRate);
    document.getElementById('grade-val').textContent  = g;
    document.getElementById('grade-desc').textContent = desc;
    if(HAS_GSAP){
      gsap.set(resultRow, { y: 20, opacity: 0, display:'flex' });
      gsap.to(resultRow,  { y: 0, opacity: 1, duration: 0.55, ease:'back.out(1.5)' });
    } else if(resultRow){
      resultRow.classList.add('show');
    }

    lastResult = {
      dl:           dlSafe.toFixed(1),
      ul:           ulSafe.toFixed(1),
      ping:         ping || 0,
      jitter:       (typeof jitter === 'number') ? Number(jitter).toFixed(1) : (jitter || 0),
      lossRate:     Number(lossRate) || 0,
      networkScore: calculateNetworkScore({ dl: dlSafe, ul: ulSafe, ping, jitter }, lossRate),
      grade:        g,
    };
    saveHistory(lastResult);
    updateGamingProfiles(lastResult);
    renderQualityScore(lastResult, lossRate);
    renderEliteIntelligence(lastResult, lossRate);
    renderMeasurementDetails(dlSizes, ulSizes, dlSafe, ulSafe);

  } catch(err) {
    /* Unexpected top-level error — log and recover */
    if(typeof console !== 'undefined') console.error('[Amilma speed test] Unexpected error:', err);
    setPhase('Test interrupted — please retry');
    setScanning(false);
    if(networkBG) networkBG.setPhase('idle');
  } finally {
    /* This block ALWAYS runs — button is NEVER left frozen */
    _restoreTestUI(document.getElementById('start-btn'));
  }
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 12b ▸ QUALITY SCORE + MEASUREMENT DETAILS RENDER
══════════════════════════════════════════════════════════════════════ */
function renderQualityScore(data, lossRate){
  const block = document.getElementById('quality-score-block');
  if(!block) return;

  const dl     = Number(data.dl)     || 0;
  const ul     = Number(data.ul)     || 0;
  const ping   = Number(data.ping)   || 0;
  const jitter = Number(data.jitter) || 0;
  const loss   = Number(lossRate)    || 0;

  function setQ(id, subId, q, label, sub){
    const el   = document.getElementById(id);
    const sub_ = document.getElementById(subId);
    if(el){ el.className = `quality-badge ${q}`; el.textContent = label; }
    if(sub_) sub_.textContent = sub || '';
  }

  // ── Video Streaming ──────────────────────────────────────────────
  // 4K needs ≥25 Mbps; HD ≥5 Mbps; below that: rebuffering likely
  const streamQ = dl >= 25 && loss < 2  ? 'good'
                : dl >= 5  && loss < 5  ? 'average' : 'poor';
  const streamLabel = { good:'4K Ready', average:'HD Only', poor:'Buffering' }[streamQ];
  setQ('q-stream', 'q-stream-sub', streamQ, streamLabel,
    `${dl.toFixed(1)} Mbps DL · loss ${loss}%`);

  // ── Online Gaming (competitive FPS thresholds) ───────────────────
  // Elite FPS: ping <20 ms, jitter <5 ms, 0% loss
  // Playable:  ping <60 ms, jitter <20 ms, loss <2%
  // High lag:  anything worse
  const gamingQ = ping < 20  && jitter < 5  && loss === 0 ? 'good'
                : ping < 60  && jitter < 20 && loss < 2  ? 'average' : 'poor';
  const gamingLabel = { good:'Elite FPS', average:'Playable', poor:'High Lag' }[gamingQ];
  setQ('q-gaming', 'q-gaming-sub', gamingQ, gamingLabel,
    `Ping\u202f${ping}\u202fms · Jitter\u202f${jitter}\u202fms`);

  // ── Video Chat (Discord / Teams / Zoom) ──────────────────────────
  // Crystal clear: UL ≥2 Mbps, ping ≤50 ms, jitter ≤15 ms
  // Stable:        UL ≥0.5 Mbps, ping ≤100 ms
  const vchatQ  = ul >= 2   && ping <= 50  && jitter <= 15  ? 'good'
                : ul >= 0.5 && ping <= 100                  ? 'average' : 'poor';
  const vchatLabel = { good:'Crystal Clear', average:'Stable', poor:'Choppy' }[vchatQ];
  setQ('q-vchat', 'q-vchat-sub', vchatQ, vchatLabel,
    `${ul.toFixed(1)} Mbps UL · \u202f${ping}\u202fms`);

  // ── Packet Loss ───────────────────────────────────────────────────
  const lossQ = loss === 0 ? 'good' : loss < 2 ? 'average' : 'poor';
  const lossLabel = loss === 0 ? 'Clean' : loss < 2 ? `${loss}% Low` : `${loss}% High`;
  setQ('q-loss', 'q-loss-sub', lossQ, lossLabel,
    loss === 0 ? 'No drops detected' : `~${Math.round(loss / 10)} per 100 pkts`);

  block.style.display = 'block';
}

function renderMeasurementDetails(dlSizes, ulSizes, dlAvg, ulAvg){
  const block = document.getElementById('measurement-details');
  if(!block || (!dlSizes.length && !ulSizes.length)) return;

  const maxDl = Math.max(...dlSizes.map(s => s.mbps || 0), 1);
  const maxUl = Math.max(...ulSizes.map(s => s.mbps || 0), 1);

  function buildRows(sizes, max, cls){
    if(!sizes.length) return '<div class="mdetail-empty">No data collected</div>';
    return sizes.map((s, i) => {
      const pct = Math.min(100, ((s.mbps || 0) / max) * 100);
      const val = (s.mbps || 0) >= 100
        ? Math.round(s.mbps).toLocaleString()
        : (s.mbps || 0).toFixed(1);
      return `<div class="mdetail-row" style="animation-delay:${i * 70}ms">
        <span class="mdetail-size">${s.label}</span>
        <div class="mdetail-bar-wrap"><div class="mdetail-bar-fill ${cls}" style="width:${pct.toFixed(1)}%"></div></div>
        <span class="mdetail-val">${val}&nbsp;Mbps</span>
      </div>`;
    }).join('');
  }

  const fmt = v => v == null ? '—' : ((v >= 100 ? Math.round(v).toLocaleString() : Number(v).toFixed(1)) + ' Mbps');

  const dlRowsEl = document.getElementById('mdetail-dl-rows');
  const ulRowsEl = document.getElementById('mdetail-ul-rows');
  const dlAvgEl  = document.getElementById('mdetail-dl-avg');
  const ulAvgEl  = document.getElementById('mdetail-ul-avg');

  if(dlRowsEl) dlRowsEl.innerHTML = buildRows(dlSizes, maxDl, 'dl');
  if(ulRowsEl) ulRowsEl.innerHTML = buildRows(ulSizes, maxUl, 'ul');
  if(dlAvgEl)  dlAvgEl.textContent = fmt(dlAvg);
  if(ulAvgEl)  ulAvgEl.textContent = fmt(ulAvg);

  block.style.display = 'block';
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 13 ▸ HISTORY
══════════════════════════════════════════════════════════════════════ */
function saveHistory(r){
  const key  = 'amilma_v3_soc';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift({ ...r, time: new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}) });
  if(list.length > 10) list.pop();
  localStorage.setItem(key, JSON.stringify(list));
  renderHistory();
}

function renderHistory(){
  const key  = 'amilma_v3_soc';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const block = document.getElementById('history-block');
  if(!list.length){ block.style.display='none'; return; }

  function getNum(v){
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function getScore(item){
    const direct = Number(item?.networkScore);
    if(Number.isFinite(direct) && direct > 0) return direct;
    return calculateNetworkScore({
      dl: getNum(item?.dl),
      ul: getNum(item?.ul),
      ping: getNum(item?.ping),
      jitter: getNum(item?.jitter),
    }, getNum(item?.lossRate));
  }

  function buildTrend(curr, prev){
    const cs = getScore(curr);
    const ps = prev ? getScore(prev) : null;
    if(!Number.isFinite(cs) || cs <= 0 || ps == null || !Number.isFinite(ps) || ps <= 0){
      return { label: '—', cls: 'neutral', anom: [] };
    }
    const delta = Math.round(cs - ps);
    const label = delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '■ 0';
    const cls = delta > 2 ? 'good' : delta < -2 ? 'bad' : 'neutral';

    const currDl = getNum(curr?.dl), prevDl = getNum(prev?.dl);
    const currPing = getNum(curr?.ping), prevPing = getNum(prev?.ping);
    const currLoss = getNum(curr?.lossRate);

    const anom = [];
    if(prevPing > 0 && currPing > prevPing * 1.40 && currPing >= 30) anom.push('latency spike');
    if(prevDl > 0 && currDl < prevDl * 0.70) anom.push('throughput drop');
    if(currLoss >= 2) anom.push('packet loss');

    return { label, cls, anom };
  }

  block.style.display = 'block';
  document.getElementById('history-list').innerHTML = list.map((h, idx) => {
    const trend = buildTrend(h, list[idx + 1]);
    const score = getScore(h);
    const scoreLabel = Number.isFinite(score) && score > 0 ? `${score}/100` : '—';
    const trendHtml = `<span class="h-trend ${trend.cls}">${trend.label}</span>`;
    const anomHtml = trend.anom.length ? `<span class="h-anom">${trend.anom[0]}</span>` : '';
    return `
    <div class="h-row">
      <span class="h-time">${h.time}</span>
      <span class="h-dl">↓ ${h.dl} Mbps</span>
      <span class="h-ul">↑ ${h.ul} Mbps</span>
      <span class="h-ping">${h.ping} ms</span>
      <span class="h-jitter">${h.jitter} ms</span>
      <span class="h-grade-wrap">
        <span class="h-grade">${h.grade}</span>
        <span class="h-score">${scoreLabel}</span>
        ${trendHtml}
        ${anomHtml}
      </span>
    </div>`;
  }).join('');
}

function clearHistory(){
  localStorage.removeItem('amilma_v3_soc');
  renderHistory();
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 14 ▸ COPY RESULT
══════════════════════════════════════════════════════════════════════ */
function copyResult(){
  if(!lastResult.dl) return;
  const txt =
`${t('copyHeader')}
↓ Download: ${lastResult.dl} Mbps
↑ Upload:   ${lastResult.ul} Mbps
◎ Ping:     ${lastResult.ping} ms
≈ Jitter:   ${lastResult.jitter} ms
${t('copyGrade')}     ${lastResult.grade}
Score:       ${lastResult.networkScore ?? '—'}/100
Loss:        ${lastResult.lossRate ?? 0}%
amilma.net`;

  writeClipboardText(txt).then(() => {
    const btn  = document.querySelector('.btn-share');
    if(!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>${t('btnCopied')}</span>`;
    setTimeout(() => { btn.innerHTML = orig; }, 1800);
  }).catch(() => {});
}


/* ══════════════════════════════════════════════════════════════════════
   SECTION 15 ▸ INIT
══════════════════════════════════════════════════════════════════════ */
setGaugeTheme('dl');
setGaugeRaw(0);
initToolkitPanel();
renderHistory();
translate();   // apply saved / default language on boot

/* ── Global safety net — catches any promise rejection that escapes a
   specific catch block during a test (e.g. DOM exceptions, missing
   element IDs added by a future edit) and prevents a frozen UI. ──────
   Only fires the restore when a test is actually in progress so that
   unrelated third-party errors don't interfere with the normal flow. */
window.addEventListener('unhandledrejection', event => {
  if(!testing) return;
  if(typeof console !== 'undefined')
    console.error('[Amilma] Unhandled rejection during test:', event.reason);
  event.preventDefault();
  _restoreTestUI(document.getElementById('start-btn'));
  setPhase('Test interrupted — please retry');
  setScanning(false);
  if(networkBG) networkBG.setPhase('idle');
});
