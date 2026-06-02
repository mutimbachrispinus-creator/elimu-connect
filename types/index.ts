// ─────────────────────────────────────────────────────────────────────────────
//  ElimuConnect – Central Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'superadmin' | 'teacher' | 'student' | 'parent';

export type Curriculum =
  | 'CBC'         // Kenya – Competency Based Curriculum
  | '8-4-4'       // Kenya – old system
  | 'Cambridge'   // IGCSE / AS / A Level
  | 'IB'          // International Baccalaureate
  | 'Montessori'
  | 'American'    // AP / SAT
  | 'French'      // French Baccalaureate
  | 'GCSE'        // UK General
  | 'BTEC';       // UK Vocational

export type EducationLevel =
  // Pre-primary
  | 'Playgroup' | 'PP1' | 'PP2'
  // CBC Primary
  | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6'
  // CBC Junior Secondary
  | 'Grade 7' | 'Grade 8' | 'Grade 9'
  // CBC Senior Secondary
  | 'Grade 10' | 'Grade 11' | 'Grade 12'
  // 8-4-4
  | 'Std 1' | 'Std 2' | 'Std 3' | 'Std 4' | 'Std 5' | 'Std 6' | 'Std 7' | 'Std 8'
  | 'Form 1' | 'Form 2' | 'Form 3' | 'Form 4'
  // Cambridge
  | 'Year 7' | 'Year 8' | 'Year 9' | 'Year 10' | 'Year 11' | 'Year 12' | 'Year 13'
  | 'AS Level' | 'A Level' | 'IGCSE'
  // IB
  | 'IB PYP' | 'IB MYP' | 'IB DP' | 'IB CP'
  // Montessori
  | 'Nido' | 'Primary Montessori' | 'Lower Elementary' | 'Upper Elementary' | 'Adolescent'
  // Higher Education
  | 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4' | 'Postgraduate';

export type SubjectArea =
  | 'Mathematics' | 'English' | 'Kiswahili'
  | 'Science' | 'Biology' | 'Chemistry' | 'Physics'
  | 'Geography' | 'History' | 'CRE' | 'IRE'
  | 'Business Studies' | 'Economics' | 'Accounting'
  | 'Computer Science' | 'ICT'
  | 'Art & Design' | 'Music' | 'Drama'
  | 'Physical Education'
  | 'French' | 'German' | 'Spanish' | 'Arabic' | 'Mandarin'
  | 'Social Studies' | 'Environmental Studies'
  | 'Agriculture' | 'Home Science'
  | 'Other';

export type SubscriptionTier = 'trial' | 'basic' | 'professional' | 'enterprise';

// ─── Users ───────────────────────────────────────────────────────────────────

export interface User {
  uid: string;
  email: string;
  phone: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string; // ISO
  updatedAt: string;
}

// ─── Teacher ─────────────────────────────────────────────────────────────────

export interface TeacherProfile {
  uid: string;           // same as User.uid
  bio: string;
  qualifications: string[];
  subjects: SubjectArea[];
  curricula: Curriculum[];
  levels: EducationLevel[];
  languages: string[];
  hourlyRate: number;    // KES
  rating: number;        // 0–5
  reviewCount: number;
  totalStudents: number;
  totalSessions: number;
  availability: AvailabilitySlot[];
  subscription: TeacherSubscription;
  isVerified: boolean;
  profileCompleted: boolean;
  registrationFeePaid: boolean;
  createdAt: string;
}

export interface TeacherSubscription {
  tier: SubscriptionTier;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  maxStudents: number;
  canUploadVideos: boolean;
  canCreateCourses: boolean;
  canAccessLibrary: boolean;
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 0 = Sunday
  startTime: string; // 'HH:MM'
  endTime: string;
  timezone: string;
}

// ─── Student / Parent ────────────────────────────────────────────────────────

export interface StudentProfile {
  uid: string;
  parentId?: string;
  curriculum: Curriculum;
  level: EducationLevel;
  school?: string;
  enrolledCourses: string[];   // courseIds
  completedCourses: string[];
  createdAt: string;
}

export interface ParentProfile {
  uid: string;
  children: string[]; // studentUids
  createdAt: string;
}

// ─── Sessions (Live Classes) ─────────────────────────────────────────────────

export interface ClassSession {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description?: string;
  subject: SubjectArea;
  curriculum: Curriculum;
  level: EducationLevel;
  scheduledAt: string;           // ISO
  duration: number;              // minutes
  maxParticipants: number;
  participants: string[];        // userIds who confirmed
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  price: number;                 // KES — 0 = free
  recordingEnabled: boolean;
  recordingUrl?: string;
  createdAt: string;
}

// ─── Booking Requests ────────────────────────────────────────────────────────

export interface BookingRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  subject: SubjectArea;
  curriculum: Curriculum;
  level: EducationLevel;
  message: string;
  preferredDates: string[];      // ISO strings
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  sessionId?: string;
  teacherNote?: string;
  createdAt: string;
}

// ─── Courses (Paid Video Lessons) ────────────────────────────────────────────

export interface Course {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherPhoto?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
  curriculum: Curriculum;
  level: EducationLevel;
  subject: SubjectArea;
  price: number;         // KES
  discountPrice?: number;
  lessons: CourseLessons[];
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  isPublished: boolean;
  totalDuration: number; // seconds
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLessons {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration: number;      // seconds
  order: number;
  isPreview: boolean;    // free preview lesson
}

// ─── Library Resources ───────────────────────────────────────────────────────

export interface LibraryResource {
  id: string;
  uploaderId: string;
  uploaderName: string;
  title: string;
  description: string;
  curriculum: Curriculum;
  level: EducationLevel;
  subject: SubjectArea;
  type: 'video' | 'pdf' | 'document' | 'presentation' | 'audio' | 'image';
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;      // bytes
  price: number;         // 0 = free
  downloadCount: number;
  viewCount: number;
  tags: string[];
  isApproved: boolean;
  createdAt: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentType =
  | 'registration_fee'
  | 'subscription'
  | 'course_purchase'
  | 'session_booking'
  | 'resource_unlock';

export type PaymentMethod = 'mpesa' | 'pesapal' | 'card';

export interface Payment {
  id: string;
  userId: string;
  type: PaymentType;
  amount: number;
  currency: 'KES';
  method: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  reference: string;       // M-Pesa checkoutRequestId or Pesapal orderTrackingId
  phoneNumber?: string;    // for M-Pesa
  metadata: Record<string, unknown>;
  completedAt?: string;
  createdAt: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  rating: number;   // 1–5
  comment: string;
  sessionId?: string;
  courseId?: string;
  createdAt: string;
}

// ─── Chat (in classroom) ─────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'file' | 'system';
  timestamp: number; // Unix ms
}

// ─── Classroom Participant ────────────────────────────────────────────────────

export interface ClassroomParticipant {
  uid: string;
  displayName: string;
  role: 'host' | 'co-host' | 'participant';
  audioEnabled: boolean;
  videoEnabled: boolean;
  handRaised: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
}

// ─── Platform Settings (Admin) ───────────────────────────────────────────────

export interface PlatformSettings {
  registrationFee: number;          // KES
  platformCommissionPercent: number;
  trialDurationDays: number;
  subscriptionTiers: {
    basic:        { priceMonthly: number; priceAnnual: number; maxStudents: number };
    professional: { priceMonthly: number; priceAnnual: number; maxStudents: number };
    enterprise:   { priceMonthly: number; priceAnnual: number; maxStudents: number };
  };
  maintenanceMode: boolean;
  updatedAt: string;
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'session_reminder' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}
