export const BRANCHES = ['Ankaful'] as const;
export type BranchType = typeof BRANCHES[number];

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'member' | 'leader' | 'admin';
  branch?: string; // New field for branch-specific filtering
  createdAt: any;
  photoUrl?: string;
  bio?: string;
  phone?: string;
  occupation?: string;
  address?: string;
  dob?: string;
  onboarded?: boolean;
}

export interface PrayerRequest {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: any;
  encouragementCount: number;
  prayingUsers: string[];
}

export interface SmallGroup {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  leaderName: string;
  members: string[];
  meetingTime: string;
  category: string;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  videoUrl?: string;
  audioUrl?: string;
  notes?: string;
  scriptureRefs?: string[];
}

export interface Donation {
  id: string;
  userId: string;
  amount: number;
  type: 'one-time' | 'recurring';
  timestamp: any;
  category: string;
}

export interface AttendanceRecord {
  id: string;
  eventName: string;
  date: string;
  attendees: string[];
}

export interface DiscipleshipRecord {
  id: string;
  userId: string;
  userName: string;
  completedMilestones: string[]; // e.g., 'Baptism', 'Membership Class', 'Volunteer Orientation', 'Mentorship'
  completedCourses: { courseName: string; completedAt: string }[];
  mentorId?: string;
  mentorName?: string;
  notes?: string;
  lastUpdated: any;
}

export interface YouthEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

export interface YouthChallenge {
  id: string;
  title: string;
  description: string;
  target: string;
  points: number;
  participants: { [userId: string]: { status: 'joined' | 'completed'; date: string } };
}

export interface YouthPost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: any;
  likes: string[];
  replies: {
    authorName: string;
    content: string;
    timestamp: any;
  }[];
}

export interface Devotional {
  id: string;
  date: string;
  title: string;
  content: string;
  author: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  days: { day: number; scripture: string }[];
  participants: { [userId: string]: number }; // userId -> currentDay progress
}
