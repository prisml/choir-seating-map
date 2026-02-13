import { supabase } from '../lib/supabase';
import { SeatingMap, Member, Section } from '../types';

// Supabase에서 전체 데이터 불러오기
export async function loadSeatingMapFromSupabase(_userId: string): Promise<SeatingMap | null> {
    try {
        // 섹션 불러오기
        const { data: sectionsData, error: sectionsError } = await supabase
            .from('sections')
            .select('*')
            .order('display_order');

        if (sectionsError) throw sectionsError;

        // 섹션 행 불러오기
        const { data: rowsData, error: rowsError } = await supabase
            .from('section_rows')
            .select('*')
            .in('section_id', sectionsData?.map((s) => s.id) || []);

        if (rowsError) throw rowsError;

        // 좌석 배정 불러오기
        const { data: seatsData, error: seatsError } = await supabase
            .from('seats')
            .select('*')
            .in('section_id', sectionsData?.map((s) => s.id) || []);

        if (seatsError) throw seatsError;

        // 멤버 불러오기
        const { data: membersData, error: membersError } = await supabase
            .from('members')
            .select('*');

        if (membersError) throw membersError;

        // 데이터가 없으면 null 반환
        if (!sectionsData || sectionsData.length === 0) {
            return null;
        }

        // SeatingMap 형식으로 변환
        const sections: Record<string, Section> = {};
        const seats: Record<string, Record<number, Record<string, string>>> = {};

        sectionsData.forEach((section) => {
            const sectionRows = rowsData?.filter((r) => r.section_id === section.id) || [];
            const rows: Record<number, number> = {};
            sectionRows.forEach((row) => {
                rows[row.row_num] = row.seat_count;
            });
            sections[section.name] = { rows };

            // 좌석 배정
            const sectionSeats = seatsData?.filter((s) => s.section_id === section.id) || [];
            if (sectionSeats.length > 0) {
                seats[section.name] = {};
                sectionSeats.forEach((seat) => {
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
        membersData?.forEach((member) => {
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
    _userId: string,
    seatingMap: SeatingMap,
): Promise<boolean> {
    try {
        // 1. 기존 데이터 모두 삭제 (순서 중요: FK 관계 때문에 seats -> section_rows -> sections)
        const { error: deleteSeatsError } = await supabase
            .from('seats')
            .delete()
            .gte('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제

        if (deleteSeatsError) {
            console.error('seats 삭제 실패:', deleteSeatsError);
            throw deleteSeatsError;
        }

        const { error: deleteRowsError } = await supabase
            .from('section_rows')
            .delete()
            .gte('id', '00000000-0000-0000-0000-000000000000');

        if (deleteRowsError) {
            console.error('section_rows 삭제 실패:', deleteRowsError);
            throw deleteRowsError;
        }

        const { error: deleteSectionsError } = await supabase
            .from('sections')
            .delete()
            .gte('id', '00000000-0000-0000-0000-000000000000');

        if (deleteSectionsError) {
            console.error('sections 삭제 실패:', deleteSectionsError);
            throw deleteSectionsError;
        }

        const { error: deleteMembersError } = await supabase
            .from('members')
            .delete()
            .gte('id', '00000000-0000-0000-0000-000000000000');

        if (deleteMembersError) {
            console.error('members 삭제 실패:', deleteMembersError);
            throw deleteMembersError;
        }

        // 2. 멤버 저장 (id는 자동 생성되도록 제외, 대신 old_id로 매핑)
        const memberIdMap: Record<string, string> = {}; // old_id -> new_id

        for (const member of Object.values(seatingMap.members)) {
            const { data: insertedMember, error: memberError } = await supabase
                .from('members')
                .insert({
                    name: member.name,
                    part: member.part,
                    group: member.group,
                })
                .select()
                .single();

            if (memberError) {
                console.error('멤버 저장 실패:', memberError);
                throw memberError;
            }

            memberIdMap[member.id] = insertedMember.id;
        }

        // 3. 섹션 저장
        const sectionNames = Object.keys(seatingMap.sections);
        const sectionsToInsert = sectionNames.map((name, index) => ({
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

        insertedSections?.forEach((section) => {
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
            const { error: rowsError } = await supabase.from('section_rows').insert(rowsToInsert);

            if (rowsError) throw rowsError;
        }

        // 4. 좌석 배정 저장 (member_id를 새 UUID로 매핑)
        const seatsToInsert: Array<{
            section_id: string;
            row_num: number;
            seat_num: number;
            member_id: string;
        }> = [];

        insertedSections?.forEach((section) => {
            const sectionSeats = seatingMap.seats[section.name];
            if (sectionSeats) {
                Object.entries(sectionSeats).forEach(([rowNum, rowSeats]) => {
                    Object.entries(rowSeats).forEach(([seatKey, oldMemberId]) => {
                        const newMemberId = memberIdMap[oldMemberId];
                        if (newMemberId) {
                            const seatNum = parseInt(seatKey.replace('Seat', ''));
                            seatsToInsert.push({
                                section_id: section.id,
                                row_num: parseInt(rowNum),
                                seat_num: seatNum,
                                member_id: newMemberId,
                            });
                        }
                    });
                });
            }
        });

        if (seatsToInsert.length > 0) {
            const { error: seatsError } = await supabase.from('seats').insert(seatsToInsert);

            if (seatsError) {
                console.error('좌석 삽입 실패:', seatsError);
                throw seatsError;
            }
        }

        return true;
    } catch (error) {
        console.error('Supabase 데이터 저장 실패:', error);
        return false;
    }
}
