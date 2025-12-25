export type Language = 'en' | 'id';

export const translations = {
  en: {
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    loginTitle: 'Welcome Back',
    loginSubtitle: 'Sign in to continue your exam',
    registerTitle: 'Create Account',
    registerSubtitle: 'Register to take exams',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    
    // Navigation
    dashboard: 'Dashboard',
    exams: 'Exams',
    results: 'Results',
    admin: 'Admin',
    profile: 'Profile',
    
    // Exam
    startExam: 'Start Exam',
    continueExam: 'Continue Exam',
    submitExam: 'Submit Exam',
    finishSection: 'Finish Section',
    nextQuestion: 'Next',
    previousQuestion: 'Back',
    flagQuestion: 'Flag',
    unflagQuestion: 'Unflag',
    section: 'Section',
    question: 'Question',
    timeRemaining: 'Time Remaining',
    examTime: 'Exam Time',
    of: 'of',
    
    // Sections
    section1: 'Characters & Vocabulary',
    section2: 'Conversation & Expression',
    section3: 'Listening',
    section4: 'Reading',
    
    // Listening
    playAudio: 'Play Audio',
    playsRemaining: 'plays remaining',
    audioLimit: 'You can only play this audio 2 times',
    
    // Results
    examResults: 'Exam Results',
    totalScore: 'Total Score',
    sectionScore: 'Section Score',
    categoryPerformance: 'Category Performance',
    passed: 'Passed',
    failed: 'Failed',
    viewDetails: 'View Details',
    
    // Admin
    createExam: 'Create Exam',
    editExam: 'Edit Exam',
    deleteExam: 'Delete Exam',
    addQuestion: 'Add Question',
    editQuestion: 'Edit Question',
    deleteQuestion: 'Delete Question',
    exportResults: 'Export Results',
    manageUsers: 'Manage Users',
    examTitle: 'Exam Title',
    description: 'Description',
    category: 'Category',
    questionType: 'Question Type',
    correctAnswer: 'Correct Answer',
    options: 'Options',
    save: 'Save',
    cancel: 'Cancel',
    
    // Messages
    examCompleted: 'Exam Completed',
    sectionLocked: 'This section is locked',
    cannotReturn: 'You cannot return to previous sections',
    confirmFinish: 'Are you sure you want to finish this section?',
    confirmSubmit: 'Are you sure you want to submit the exam?',
    alreadyAttempted: 'You have already attempted this exam',
    noExams: 'No exams available',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    
    // Language
    language: 'Language',
    english: 'English',
    indonesian: 'Indonesian',
  },
  id: {
    // Auth
    login: 'Masuk',
    register: 'Daftar',
    logout: 'Keluar',
    email: 'Email',
    password: 'Kata Sandi',
    name: 'Nama',
    confirmPassword: 'Konfirmasi Kata Sandi',
    loginTitle: 'Selamat Datang Kembali',
    loginSubtitle: 'Masuk untuk melanjutkan ujian',
    registerTitle: 'Buat Akun',
    registerSubtitle: 'Daftar untuk mengikuti ujian',
    noAccount: 'Belum punya akun?',
    hasAccount: 'Sudah punya akun?',
    
    // Navigation
    dashboard: 'Dasbor',
    exams: 'Ujian',
    results: 'Hasil',
    admin: 'Admin',
    profile: 'Profil',
    
    // Exam
    startExam: 'Mulai Ujian',
    continueExam: 'Lanjutkan Ujian',
    submitExam: 'Kirim Ujian',
    finishSection: 'Selesaikan Bagian',
    nextQuestion: 'Selanjutnya',
    previousQuestion: 'Kembali',
    flagQuestion: 'Tandai',
    unflagQuestion: 'Hapus Tanda',
    section: 'Bagian',
    question: 'Soal',
    timeRemaining: 'Waktu Tersisa',
    examTime: 'Waktu Ujian',
    of: 'dari',
    
    // Sections
    section1: 'Huruf & Kosakata',
    section2: 'Percakapan & Ekspresi',
    section3: 'Menyimak',
    section4: 'Membaca',
    
    // Listening
    playAudio: 'Putar Audio',
    playsRemaining: 'pemutaran tersisa',
    audioLimit: 'Anda hanya dapat memutar audio ini 2 kali',
    
    // Results
    examResults: 'Hasil Ujian',
    totalScore: 'Skor Total',
    sectionScore: 'Skor Bagian',
    categoryPerformance: 'Performa Kategori',
    passed: 'Lulus',
    failed: 'Tidak Lulus',
    viewDetails: 'Lihat Detail',
    
    // Admin
    createExam: 'Buat Ujian',
    editExam: 'Edit Ujian',
    deleteExam: 'Hapus Ujian',
    addQuestion: 'Tambah Soal',
    editQuestion: 'Edit Soal',
    deleteQuestion: 'Hapus Soal',
    exportResults: 'Ekspor Hasil',
    manageUsers: 'Kelola Pengguna',
    examTitle: 'Judul Ujian',
    description: 'Deskripsi',
    category: 'Kategori',
    questionType: 'Tipe Soal',
    correctAnswer: 'Jawaban Benar',
    options: 'Pilihan',
    save: 'Simpan',
    cancel: 'Batal',
    
    // Messages
    examCompleted: 'Ujian Selesai',
    sectionLocked: 'Bagian ini terkunci',
    cannotReturn: 'Anda tidak dapat kembali ke bagian sebelumnya',
    confirmFinish: 'Apakah Anda yakin ingin menyelesaikan bagian ini?',
    confirmSubmit: 'Apakah Anda yakin ingin mengirim ujian?',
    alreadyAttempted: 'Anda sudah mengikuti ujian ini',
    noExams: 'Tidak ada ujian tersedia',
    loading: 'Memuat...',
    error: 'Terjadi kesalahan',
    success: 'Berhasil',
    
    // Language
    language: 'Bahasa',
    english: 'Inggris',
    indonesian: 'Indonesia',
  },
};

export const useTranslation = (lang: Language) => {
  return (key: keyof typeof translations.en): string => {
    return translations[lang][key] || key;
  };
};

export const getSectionTitle = (sectionNumber: number, lang: Language): string => {
  const sectionTitles: Record<number, { en: string; id: string; jp: string }> = {
    1: { en: 'Characters & Vocabulary', id: 'Huruf & Kosakata', jp: '文字と語彙' },
    2: { en: 'Conversation & Expression', id: 'Percakapan & Ekspresi', jp: '会話と表現' },
    3: { en: 'Listening', id: 'Menyimak', jp: '聴解' },
    4: { en: 'Reading', id: 'Membaca', jp: '読解' },
  };
  
  const section = sectionTitles[sectionNumber];
  if (!section) return `Section ${sectionNumber}`;
  
  return `${section.jp} (${section[lang]})`;
};
