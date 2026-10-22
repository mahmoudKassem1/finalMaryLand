import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, BadgeCheck, CalendarDays, ChevronRight, CircleHelp,
  ClipboardList, Database, Fingerprint, LockKeyhole, MapPin, ShieldCheck, Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const CONTACT_NUMBERS = ['+201000686866', '+201000076890', '+201033520476'];

const policy = {
  en: {
    eyebrow: 'YOUR PRIVACY MATTERS', title: 'Privacy policy', intro: 'This policy explains how Maryland Pharmacy collects, uses, and protects information when you use our website or mobile app and related services.', updated: 'Last updated October 22, 2026', owner: 'Maryland Pharmacy · Alexandria, Egypt',
    summaryTitle: 'The short version', summary: 'We use the information you provide to create and manage your account, handle orders, arrange delivery, and help you when you contact us. We do not sell your personal information.',
    sections: [
      { icon: ClipboardList, title: 'Information we collect', paragraphs: ['Account information you submit, such as your name, email address, phone number, and password. Passwords are handled by our service for account authentication.', 'Delivery and order information, such as your address, apartment details, phone number, selected products, quantities, and order notes.', 'Information you send when you contact us, and basic technical information needed to deliver and secure the service, such as request and device or browser details.'] },
      { icon: Database, title: 'How we use information', paragraphs: ['We use this information to create and secure accounts, verify email addresses, process and deliver orders, provide order support, respond to questions, and maintain the service.', 'We may use information to meet legal obligations, resolve disputes, prevent fraud or misuse, and protect our customers and business. We do not use account or order information to make medical diagnoses.'] },
      { icon: Fingerprint, title: 'Health and sensitive information', paragraphs: ['Please do not send medical records, prescriptions, or other sensitive health information through general contact forms or order notes unless it is necessary for your request. Information about products you order may reveal health-related interests, so we handle order details only for service, support, and legal purposes.'] },
      { icon: ArrowUpRight, title: 'Sharing and service providers', paragraphs: ['We share information only as needed to operate the service: with providers that host or maintain our systems, deliver account or order emails, and support delivery or payment options you choose; with pharmacy staff who fulfill and support orders; or when disclosure is required by law or needed to protect rights and safety.', 'When you follow an external payment link or contact us through a third-party service such as WhatsApp, that provider handles information under its own privacy policy. We do not receive or store payment card details through those links.'] },
      { icon: LockKeyhole, title: 'Storage, security, and retention', paragraphs: ['Account and order records are stored in systems used to operate the service. We use reasonable technical and organizational safeguards to protect information; no internet transmission or storage method can be guaranteed completely secure.', 'We keep information for as long as needed to provide the service, maintain order records, resolve issues, and meet legal or accounting requirements. We then delete it or take steps to remove identifying details where practical.'] },
      { icon: Trash2, title: 'Your choices and account deletion', paragraphs: ['You can request access to, correction of, or deletion of your account information by contacting us. To request account deletion, message us on WhatsApp using one of the numbers below and include the email address or phone number on your account. We may ask you to verify your identity.', 'We will delete or anonymize account information when we can, subject to records we must retain for legal, security, or order-related reasons. You can also sign out and remove saved site data from your browser or device.'] },
      { icon: BadgeCheck, title: 'Children and changes', paragraphs: ['Our services are intended for adults making pharmacy purchases. If you believe a child has provided personal information, contact us so we can review it.', 'We may update this policy as the service changes. We will publish the current version on this page and update the date above.'] },
    ],
    contactTitle: 'Questions or a privacy request?', contactText: 'Contact Maryland Pharmacy in Alexandria, Egypt. For account deletion, WhatsApp is the quickest way to reach us.', contact: 'Contact us', help: 'You can also call us', back: 'Back to shopping', home: 'Home', count: 'sections',
  },
  ar: {
    eyebrow: 'خصوصيتك تهمنا', title: 'سياسة الخصوصية', intro: 'توضح هذه السياسة كيفية جمع صيدلية ماريلاند للمعلومات واستخدامها وحمايتها عند استخدام الموقع أو تطبيق الهاتف والخدمات المرتبطة بهما.', updated: 'آخر تحديث: ٢٢ أكتوبر ٢٠٢٦', owner: 'صيدلية ماريلاند · الإسكندرية، مصر',
    summaryTitle: 'باختصار', summary: 'نستخدم المعلومات التي تقدمها لإنشاء حسابك وإدارته، وتجهيز الطلبات وتوصيلها، ومساعدتك عند التواصل معنا. لا نبيع معلوماتك الشخصية.',
    sections: [
      { icon: ClipboardList, title: 'المعلومات التي نجمعها', paragraphs: ['معلومات الحساب التي تقدمها، مثل الاسم والبريد الإلكتروني ورقم الهاتف وكلمة المرور. تُستخدم كلمة المرور للمصادقة على الحساب.', 'معلومات الطلب والتوصيل، مثل العنوان ورقم الشقة والهاتف والمنتجات والكميات وملاحظات الطلب.', 'المعلومات التي ترسلها عند التواصل معنا، وبعض المعلومات التقنية اللازمة لتشغيل الخدمة وحمايتها، مثل تفاصيل الطلب والجهاز أو المتصفح.'] },
      { icon: Database, title: 'كيف نستخدم المعلومات', paragraphs: ['نستخدم المعلومات لإنشاء الحسابات وحمايتها والتحقق من البريد الإلكتروني وتجهيز الطلبات وتوصيلها وتقديم الدعم والرد على الأسئلة وصيانة الخدمة.', 'قد نستخدمها للامتثال للالتزامات القانونية وحل النزاعات ومنع الاحتيال أو إساءة الاستخدام وحماية عملائنا ونشاطنا. لا نستخدم معلومات الحساب أو الطلب لتقديم تشخيص طبي.'] },
      { icon: Fingerprint, title: 'المعلومات الصحية والحساسة', paragraphs: ['يرجى عدم إرسال السجلات الطبية أو الوصفات أو غيرها من المعلومات الصحية الحساسة عبر نماذج التواصل العامة أو ملاحظات الطلب إلا إذا كانت ضرورية لطلبك. قد تكشف المنتجات المطلوبة عن اهتمامات صحية، لذلك نتعامل مع تفاصيل الطلب لأغراض الخدمة والدعم والمتطلبات القانونية فقط.'] },
      { icon: ArrowUpRight, title: 'مشاركة المعلومات ومقدمو الخدمات', paragraphs: ['نشارك المعلومات بالقدر اللازم لتشغيل الخدمة: مع مزودي استضافة وصيانة الأنظمة وإرسال رسائل الحساب والطلبات ودعم خيارات التوصيل أو الدفع التي تختارها؛ ومع موظفي الصيدلية لتجهيز الطلبات ودعمها؛ أو عند طلب القانون أو لحماية الحقوق والسلامة.', 'عند الانتقال إلى رابط دفع خارجي أو التواصل معنا عبر خدمة مثل واتساب، يتعامل مزود الخدمة مع معلوماتك وفق سياسة الخصوصية الخاصة به. لا نستقبل أو نخزن بيانات بطاقات الدفع عبر هذه الروابط.'] },
      { icon: LockKeyhole, title: 'التخزين والأمان والاحتفاظ', paragraphs: ['تُخزّن بيانات الحساب والطلبات في أنظمة تشغيل الخدمة. نستخدم تدابير تقنية وتنظيمية معقولة للحماية، لكن لا يمكن ضمان أمان أي نقل أو تخزين عبر الإنترنت بشكل كامل.', 'نحتفظ بالمعلومات للمدة اللازمة لتقديم الخدمة وحفظ سجلات الطلبات وحل المشكلات والوفاء بالمتطلبات القانونية أو المحاسبية. بعد ذلك نحذفها أو نزيل ما يحدد الهوية متى أمكن.'] },
      { icon: Trash2, title: 'خياراتك وحذف الحساب', paragraphs: ['يمكنك طلب الاطلاع على معلومات حسابك أو تصحيحها أو حذفها بالتواصل معنا. لطلب حذف الحساب، أرسل رسالة واتساب إلى أحد الأرقام أدناه واذكر البريد الإلكتروني أو رقم الهاتف المرتبط بالحساب. قد نطلب التحقق من هويتك.', 'سنحذف معلومات الحساب أو نزيل ما يحدد الهوية متى أمكن، مع مراعاة السجلات التي يجب الاحتفاظ بها لأسباب قانونية أو أمنية أو متعلقة بالطلبات. ويمكنك تسجيل الخروج وحذف بيانات الموقع المحفوظة من المتصفح أو الجهاز.'] },
      { icon: BadgeCheck, title: 'الأطفال والتغييرات', paragraphs: ['خدماتنا مخصصة للبالغين الذين يجرون مشتريات صيدلانية. إذا اعتقدت أن طفلاً قدم معلومات شخصية، تواصل معنا لمراجعتها.', 'قد نحدّث هذه السياسة عند تغيير الخدمة. سننشر النسخة الحالية في هذه الصفحة ونحدّث التاريخ أعلاه.'] },
    ],
    contactTitle: 'هل لديك سؤال أو طلب متعلق بالخصوصية؟', contactText: 'تواصل مع صيدلية ماريلاند في الإسكندرية، مصر. واتساب هو أسرع طريقة لطلب حذف الحساب.', contact: 'تواصل معنا', help: 'يمكنك الاتصال بنا أيضًا', back: 'العودة للتسوق', home: 'الرئيسية', count: 'أقسام',
  },
};

