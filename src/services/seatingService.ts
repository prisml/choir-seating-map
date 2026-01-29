import { supabase } from '../lib/supabase';
import { SeatingMap, Member, Section } from '../types';

// Supabase에서 전체 데이터 불러오기
export async function loadSeatingMapFromSupabase(userId: string): Promise<SeatingMap | null> {
    try {
        // 섹션 불러오기
        const { data: sectionsData, error: sectionsError } = await supabase
            .from('sections')
            .select('*')
            .eq('user_id', userId)
            .order('display_order');

        if (sectionsError) throw sectionsError;

        // 섹션 행 불러오기
        const { data: rowsData, error: rowsError } = await supabase
            .from('section_rows')
            .select('*')
            .in('section_id', sectionsData?.map(s => s.id) || []);

        if (rowsError) throw rowsError;

        // 좌석 배정 불러오기
        const { data: seatsData, error: seatsError } = await supabase
            .from('seats')
            .select('*')
            .in('section_id', sectionsData?.map(s => s.id) || []);

        if (seatsError) throw seatsError;

        // 멤버 불러오기
        const { data: membersData, error: membersError } = await supabase
            .from('members')
            .select('*')
            .eq('user_id', userId);

        if (membersError) throw membersError;

        // 데이터가 없으면 null 반환
        if (!sectionsData || sectionsData.length === 0) {
            return null;
        }

        // SeatingMap 형식으로 변환
        const sections: Record<string, Section> = {};
        const seats: Record<string, Record<number, Record<string, string>>> = {};

        sectionsData.forEach(section => {
            const sectionRows = rowsData?.filter(r => r.section_id === section.id) || [];
            const rows: Record<number, number> = {};
            sectionRows.forEach(row => {
                rows[row.row_num] = row.seat_count;
            });
            sections[section.name] = { rows };

            // 좌석 배정
            const sectionSeats = seatsData?.filter(s => s.section_id === section.id) || [];
            if (sectionSeats.length > 0) {
                seats[section.name] = {};
                sectionSeats.forEach(seat => {
                    if (seat.member_id) {
                        if (!seats[section.name][seat.row_num]) {
                            seats[section.name][seat.row_num] = {};
                        }
                        seats[section.name][seat.row_num][`Seat${seat.seat_num}`] = seat.member_id;
                    }
                });
            }
        });

        // 멤버 변환
        const members: Record<string, Member> = {};
        membersData?.forEach(member => {
            members[member.id] = {
                id: member.id,
                name: member.name,
                part: member.part,
                group: member.group,
            };
        });

        return { sections, seats, members };
    } catch (error) {
        console.error('Supabase 데이터 로드 실패:', error);
        return null;
    }
}

// Supabase에 전체 데이터 저장하기
export async function saveSeatingMapToSupabase(
    userId: string,
    seatingMap: SeatingMap
): Promise<boolean> {
    try {
        // 1. 기존 섹션 삭제 (cascade로 rows, seats도 삭제됨)
        const { error: deleteError } = await supabase
            .from('sections')
            .delete()
            .eq('user_id', userId);

        if (deleteError) throw deleteError;

        // 2. 기존 멤버 삭제
        const { error: deleteMembersError } = await supabase
            .from('members')
            .delete()
            .eq('user_id', userId);

        if (deleteMembersError) throw deleteMembersError;

        // 3. 멤버 저장
        const membersToInsert = Object.values(seatingMap.members).map(member => ({
            id: member.id,
            user_id: userId,
            name: member.name,
            part: member.part,
            group: member.group,
        }));

        if (membersToInsert.length > 0) {
            const { error: membersError } = await supabase
                .from('members')
                .insert(membersToInsert);

            if (membersError) throw membersError;
        }

        // 4. 섹션 저장
        const sectionNames = Object.keys(seatingMap.sections);
        const sectionsToInsert = sectionNames.map((name, index) => ({
            user_id: userId,
            name,
            display_order: index,
        }));

        const { data: insertedSections, error: sectionsError } = await supabase
            .from('sections')
            .insert(sectionsToInsert)
            .select();

        if (sectionsError) throw sectionsError;

        // 5. 섹션 행 저장
        const rowsToInsert: Array<{
            section_id: string;
            row_num: number;
            seat_count: number;
        }> = [];

        insertedSections?.forEach(section => {
            const sectionData = seatingMap.sections[section.name];
            Object.entries(sectionData.rows).forEach(([rowNum, seatCount]) => {
                rowsToInsert.push({
                    section_id: section.id,
                    row_num: parseInt(rowNum),
                    seat_count: seatCount,
                });
            });
        });

        if (rowsToInsert.length > 0) {
            const { error: rowsError } = await supabase
                .from('section_rows')
                .insert(rowsToInsert);

            if (rowsError) throw rowsError;
        }

        // 6. 좌석 배정 저장
        const seatsToInsert: Array<{
            section_id: string;
            row_num: number;
            seat_num: number;
            member_id: string;
        }> = [];

        insertedSections?.forEach(section => {
            const sectionSeats = seatingMap.seats[section.name];
            if (sectionSeats) {
                Object.entries(sectionSeats).forEach(([rowNum, rowSeats]) => {
                    Object.entries(rowSeats).forEach(([seatKey, memberId]) => {
                        const seatNum = parseInt(seatKey.replace('Seat', ''));
                        seatsToInsert.push({
                            section_id: section.id,
                            row_num: parseInt(rowNum),
                            seat_num: seatNum,
                            member_id: memberId,
                        });
                    });
                });
            }
        });

        if (seatsToInsert.length > 0) {
            const { error: seatsError } = await supabase
                .from('seats')
                .insert(seatsToInsert);

            if (seatsError) throw seatsError;
        }

        return true;
    } catch (error) {
        console.error('Supabase 데이터 저장 실패:', error);
        return false;
    }
}
