-- PostgreSQL Database Schema for FaithConnect (Supabase)

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users Profile Table (linked with Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Maps to auth.users.id
    email TEXT NOT NULL,
    username TEXT UNIQUE,
    display_name TEXT,
    phone TEXT,
    occupation TEXT,
    address TEXT,
    dob TEXT,
    bio TEXT,
    role TEXT DEFAULT 'member', -- 'member', 'leader', 'admin'
    branch TEXT DEFAULT 'Ankaful',
    onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Announcements (Parish Bulletins)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- 'General', 'Worship', 'Service', 'Youth', 'Giving'
    branch TEXT DEFAULT 'Ankaful',
    author_name TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Small Groups
CREATE TABLE IF NOT EXISTS small_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    time TEXT,
    location TEXT,
    leader_name TEXT,
    members TEXT[] DEFAULT '{}'::TEXT[], -- Array of user IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Prayer Wall Requests
CREATE TABLE IF NOT EXISTS prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    likes TEXT[] DEFAULT '{}'::TEXT[], -- Array of user IDs who liked
    encouragements JSONB DEFAULT '[]'::JSONB, -- Array of encouragement objects
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Attendance Check-In Records
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "eventName" TEXT NOT NULL, -- 'Sunday Service', "Children's Ministry", 'Youth Group', 'Midweek Prayer'
    date TEXT NOT NULL, -- 'YYYY-MM-DD'
    "familyMembersCount" INTEGER DEFAULT 0,
    "securityPin" TEXT,
    branch TEXT DEFAULT 'Ankaful',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Discipleship Path & Mentorship Records
CREATE TABLE IF NOT EXISTS discipleship (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT UNIQUE NOT NULL,
    "userName" TEXT NOT NULL,
    "mentorId" TEXT,
    "mentorName" TEXT,
    notes TEXT,
    "completedMilestones" TEXT[] DEFAULT '{}'::TEXT[], -- Completed milestones list
    "enrolledCourses" JSONB DEFAULT '{}'::JSONB, -- Course enrollments object
    conversations JSONB DEFAULT '[]'::JSONB, -- Array of messages between mentor & user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Youth Ministry Events
CREATE TABLE IF NOT EXISTS youth_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL, -- 'YYYY-MM-DD'
    location TEXT,
    branch TEXT DEFAULT 'Ankaful',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Youth Ministry Scripture Memory & Challenges
CREATE TABLE IF NOT EXISTS youth_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    target TEXT NOT NULL,
    points INTEGER DEFAULT 50,
    participants JSONB DEFAULT '{}'::JSONB, -- Object mapping user ID to status/date
    branch TEXT DEFAULT 'Ankaful',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Youth Discussion Threads & Forum Posts
CREATE TABLE IF NOT EXISTS youth_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    content TEXT NOT NULL,
    likes TEXT[] DEFAULT '{}'::TEXT[],
    replies JSONB DEFAULT '[]'::JSONB,
    branch TEXT DEFAULT 'Ankaful',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
