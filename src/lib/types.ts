export type LeadBucket = 
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  course_interest: string;
  source: string;
  bucket_stage: LeadBucket;
  assigned_to: string;
  created_at: string;
}

export interface Demo {
  id: string;
  lead_id: string;
  scheduled_at: string;
  status: 'Scheduled' | 'Completed' | 'No-Show';
  notes: string;
}

export interface Admission {
  id: string;
  lead_id: string;
  amount: number;
  discount_locked: string;
  offer_expiry: string;
  expected_sale_date: string;
  status: 'Active' | 'Expired' | 'Converted';
  created_by: string;
}

export interface Sale {
  id: string;
  lead_id: string;
  admission_id?: string;
  course_id: string;
  total_fee: number;
  amount_paid: number;
  payment_mode: string;
  status: 'Sale Partial Closed' | 'Sale Completed';
  sales_exec_id: string;
  timestamp: string;
}

export interface ManagerApproval {
  id: string;
  sale_id: string;
  checklist: {
    payment_verified: boolean;
    course_confirmed: boolean;
    batch_available: boolean;
    documents_received: boolean;
    teacher_assignable: boolean;
    joining_date_feasible: boolean;
  };
  status: 'Pending' | 'Approved' | 'Rejected';
  notes: string;
  approver_id?: string;
  decided_at?: string;
}

export interface Onboarding {
  id: string;
  sale_id: string;
  batch_id: string;
  teacher_id: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  joining_date: string;
  remarks: string;
}

export interface Student {
  id: string;
  onboarding_id: string;
  student_code: string; // CNX-YYYY-####
  portal_login_email: string;
  status: 'Active' | 'Suspended' | 'Alumni';
}

export interface Module {
  id: string;
  name: string;
  sequence_order: number;
}

export interface Batch {
  id: string;
  module_id: string;
  min_students: number;
  max_students: number;
  target_capacity: number;
  current_enrolled: number;
  start_date: string;
  status: 'Forming' | 'Ready' | 'Active' | 'Completed';
}

export interface LessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  score?: number;
  watched_pct: number;
}

export interface LessonConfig {
  id: string;
  module_id: string;
  title: string;
  has_video: boolean;
  has_quiz: boolean;
  has_coding: boolean;
  has_assignment: boolean;
  has_live_class: boolean;
  has_reading: boolean;
  has_practice: boolean;
}

export interface Task {
  id: string;
  type: 'Boolean' | 'Numeric' | 'Checklist' | 'Approval' | 'Recurring';
  title: string;
  target_value?: number;
  current_value?: number;
  assignee_id: string;
  due_date: string;
  recurrence_rule?: 'Daily' | 'Weekly' | 'Monthly';
  status: 'Pending' | 'Completed';
  requires_approval: boolean;
  approver_id?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  body: string;
  category: string;
}

export interface ReferralAsset {
  id: string;
  type: 'Poster' | 'Brochure' | 'WhatsApp' | 'Story' | 'Video' | 'PDF' | 'QR';
  file_url: string;
  uploaded_by: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  weekly_hours_taught: number;
  availability_json: string;
}

export interface TimetableEntry {
  id: string;
  batch_id: string;
  teacher_id: string;
  room_or_link: string;
  day_of_week: string; // Monday, Tuesday, etc.
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
}
