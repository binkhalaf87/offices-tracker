/**
 * كل نصوص الواجهة في مكان واحد. الأداة عربية فقط، لذا يكفي قاموس واحد.
 */
import type { OfficeStatus } from "./constants";
import type { ContactBlockReason } from "./outreach";
import { formatDate } from "./format";

export const t = {
  appName: "متتبّع مكاتب الخدمات العامة",
  nav: {
    offices: "المكاتب",
    today: "متابعات اليوم",
    collect: "جمع البيانات",
    dashboard: "اللوحة",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    menu: "القائمة الرئيسية",
  },
  counter: {
    label: "محادثات اليوم",
    reached: "بلغت الحد اليومي",
  },
  login: {
    title: "دخول",
    password: "كلمة المرور",
    submit: "دخول",
    wrong: "كلمة المرور غير صحيحة",
    notConfigured: "لم يُضبط APP_PASSWORD على الخادم",
    error: "تعذّر تسجيل الدخول",
  },
  status: {
    not_contacted: "لم يُراسَل",
    contacted: "تمت المراسلة",
    replied: "رد",
    interested: "مهتم",
    registered: "سجّل في المنصة",
    refused: "رافض",
    do_not_contact: "لا تراسل",
  } satisfies Record<OfficeStatus, string>,
  table: {
    name: "الاسم",
    city: "المدينة",
    address: "الحي/العنوان",
    rating: "التقييم",
    phone: "الجوال",
    map: "الخريطة",
    status: "الحالة",
    lastContact: "آخر تواصل",
    nextFollowup: "المتابعة التالية",
    notes: "الملاحظات",
    actions: "الإجراءات",
    reviews: (n: number) => `(${n} مراجعة)`,
    openMap: "فتح في خرائط Google",
    noPhone: "—",
    empty: "لا توجد مكاتب مطابقة. ابدأ من صفحة «جمع البيانات».",
    loading: "جارٍ التحميل…",
    loadError: "تعذّر تحميل المكاتب",
    count: (shown: number, total: number) => `${shown} من ${total} مكتب`,
    dataUpdated: (d: string) => `آخر تحديث للبيانات: ${d}`,
    staleData: "بيانات Google قديمة (أكثر من 30 يوماً) — حدّثها",
    notesPlaceholder: "أضف ملاحظة…",
    statusFor: (name: string) => `حالة ${name}`,
    notesFor: (name: string) => `ملاحظات ${name}`,
    followupFor: (name: string) => `موعد متابعة ${name}`,
    page: (p: number, total: number) => `صفحة ${p} من ${total}`,
    prev: "السابق",
    next: "التالي",
    saved: "تم الحفظ",
    saveError: "تعذّر الحفظ",
    closedTemporarily: "مغلق مؤقتاً",
  },
  filters: {
    search: "بحث بالاسم",
    searchPlaceholder: "اسم المكتب…",
    city: "المدينة",
    status: "الحالة",
    minRating: "أدنى تقييم",
    sort: "الفرز",
    all: "الكل",
    anyRating: "أي تقييم",
    ratingAtLeast: (n: number) => `${n}+ نجوم`,
    sortOptions: {
      recent: "الأحدث إضافة",
      rating_desc: "التقييم (الأعلى أولاً)",
      rating_asc: "التقييم (الأدنى أولاً)",
      reviews_desc: "عدد المراجعات (الأكثر أولاً)",
      reviews_asc: "عدد المراجعات (الأقل أولاً)",
      name: "الاسم",
    },
    exportCsv: "تصدير CSV",
  },
  whatsapp: {
    button: "مراسلة واتساب",
    followup: "متابعة واتساب",
    continue: "متابعة المحادثة",
    opening: "جارٍ الفتح…",
    popupBlocked: "منع المتصفح فتح نافذة جديدة. اسمح بالنوافذ المنبثقة لهذه الصفحة.",
    error: "تعذّر فتح المحادثة",
    opened: (name: string) => `فُتحت محادثة ${name}. أرسل الرسالة يدوياً من واتساب.`,
  },
  refresh: {
    button: "تحديث البيانات",
    label: (name: string) => `تحديث بيانات ${name} من Google`,
    done: "تم تحديث البيانات من Google",
    error: "تعذّر تحديث البيانات",
  },
  today: {
    title: "متابعات اليوم",
    description: "المكاتب التي حان (أو فات) موعد متابعتها. الإرسال يدوي دائماً.",
    empty: "لا متابعات مستحقة اليوم.",
    overdue: "متأخرة",
  },
  collect: {
    title: "جمع البيانات من Google Places",
    city: "المدينة",
    phrases: "عبارات البحث (عبارة في كل سطر)",
    resetPhrases: "استعادة العبارات الافتراضية",
    estimate: (min: number, max: number) =>
      `التقدير: من ${min} إلى ${max} طلب Text Search (حتى 3 صفحات × 20 نتيجة لكل عبارة).`,
    billingNote:
      "تُحتسب الطلبات ضمن فئة Text Search Enterprise لأننا نطلب الهاتف والتقييم. راجع حد الإنفاق اليومي في Google Cloud.",
    run: "تشغيل الجمع",
    running: "جارٍ الجمع… قد يستغرق دقيقة",
    noPhrases: "أضف عبارة بحث واحدة على الأقل",
    result: "النتيجة",
    requests: "الطلبات المنفّذة",
    fetched: "نتائج مستلمة",
    unique: "مكاتب فريدة",
    created: "مكاتب جديدة",
    updated: "مكاتب محدّثة",
    skippedClosed: "مغلقة نهائياً (تم تجاهلها)",
    errors: "أخطاء",
    error: "فشل الجمع",
  },
  dashboard: {
    title: "لوحة مختصرة",
    city: "المدينة",
    total: "إجمالي المكاتب",
    contacted: "تمت مراسلتهم",
    replied: "ردّوا",
    interested: "مهتمون",
    registered: "سجّلوا",
    replyRate: "نسبة الرد",
    registerRate: "نسبة التسجيل",
    all: "الإجمالي",
    empty: "لا توجد بيانات بعد.",
    note: "«ردّوا» تشمل كل من ردّ (رد، مهتم، سجّل، رافض). النسب محسوبة من عدد من تمت مراسلتهم.",
  },
  settings: {
    title: "الإعدادات",
    template: "قالب رسالة واتساب",
    templateHelp: "المتغيرات المتاحة: {اسم_المكتب} و{المدينة}. استبدل [اسمك] باسمك.",
    preview: "معاينة",
    previewOffice: "مكتب الإنجاز للخدمات العامة",
    dailyLimit: "الحد اليومي للمحادثات",
    dailyLimitHelp: "عند بلوغه يتعطل زر واتساب حتى منتصف الليل بتوقيت الرياض.",
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    saved: "تم حفظ الإعدادات",
    error: "تعذّر حفظ الإعدادات",
    resetTemplate: "استعادة القالب الافتراضي",
    safetyTitle: "ضوابط الأمان",
    safety: [
      "لا يوجد إرسال آلي أو جماعي أو مجدول: كل رسالة تُرسَل يدوياً من واتساب.",
      "رسالة أولى ثم متابعة واحدة فقط بعد يومين، ولا متابعة ثانية.",
      "الزر معطّل للحالات: رافض، لا تراسل، سجّل في المنصة.",
    ],
  },
  common: {
    close: "إغلاق",
    unexpected: "حدث خطأ غير متوقع",
  },
} as const;

