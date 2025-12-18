export type PeriodType = 'week' | 'month' | 'all';

export interface LeaderboardEntry {
  position: number;           
  userId: number;             
  name: string;               
  avatar?: string | null;     
  level?: number;             
  xp?: number;                
  signsLearned?: number;      
  modulesCompleted?: number;  
  isSelf?: boolean;           
}

export interface LeaderboardResponse {
  groupId: number;
  groupName: string;
  period: PeriodType;
  myPosition: number | null;  
  entries: LeaderboardEntry[]; 
  selfEntry?: LeaderboardEntry; 
}

export interface LeaderboardQueryParams {
  groupId: number;
  period: PeriodType;
  limit?: number; 
}


export const XP_RULES = {
  SIGN_LEARNED: 10,
  MODULE_COMPLETED: 30,
  SIGN_REVIEW: 5,
};
