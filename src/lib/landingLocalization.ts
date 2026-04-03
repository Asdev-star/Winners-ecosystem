export type LandingLocale = "en" | "ar" | "fr" | "es" | "de" | "zh" | "ja" | "pt";

type LocalePack = {
  nav?: {
    ctaText?: string;
    statusText?: string;
  };
  hero?: {
    eyebrow?: string;
    subtitle?: string;
    description?: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
  };
  trustedBy?: {
    label?: string;
  };
  ecosystemBand?: {
    label?: string;
    title?: string;
    titleHighlight?: string;
    description?: string;
  };
  cta?: {
    title?: string;
    titleHighlight?: string;
    subtitle?: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
    tagline?: string;
  };
  footer?: {
    tagline?: string;
  };
};

const PACKS: Record<LandingLocale, LocalePack> = {
  en: {},
  ar: {
    nav: { ctaText: "ادخل →", statusText: "النواة المباشرة" },
    hero: {
      eyebrow: "بنية سيادية رقمية · مدعومة بالذكاء الاصطناعي",
      subtitle: "منصة موحدة للمبدعين ورواد الأعمال الرقميين",
      description:
        "يجمع Winners Ecosystem بين المجتمع والأكاديمية والسوق والعمل والذكاء الاصطناعي في منصة واحدة قوية. تفاعل وتعلم وبِع واعمل ونمِّ نشاطك من حساب واحد مع فواتير موحدة ورؤى ذكية.",
      ctaPrimary: "ابدأ مجانًا",
      ctaSecondary: "كيف يعمل النظام؟",
    },
    trustedBy: { label: "موثوق به من قبل شركات رائدة حول العالم" },
    ecosystemBand: {
      label: "الفكرة الأساسية",
      title: "ليس موقعًا. ليس SaaS.",
      titleHighlight: "إنه نظام تشغيل رقمي.",
      description:
        "Winners Ecosystem هو بنية تحتية رقمية. كل طبقة تعمل على نفس العقل. حساب واحد، نظام فوترة واحد، وذكاء اصطناعي واحد يربط الجميع معًا.",
    },
    cta: {
      title: "ابنِ. تعلّم. اربح.",
      titleHighlight: "اربح.",
      subtitle: "ابدأ اليوم وادخل إلى النظام الرقمي السيادي.",
      ctaPrimary: "ابدأ الآن",
      ctaSecondary: "استكشف المنصة",
      tagline: "بنية واحدة. فرصة أكبر.",
    },
    footer: { tagline: "البنية الرقمية السيادية للمبدعين ورواد الأعمال." },
  },
  fr: {
    nav: { ctaText: "Entrer →", statusText: "Noyau en direct" },
    hero: {
      eyebrow: "Infrastructure numérique souveraine · Propulsée par l'IA",
      subtitle: "La plateforme unifiée pour les créateurs et entrepreneurs numériques",
      description:
        "Winners Ecosystem rassemble la communauté, l'académie, le marché, le travail et l'intelligence artificielle dans une seule plateforme puissante. Apprenez, vendez, travaillez et développez votre activité depuis un seul compte.",
      ctaPrimary: "Commencer gratuitement",
      ctaSecondary: "Voir le fonctionnement",
    },
    trustedBy: { label: "Approuvé par des entreprises leaders dans le monde" },
    ecosystemBand: {
      label: "Le concept central",
      title: "Pas un site. Pas un SaaS.",
      titleHighlight: "Un système d'exploitation numérique.",
      description:
        "Winners Ecosystem est une infrastructure. Chaque couche partage le même cerveau, le même compte et la même intelligence centrale.",
    },
    cta: {
      title: "Construire. Apprendre. Gagner.",
      titleHighlight: "Gagner.",
      subtitle: "Rejoignez l'écosystème aujourd'hui.",
      ctaPrimary: "Commencer",
      ctaSecondary: "Découvrir",
      tagline: "Une seule plateforme pour tout faire.",
    },
    footer: { tagline: "Infrastructure numérique souveraine pour créateurs et équipes." },
  },
  es: {
    nav: { ctaText: "Entrar →", statusText: "Núcleo en vivo" },
    hero: {
      eyebrow: "Infraestructura digital soberana · Impulsada por IA",
      subtitle: "La plataforma unificada para creadores y emprendedores digitales",
      description:
        "Winners Ecosystem une comunidad, academia, mercado, trabajo e inteligencia artificial en una sola plataforma potente. Aprende, vende, trabaja y haz crecer tu negocio desde una sola cuenta.",
      ctaPrimary: "Empezar gratis",
      ctaSecondary: "Ver cómo funciona",
    },
    trustedBy: { label: "Con la confianza de empresas líderes en todo el mundo" },
    ecosystemBand: {
      label: "El concepto central",
      title: "No es un sitio. No es un SaaS.",
      titleHighlight: "Es un sistema operativo digital.",
      description:
        "Winners Ecosystem es infraestructura. Cada capa comparte el mismo núcleo, la misma cuenta y la misma inteligencia central.",
    },
    cta: {
      title: "Construye. Aprende. Gana.",
      titleHighlight: "Gana.",
      subtitle: "Únete al ecosistema hoy mismo.",
      ctaPrimary: "Empezar ahora",
      ctaSecondary: "Explorar",
      tagline: "Una sola plataforma para crecer.",
    },
    footer: { tagline: "Infraestructura digital soberana para creadores y equipos." },
  },
  de: {
    nav: { ctaText: "Eintreten →", statusText: "Kern live" },
    hero: {
      eyebrow: "Digitale Souveränitätsinfrastruktur · KI-gestützt",
      subtitle: "Die einheitliche Plattform für Kreative und digitale Unternehmer",
      description:
        "Winners Ecosystem vereint Community, Academy, Market, Work und KI-Intelligenz in einer einzigen leistungsstarken Plattform. Lernen, verkaufen, arbeiten und wachsen Sie mit einem Konto.",
      ctaPrimary: "Kostenlos starten",
      ctaSecondary: "So funktioniert es",
    },
    trustedBy: { label: "Vertraut von führenden Unternehmen weltweit" },
    ecosystemBand: {
      label: "Das Kernkonzept",
      title: "Keine Website. Kein SaaS.",
      titleHighlight: "Ein digitales Betriebssystem.",
      description:
        "Winners Ecosystem ist Infrastruktur. Jede Ebene teilt denselben Kern, dasselbe Konto und dieselbe Intelligenz.",
    },
    cta: {
      title: "Bauen. Lernen. Verdienen.",
      titleHighlight: "Verdienen.",
      subtitle: "Werden Sie heute Teil des Ökosystems.",
      ctaPrimary: "Jetzt starten",
      ctaSecondary: "Entdecken",
      tagline: "Eine Plattform, alle Wege.",
    },
    footer: { tagline: "Digitale Souveränitätsinfrastruktur für Creator und Teams." },
  },
  zh: {
    nav: { ctaText: "进入 →", statusText: "核心在线" },
    hero: {
      eyebrow: "数字主权基础设施 · AI 驱动",
      subtitle: "为创作者和数字创业者打造的一体化平台",
      description:
        "Winners Ecosystem 将社区、学院、市场、工作和人工智能整合到一个强大的平台中。一个账号即可学习、交易、协作并成长。",
      ctaPrimary: "免费开始",
      ctaSecondary: "了解如何运作",
    },
    trustedBy: { label: "深受全球领先企业信赖" },
    ecosystemBand: {
      label: "核心概念",
      title: "不是网站，不是 SaaS。",
      titleHighlight: "而是一套数字操作系统。",
      description:
        "Winners Ecosystem 是基础设施。每一层共享同一个核心、同一个账号和同一个智能大脑。",
    },
    cta: {
      title: "构建。学习。赚钱。",
      titleHighlight: "赚钱。",
      subtitle: "立即加入生态系统。",
      ctaPrimary: "立即开始",
      ctaSecondary: "查看平台",
      tagline: "一个平台，更多可能。",
    },
    footer: { tagline: "面向创作者和团队的数字主权基础设施。" },
  },
  ja: {
    nav: { ctaText: "入る →", statusText: "コア稼働中" },
    hero: {
      eyebrow: "デジタル主権インフラ · AI 搭載",
      subtitle: "クリエイターとデジタル起業家のための統合プラットフォーム",
      description:
        "Winners Ecosystem は、コミュニティ、アカデミー、市場、仕事、AI を 1 つの強力なプラットフォームに統合します。1つのアカウントで学び、売り、働き、成長できます。",
      ctaPrimary: "無料で始める",
      ctaSecondary: "仕組みを見る",
    },
    trustedBy: { label: "世界の主要企業に信頼されています" },
    ecosystemBand: {
      label: "コアコンセプト",
      title: "サイトではない。SaaS でもない。",
      titleHighlight: "デジタル OS です。",
      description:
        "Winners Ecosystem はインフラです。すべての層が同じコア、同じアカウント、同じ知能を共有します。",
    },
    cta: {
      title: "作る。学ぶ。稼ぐ。",
      titleHighlight: "稼ぐ。",
      subtitle: "今日からエコシステムに参加しましょう。",
      ctaPrimary: "今すぐ始める",
      ctaSecondary: "詳しく見る",
      tagline: "ひとつの基盤、広がる可能性。",
    },
    footer: { tagline: "クリエイターとチームのためのデジタル主権インフラ。" },
  },
  pt: {
    nav: { ctaText: "Entrar →", statusText: "Núcleo ao vivo" },
    hero: {
      eyebrow: "Infraestrutura digital soberana · Impulsionada por IA",
      subtitle: "A plataforma unificada para criadores e empreendedores digitais",
      description:
        "O Winners Ecosystem reúne comunidade, academia, mercado, trabalho e inteligência artificial em uma única plataforma poderosa. Aprenda, venda, trabalhe e cresça com uma única conta.",
      ctaPrimary: "Começar grátis",
      ctaSecondary: "Ver como funciona",
    },
    trustedBy: { label: "Confiado por empresas líderes em todo o mundo" },
    ecosystemBand: {
      label: "O conceito central",
      title: "Não é um site. Não é um SaaS.",
      titleHighlight: "É um sistema operacional digital.",
      description:
        "O Winners Ecosystem é infraestrutura. Cada camada compartilha o mesmo núcleo, a mesma conta e a mesma inteligência central.",
    },
    cta: {
      title: "Construa. Aprenda. Ganhe.",
      titleHighlight: "Ganhe.",
      subtitle: "Entre no ecossistema hoje mesmo.",
      ctaPrimary: "Começar agora",
      ctaSecondary: "Explorar",
      tagline: "Uma plataforma para todas as etapas.",
    },
    footer: { tagline: "Infraestrutura digital soberana para criadores e equipes." },
  },
};

export function detectBrowserCountry() {
  const locale = typeof navigator !== "undefined" ? navigator.language : "";
  const region = locale.includes("-") ? locale.split("-")[1] : "";
  return region.toUpperCase();
}

export function normalizeCountryCode(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

export function resolveLandingLocale(language: string, country: string, mapping: Array<{ country: string; language: string }>) {
  const normalizedCountry = normalizeCountryCode(country);
  const mappedLanguage = mapping.find((entry) => normalizeCountryCode(entry.country) === normalizedCountry)?.language?.trim().toLowerCase();
  const fallback = language.trim().toLowerCase();
  const candidate = mappedLanguage || fallback || "en";
  return (candidate in PACKS ? candidate : candidate.split("-")[0]) as LandingLocale;
}

export function getLandingLocalePack(language: string) {
  const code = language.toLowerCase().split("-")[0] as LandingLocale;
  return PACKS[code] ?? PACKS.en;
}

export function getLandingDirection(language: string) {
  return language.toLowerCase().startsWith("ar") ? "rtl" : "ltr";
}
