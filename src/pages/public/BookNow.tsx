import { useState, useContext, FormEvent } from 'react';
import LanguageContext from '../../context/LanguageContext';
import {
  User, Phone, Mail, ChevronRight, ChevronLeft, CheckCircle2,
  Camera, Image as ImageIcon, CreditCard, FileText, Printer, Calendar, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const services = [
  { value: 'wedding', icon: Camera, labelEn: 'Wedding Shoot', labelHi: 'वेडिंग शूट', descEn: 'Capture your big day', descHi: 'अपनी शादी के पलों को संजोएं' },
  { value: 'birthday', icon: User, labelEn: 'Birthday Shoot', labelHi: 'बर्थडे शूट', descEn: 'Memories of your special day', descHi: 'जन्मदिन की खास यादें' },
  { value: 'prewedding', icon: ImageIcon, labelEn: 'Pre-wedding', labelHi: 'प्री-वेडिंग', descEn: 'Romantic pre-wedding portraits', descHi: 'रोमांटिक प्री-वेडिंग शूट' },
  { value: 'pan', icon: CreditCard, labelEn: 'PAN Card', labelHi: 'PAN कार्ड', descEn: 'Apply or update PAN', descHi: 'नया पैन या अपडेट' },
  { value: 'aadhaar', icon: FileText, labelEn: 'Aadhaar Update', labelHi: 'आधार अपडेट', descEn: 'Demographic updates', descHi: 'आधार में सुधार' },
  { value: 'print', icon: Printer, labelEn: 'Photo Print', labelHi: 'फोटो प्रिंट', descEn: 'High quality prints', descHi: 'उच्च गुणवत्ता वाले प्रिंट' }
];

const timeSlots = ['10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'];

const variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const BookNow = () => {
  const { lang } = useContext(LanguageContext);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    date: '',
    time: '',
    message: ''
  });

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (isStepValid()) {
      setStep(s => Math.min(s + 1, 5));
    }
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const isStepValid = () => {
    if (step === 1) return formData.name.trim() !== '' && formData.phone.trim() !== '';
    if (step === 2) return formData.service !== '';
    if (step === 3) return formData.date !== '' && formData.time !== '';
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Booking submitted:', formData);
    setSubmitted(true);
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-12">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step === s
                ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.6)] scale-110'
                : step > s
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-white/5 text-gray-500 border border-white/10'
                }`}
            >
              {step > s ? <CheckCircle2 size={20} /> : s}
            </div>
            {s < 5 && (
              <div className={`w-10 sm:w-16 h-1 mx-2 rounded-full transition-colors duration-300 ${step > s ? 'bg-indigo-500/50' : 'bg-white/10'}`}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{lang === 'hi' ? 'आपकी जानकारी' : 'Personal Details'}</h2>
              <p className="text-gray-400">{lang === 'hi' ? 'कृपया अपनी संपर्क जानकारी भरें' : 'Please provide your contact information'}</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-300 mb-1.5"><User className="w-4 h-4 mr-2 text-indigo-400" /> {lang === 'hi' ? 'पूरा नाम' : 'Full Name'}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder={lang === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-300 mb-1.5"><Phone className="w-4 h-4 mr-2 text-indigo-400" /> {lang === 'hi' ? 'फोन नंबर' : 'Phone Number'}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder={lang === 'hi' ? 'अपना फोन नंबर दर्ज करें' : 'Enter your phone number'}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-300 mb-1.5"><Mail className="w-4 h-4 mr-2 text-indigo-400" /> {lang === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)'}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  placeholder={lang === 'hi' ? 'अपना ईमेल दर्ज करें' : 'Enter your email address'}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{lang === 'hi' ? 'सेवा चुनें' : 'Select Service'}</h2>
              <p className="text-gray-400">{lang === 'hi' ? 'आप क्या बुक करना चाहते हैं?' : 'What would you like to book?'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((srv) => {
                const Icon = srv.icon;
                const isSelected = formData.service === srv.value;
                return (
                  <button
                    key={srv.value}
                    onClick={() => updateForm('service', srv.value)}
                    className={`flex flex-col items-start p-4 rounded-xl border transition-all duration-300 text-left ${isSelected
                      ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                  >
                    <div className={`p-2 rounded-lg mb-3 ${isSelected ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/10 text-gray-400'}`}>
                      <Icon size={24} />
                    </div>
                    <h3 className={`font-semibold text-lg mb-1 ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                      {lang === 'hi' ? srv.labelHi : srv.labelEn}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {lang === 'hi' ? srv.descHi : srv.descEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{lang === 'hi' ? 'दिन और समय' : 'Date & Time'}</h2>
              <p className="text-gray-400">{lang === 'hi' ? 'अपनी सुविधा के अनुसार चुनें' : 'Choose your preferred slot'}</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-300 mb-3"><Calendar className="w-4 h-4 mr-2 text-indigo-400" /> {lang === 'hi' ? 'तारीख' : 'Select Date'}</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-300 mb-3"><Clock className="w-4 h-4 mr-2 text-indigo-400" /> {lang === 'hi' ? 'समय' : 'Select Time'}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => updateForm('time', time)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${formData.time === time
                        ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                        : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{lang === 'hi' ? 'अतिरिक्त जानकारी' : 'Additional Notes'}</h2>
              <p className="text-gray-400">{lang === 'hi' ? 'कोई विशेष requirement?' : 'Any special requirements for us?'}</p>
            </div>
            <div>
              <textarea
                value={formData.message}
                onChange={(e) => updateForm('message', e.target.value)}
                placeholder={lang === 'hi' ? 'यहाँ लिखें...' : 'Type your notes here...'}
                rows={6}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all resize-none"
              ></textarea>
            </div>
          </div>
        );
      case 5:
        const selectedService = services.find(s => s.value === formData.service);
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{lang === 'hi' ? 'समीक्षा और पुष्टि' : 'Review & Confirm'}</h2>
              <p className="text-gray-400">{lang === 'hi' ? 'कृपया सभी जानकारी जाँच लें' : 'Please check your booking details'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-gray-400">{lang === 'hi' ? 'नाम' : 'Name'}</span>
                <span className="text-white font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-gray-400">{lang === 'hi' ? 'फोन' : 'Phone'}</span>
                <span className="text-white font-medium">{formData.phone}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-gray-400">{lang === 'hi' ? 'सेवा' : 'Service'}</span>
                <span className="text-white font-medium">{lang === 'hi' ? selectedService?.labelHi : selectedService?.labelEn}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-gray-400">{lang === 'hi' ? 'तारीख और समय' : 'Date & Time'}</span>
                <span className="text-white font-medium">{formData.date} {formData.time && `at ${formData.time}`}</span>
              </div>
              {formData.message && (
                <div className="flex flex-col pt-2">
                  <span className="text-gray-400 mb-2">{lang === 'hi' ? 'नोट्स' : 'Notes'}</span>
                  <span className="text-white text-sm bg-black/20 p-3 rounded-lg">{formData.message}</span>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            {lang === 'hi' ? 'बुकिंग सफल!' : 'Booking Confirmed!'}
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            {lang === 'hi'
              ? 'आपकी बुकिंग सफलतापूर्वक दर्ज कर ली गई है। हमारी टीम जल्द ही आपसे संपर्क करेगी।'
              : 'Your booking has been successfully placed. Our team will contact you shortly to confirm the details.'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
          >
            {lang === 'hi' ? 'होम पर जाएँ' : 'Back to Home'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] relative overflow-hidden py-20 px-4 flex flex-col justify-center">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4 tracking-tight">
            {lang === 'hi' ? 'अपनी शूट बुक करें' : 'Book Your Shoot'}
          </h1>
          <p className="text-gray-400 text-lg">
            {lang === 'hi' ? 'प्रीमियम सेवाएं, बस कुछ कदम दूर' : 'Premium services, just a few steps away'}
          </p>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative">
          {renderStepIndicator()}

          <div className="min-h-[350px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${step === 1
                ? 'text-gray-600 cursor-not-allowed opacity-50'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
            >
              <ChevronLeft size={18} />
              {lang === 'hi' ? 'पीछे' : 'Back'}
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid()}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${!isStepValid()
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/25 hover:scale-[1.02]'
                  }`}
              >
                {lang === 'hi' ? 'आगे बढ़ें' : 'Next Step'}
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all"
              >
                {lang === 'hi' ? 'कन्फर्म करें' : 'Confirm & Book'}
                <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookNow;