const PHONE_REASONS = {
  missing: "لا يوجد رقم هاتف",
  landline: "الرقم أرضي أو موحّد وليس جوالاً",
  foreign: "الرقم ليس سعودياً",
  invalid: "رقم الجوال غير صالح (يجب 9665 + 8 أرقام)",
} as const;

export function blockReasonText(block: ContactBlockReason): string {
  switch (block.kind) {
    case "status":
      return `الحالة «${t.status[block.status]}» لا تسمح بالمراسلة`;
    case "phone":
      return PHONE_REASONS[block.reason];
    case "followup_used":
      return "أُرسلت المتابعة الوحيدة المسموحة؛ لا متابعة ثانية";
    case "followup_not_due":
      return `موعد المتابعة لم يحن بعد (${formatDate(block.dueAt)})`;
    case "daily_limit":
      return `بلغت الحد اليومي (${block.limit} محادثة). يعود الزر غداً.`;
  }
}

export const apiErrors = {
  unauthorized: "غير مصرّح",
  badRequest: "طلب غير صالح",
  notFound: "المكتب غير موجود",
  noApiKey: "لم يُضبط GOOGLE_PLACES_API_KEY على الخادم",
  badCity: "مدينة غير معروفة",
  tooManyPhrases: "عدد عبارات البحث كبير جداً (الحد 10)",
  googleError: (status: number, msg: string) => `خطأ من Google (${status}): ${msg}`,
  placeGone: "لم يعد هذا المكان موجوداً في Google",
  badTemplate: "القالب فارغ أو طويل جداً",
  badLimit: "الحد اليومي يجب أن يكون رقماً صحيحاً بين 1 و200",
  crossOrigin: "طلب من مصدر غير مسموح",
} as const;
