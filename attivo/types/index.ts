// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type Sport = 'tennis' | 'skiing' | 'hiking' | 'climbing' | string;

export type UserRole = 'player' | 'coach' | 'admin';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'competitive';

export type PlayStyle = 'singles' | 'doubles' | 'both';

export type EventCategory = 'match' | 'clinic' | 'group_session' | 'social';

export type SessionStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export type AvailabilityStatus = 'available' | 'limited' | 'unavailable';

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  location?: string;
  avatarUrl?: string;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  skillLevel: SkillLevel;
  playStyle: PlayStyle;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface CoachProfile {
  id: string;
  userId: string;
  speciality: string;
  yearsExperience: number;
  rateMin: number;
  rateMax: number;
  certifications: string[];
  bio?: string;
  skillLevelsCoached: SkillLevel[];
  availabilityStatus: AvailabilityStatus;
  verificationStatus: VerificationStatus;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Event {
  id: string;
  creatorId: string;
  name: string;
  category: EventCategory;
  description?: string;
  location: string;
  eventDate: string;
  eventTime: string;
  maxParticipants?: number;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  creator?: User;
}

export interface Post {
  id: string;
  authorId: string;
  body: string;
  imageUrl?: string;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface SessionRequest {
  id: string;
  playerId: string;
  coachId: string;
  status: SessionStatus;
  message?: string;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  player?: PlayerProfile;
  coach?: CoachProfile;
}

// ─── Service Input Types ──────────────────────────────────────────────────────

export interface CreatePlayerInput {
  userId: string;
  skillLevel: SkillLevel;
  playStyle: PlayStyle;
  sport?: Sport;
}

export interface UpdatePlayerInput {
  skillLevel?: SkillLevel;
  playStyle?: PlayStyle;
}

export interface CreateCoachInput {
  userId: string;
  speciality: string;
  yearsExperience: number;
  rateMin: number;
  rateMax: number;
  certifications?: string[];
  bio?: string;
  skillLevelsCoached?: SkillLevel[];
  sport?: Sport;
}

export interface UpdateCoachInput {
  speciality?: string;
  yearsExperience?: number;
  rateMin?: number;
  rateMax?: number;
  certifications?: string[];
  bio?: string;
  skillLevelsCoached?: SkillLevel[];
  availabilityStatus?: AvailabilityStatus;
}

export interface CoachFilters {
  skillLevel?: SkillLevel;
  speciality?: string;
  maxRate?: number;
  sport?: Sport;
}

export interface CreateEventInput {
  name: string;
  category: EventCategory;
  description?: string;
  location: string;
  eventDate: string;
  eventTime: string;
  maxParticipants?: number;
  sport?: Sport;
}

export interface CreatePostInput {
  body: string;
  imageUrl?: string;
  sport?: Sport;
}

export interface CreateSessionRequestInput {
  playerId: string;
  coachId: string;
  message?: string;
  sport?: Sport;
}

export interface AuthResult {
  user: User | null;
  error: string | null;
}
