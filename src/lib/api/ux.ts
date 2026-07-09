export interface QRCodeResult {
  qrCode: string;
  expiresAt: number;
}

export interface AttendanceResult {
  success: boolean;
  message: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: number;
}

export interface AwardBadgeResult {
  success: boolean;
  awardedBadge: Badge;
}

export interface MockInterview {
  interviewId: string;
  questions: string[];
}

export interface InterviewFeedback {
  score: number;
  comments: string;
}

export async function generateQRAttendance(sessionId: string): Promise<QRCodeResult> {
  // Mock generation
  return {
    qrCode: `qr_data_${sessionId}_${Date.now()}`,
    expiresAt: Date.now() + 1000 * 60 * 60 // 1 hour expiry
  };
}

export async function markAttendanceWithQR(studentId: string, qrData: string): Promise<AttendanceResult> {
  // Mock attendance marking
  return {
    success: true,
    message: 'Attendance marked successfully'
  };
}

export async function getBadges(studentId: string): Promise<Badge[]> {
  // Mock badges
  return [
    {
      id: 'badge_first_login',
      name: 'First Login',
      description: 'Logged in for the first time',
      icon: 'star',
      earnedAt: Date.now()
    },
    {
      id: 'badge_top_scorer',
      name: 'Top Scorer',
      description: 'Scored 100% in a quiz',
      icon: 'trophy'
    }
  ];
}

export async function awardBadge(studentId: string, badgeId: string): Promise<AwardBadgeResult> {
  // Mock awarding badge
  return {
    success: true,
    awardedBadge: {
      id: badgeId,
      name: 'Newly Awarded Badge',
      description: 'You just earned this badge!',
      icon: 'award',
      earnedAt: Date.now()
    }
  };
}

export async function startMockInterview(studentId: string, topic: string): Promise<MockInterview> {
  // Mock interview start
  return {
    interviewId: `interview_${Date.now()}`,
    questions: [
      'Tell me about yourself.',
      `What are your strengths in ${topic}?`,
      'Describe a challenging project you worked on.'
    ]
  };
}

export async function submitInterviewAnswer(interviewId: string, questionId: string, answer: string): Promise<InterviewFeedback> {
  // Mock answer submission and feedback
  return {
    score: 85,
    comments: 'Good answer, but could be more concise.'
  };
}
