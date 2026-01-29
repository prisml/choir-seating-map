-- Supabase 초기 스키마 설정
-- 이 파일은 Supabase SQL Editor에서 실행하세요

-- members 테이블
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    part TEXT NOT NULL CHECK (part IN ('Soprano', 'Alto', 'Tenor', 'Bass')),
    "group" TEXT NOT NULL DEFAULT '1',
    position TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sections 테이블
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- section_rows 테이블
CREATE TABLE IF NOT EXISTS section_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    row_num INTEGER NOT NULL,
    seat_count INTEGER NOT NULL DEFAULT 4,
    UNIQUE (section_id, row_num)
);

-- seats 테이블 (좌석 배정)
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    row_num INTEGER NOT NULL,
    seat_num INTEGER NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    UNIQUE (section_id, row_num, seat_num)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_sections_user_id ON sections(user_id);
CREATE INDEX IF NOT EXISTS idx_section_rows_section_id ON section_rows(section_id);
CREATE INDEX IF NOT EXISTS idx_seats_section_id ON seats(section_id);
CREATE INDEX IF NOT EXISTS idx_seats_member_id ON seats(member_id);

-- RLS (Row Level Security) 정책
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own members" ON members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own members" ON members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own members" ON members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own members" ON members
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sections" ON sections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sections" ON sections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sections" ON sections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sections" ON sections
    FOR DELETE USING (auth.uid() = user_id);

-- section_rows는 section의 user_id로 접근 제어
CREATE POLICY "Users can view own section_rows" ON section_rows
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM sections WHERE sections.id = section_rows.section_id AND sections.user_id = auth.uid())
    );

CREATE POLICY "Users can insert own section_rows" ON section_rows
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM sections WHERE sections.id = section_rows.section_id AND sections.user_id = auth.uid())
    );

CREATE POLICY "Users can update own section_rows" ON section_rows
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM sections WHERE sections.id = section_rows.section_id AND sections.user_id = auth.uid())
    );

CREATE POLICY "Users can delete own section_rows" ON section_rows
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM sections WHERE sections.id = section_rows.section_id AND sections.user_id = auth.uid())
    );

-- seats도 section의 user_id로 접근 제어
CREATE POLICY "Users can view own seats" ON seats
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM sections WHERE sections.id = seats.section_id AND sections.user_id = auth.uid())
    );

CREATE POLICY "Users can insert own seats" ON seats
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM sections WHERE sections.id = seats.section_id AND sections.user_id = auth.uid())
    );

CREATE POLICY "Users can update own seats" ON seats
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM sections WHERE sections.id = seats.section_id AND sections.user_id = auth.uid())
    );

CREATE POLICY "Users can delete own seats" ON seats
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM sections WHERE sections.id = seats.section_id AND sections.user_id = auth.uid())
    );

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- members 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