function PolicySection({ section, index, total, countLabel }) {
  const Icon = section.icon;
  return (
    <section id={`privacy-${index + 1}`} className="scroll-mt-28 border-b border-slate-100 py-8 last:border-0 sm:py-10">
      <div className="flex items-start gap-4 sm:gap-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#DC2626] sm:h-12 sm:w-12"><Icon size={21} strokeWidth={1.8} /></span>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"><span>{String(index + 1).padStart(2, '0')}</span><span className="h-px w-5 bg-slate-200" /><span>{total} {countLabel}</span></div>
          <h2 className="mb-3 text-lg font-black tracking-tight text-[#0F172A] sm:text-xl">{section.title}</h2>
          <div className="space-y-3 text-sm leading-7 text-slate-600 sm:text-[15px]">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        </div>
      </div>
    </section>
  );
}

export default function Privacy() {
  const { lang } = useApp();
  const isArabic = lang === 'ar';
  const content = isArabic ? policy.ar : policy.en;

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="mx-auto max-w-5xl pb-12 text-start sm:pb-20">
      <div className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 sm:mb-8">
        <Link to="/" className="transition-colors hover:text-[#DC2626]">{content.home}</Link><ChevronRight size={14} className={isArabic ? 'rotate-180' : ''} /><span className="text-[#0F172A]">{content.title}</span>
      </div>

      <header className="relative mb-7 overflow-hidden rounded-[2rem] bg-[#0F172A] px-6 py-9 text-white shadow-xl shadow-slate-900/10 sm:mb-10 sm:px-12 sm:py-14">
        <div aria-hidden="true" className="absolute -end-20 -top-32 h-72 w-72 rounded-full border-[36px] border-white/[0.04]" />
        <div aria-hidden="true" className="absolute -bottom-32 start-1/3 h-64 w-64 rounded-full bg-[#DC2626]/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-red-200 sm:text-xs"><ShieldCheck size={14} />{content.eyebrow}</div>
          <h1 className="mb-4 text-3xl font-black tracking-tight sm:text-5xl">{content.title}</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">{content.intro}</p>
          <div className="mt-7 flex flex-col gap-3 text-xs font-semibold text-slate-300 sm:flex-row sm:items-center sm:gap-6"><span className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-red-300" />{content.updated}</span><span className="inline-flex items-center gap-2"><MapPin size={15} className="text-red-300" />{content.owner}</span></div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <article className="rounded-[1.75rem] border border-slate-100 bg-white px-5 shadow-sm sm:px-9">
          <div className="my-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 sm:my-8 sm:p-6"><div className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-900"><ShieldCheck size={18} />{content.summaryTitle}</div><p className="text-sm leading-7 text-emerald-900/75">{content.summary}</p></div>
          {content.sections.map((section, index) => <PolicySection key={section.title} section={section} index={index} total={content.sections.length} countLabel={content.count} />)}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-[#DC2626]"><CircleHelp size={21} /></div>
            <h2 className="mb-2 text-lg font-black text-[#0F172A]">{content.contactTitle}</h2><p className="mb-5 text-sm leading-6 text-slate-500">{content.contactText}</p>
            <div className="space-y-2">{CONTACT_NUMBERS.map((number) => <a key={number} href={`https://wa.me/${number.replace('+', '')}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"><span>{number}</span><ArrowUpRight size={15} /></a>)}</div>
            <p className="mb-2 mt-5 text-xs font-bold text-slate-400">{content.help}</p><a href="tel:+2035408605" className="text-sm font-bold text-[#DC2626]">03 5408605</a>
          </div>
          <Link to="/" className="flex min-h-12 items-center justify-center rounded-2xl bg-[#DC2626] px-5 text-sm font-black text-white shadow-lg shadow-red-600/15 transition hover:bg-red-700">{content.back}</Link>
        </aside>
      </div>
    </div>
  );
}
