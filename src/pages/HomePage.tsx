import { useState } from 'react';
import SeatingGrid from '../components/SeatingGrid';
import MemberSelector from '../components/MemberSelector';
import DataManager from '../components/DataManager';
import LayoutEditor from '../components/LayoutEditor';
import MemberManager from '../components/MemberManager';
import { SeatingMap, Section, Member } from '../types';
import { loadFromLocalStorage } from '../utils/storage';

// 샘플 데이터
const SAMPLE_LAYOUT: SeatingMap = {
    sections: {
        A: {
            rows: {
                1: 4,
                2: 8,
                3: 8,
                4: 8,
                5: 9,
                6: 8,
                7: 8,
                8: 8,
                9: 8,
                10: 8,
                11: 7,
                12: 7,
            },
        },
        B: {
            rows: {
                1: 6,
                2: 6,
                3: 6,
                4: 6,
                5: 6,
                6: 6,
                7: 6,
                8: 6,
                9: 5,
                10: 5,
                11: 5,
                12: 5,
            },
        },
    },
    seats: {},
    members: {
        m1: { id: 'm1', name: 'Kim', part: 'Soprano', group: '1' },
        m2: { id: 'm2', name: 'Lee', part: 'Alto', group: '1' },
        m3: { id: 'm3', name: 'Park', part: 'Tenor', group: '2' },
        m4: { id: 'm4', name: 'Choi', part: 'Bass', group: '2' },
    },
};

export default function HomePage() {
    const [seatingMap, setSeatingMap] = useState<SeatingMap>(() => {
        const saved = loadFromLocalStorage();
        return saved || SAMPLE_LAYOUT;
    });
    const [selectedSeat, setSelectedSeat] = useState<{
        section: string;
        row: number;
        seat: number;
    } | null>(null);
    const [showLayoutEditor, setShowLayoutEditor] = useState(false);
    const [showMemberManager, setShowMemberManager] = useState(false);

    const handleSeatClick = (section: string, row: number, seat: number) => {
        setSelectedSeat({ section, row, seat });
    };

    const handleUpdateLayout = (sections: Record<string, Section>) => {
        setSeatingMap((prev) => ({
            ...prev,
            sections,
            // 삭제된 섹션의 좌석 배정 정리
            seats: Object.fromEntries(Object.entries(prev.seats).filter(([key]) => sections[key])),
        }));
    };

    const handleUpdateMembers = (members: Record<string, Member>) => {
        setSeatingMap((prev) => ({
            ...prev,
            members,
            // 삭제된 멤버의 좌석 배정 정리
            seats: Object.fromEntries(
                Object.entries(prev.seats).map(([section, rows]) => [
                    section,
                    Object.fromEntries(
                        Object.entries(rows).map(([row, seats]) => [
                            row,
                            Object.fromEntries(
                                Object.entries(seats).filter(([_, memberId]) => members[memberId]),
                            ),
                        ]),
                    ),
                ]),
            ),
        }));
    };

    const handleMemberSelect = (memberId: string) => {
        if (!selectedSeat) return;

        const { section, row, seat } = selectedSeat;
        const seatKey = `Seat${seat}`;

        setSeatingMap((prev) => ({
            ...prev,
            seats: {
                ...prev.seats,
                [section]: {
                    ...(prev.seats[section] || {}),
                    [row]: {
                        ...(prev.seats[section]?.[row] || {}),
                        [seatKey]: memberId,
                    },
                },
            },
        }));
        setSelectedSeat(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto py-6 px-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">
                                🎵 Choir Seating Map
                            </h1>
                            <p className="text-gray-600 mt-2">합창단 좌석 배치도 관리 시스템</p>
                        </div>
                        <button
                            onClick={() => setShowMemberManager(true)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-lg"
                        >
                            👥 멤버 관리
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 좌석 배치도 */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">좌석 배치도</h2>
                                <button
                                    onClick={() => setShowLayoutEditor(true)}
                                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold text-sm"
                                >
                                    🎹 레이아웃 설정
                                </button>
                            </div>
                            <div className="space-y-8">
                                {Object.keys(seatingMap.sections).map((section) => (
                                    <SeatingGrid
                                        key={section}
                                        section={section}
                                        rows={seatingMap.sections[section].rows}
                                        seats={seatingMap.seats[section] || {}}
                                        members={seatingMap.members}
                                        onSeatClick={handleSeatClick}
                                        isSelected={selectedSeat?.section === section}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 사이드바 - 멤버 선택 및 데이터 관리 */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* 데이터 관리 */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                                📊 데이터 관리
                            </h2>
                            <DataManager
                                data={seatingMap}
                                onLoadData={setSeatingMap}
                                onSaveSuccess={() => {
                                    // 저장 성공 후 처리 (필요시)
                                }}
                            />
                        </div>

                        {/* 멤버 선택 */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">👥 멤버 배정</h2>
                            <MemberSelector
                                members={seatingMap.members}
                                selectedSeat={selectedSeat}
                                onMemberSelect={handleMemberSelect}
                                onClear={() => setSelectedSeat(null)}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* 레이아웃 에디터 모달 */}
            {showLayoutEditor && (
                <LayoutEditor
                    seatingMap={seatingMap}
                    onUpdateLayout={handleUpdateLayout}
                    onClose={() => setShowLayoutEditor(false)}
                />
            )}

            {/* 멤버 관리 모달 */}
            {showMemberManager && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">👥 멤버 관리</h2>
                            <button
                                onClick={() => setShowMemberManager(false)}
                                className="text-white hover:text-gray-200 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <MemberManager
                                members={seatingMap.members}
                                onUpdateMembers={handleUpdateMembers}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
