// 타입 정의는 여기에 추가하세요
export interface Section {
  rows: Record<number, number>;
}

export interface Seat {
  userId?: string;
}

export interface Member {
  id: string;
  name: string;
  part: 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
  group: string;
}

export interface SeatingMap {
  sections: Record<string, Section>;
  seats: Record<string, Record<number, Record<string, string>>>;
  members: Record<string, Member>;
}
