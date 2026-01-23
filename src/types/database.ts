// Supabase 데이터베이스 타입 정의

export interface DbMember {
    id: string;
    name: string;
    part: 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
    group: string;
    position?: string | null;
    phone?: string | null;
    email?: string | null;
    created_at: string;
    updated_at: string;
}

export interface DbSection {
    id: string;
    name: string;
    display_order: number;
    created_at: string;
}

export interface DbSectionRow {
    id: string;
    section_id: string;
    row_num: number;
    seat_count: number;
}

export interface DbSeat {
    id: string;
    section_id: string;
    row_num: number;
    seat_num: number;
    member_id: string | null;
}

// 조인된 데이터 타입
export interface DbSeatWithMember extends DbSeat {
    member?: DbMember | null;
}

export interface DbSectionWithRows extends DbSection {
    section_rows: DbSectionRow[];
}
