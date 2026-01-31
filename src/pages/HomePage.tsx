import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SeatingGrid from '../components/SeatingGrid';
import MemberSelector from '../components/MemberSelector';
import DataManager from '../components/DataManager';
import LayoutEditor from '../components/LayoutEditor';
import MemberManager from '../components/MemberManager';
import { useAuth } from '../hooks/useAuth';
import { SeatingMap, Section, Member } from '../types';
import { loadFromLocalStorage } from '../utils/storage';
import { loadSeatingMapFromSupabase } from '../services/seatingService';

// 빈 초기 데이터
const EMPTY_LAYOUT: SeatingMap = {
    sections: {},
    seats: {},
    members: {},
};

export default function HomePage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [seatingMap, setSeatingMap] = useState<SeatingMap>(EMPTY_LAYOUT);
    const [loading, setLoading] = useState(true);
    const [selectedSeat, setSelectedSeat] = useState<{
        section: string;
        row: number;
        seat: number;
    } | null>(null);
    const [showLayoutEditor, setShowLayoutEditor] = useState(false);
    const [showMemberManager, setShowMemberManager] = useState(false);

    // 초기 데이터 로드 (클라우드 → 로컬 스토리지 순)
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            // 1. 클라우드에서 먼저 시도
            const cloudData = await loadSeatingMapFromSupabase(user.id);
            if (cloudData) {
                setSeatingMap(cloudData);
                setLoading(false);
                return;
            }

            // 2. 클라우드 데이터 없으면 로컬 스토리지에서 로드
            const localData = loadFromLocalStorage();
            if (localData) {
                setSeatingMap(localData);
            }

            setLoading(false);
        };

        loadInitialData();
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

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
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{user?.email}</span>
                            <button
                                onClick={() => setShowMemberManager(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-lg"
                            >
                                👥 멤버 관리
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">데이터를 불러오는 중...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* 좌석 배치도 */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        좌석 배치도
                                    </h2>
                                    <button
                                        onClick={() => setShowLayoutEditor(true)}
                                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold text-sm"
                                    >
                                        🎹 레이아웃 설정
                                    </button>
                                </div>
                                {Object.keys(seatingMap.sections).length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <p className="text-4xl mb-4">🎹</p>
                                        <p className="text-lg font-semibold mb-2">
                                            좌석 배치가 없습니다
                                        </p>
                                        <p className="text-sm">
                                            위의 "레이아웃 설정" 버튼을 눌러 섹션을 추가하거나,
                                        </p>
                                        <p className="text-sm">
                                            오른쪽 데이터 관리에서 클라우드/로컬 데이터를
                                            불러오세요.
                                        </p>
                                    </div>
                                ) : (
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
                                )}
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
                                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                                    👥 멤버 배정
                                </h2>
                                <MemberSelector
                                    members={seatingMap.members}
                                    selectedSeat={selectedSeat}
                                    onMemberSelect={handleMemberSelect}
                                    onClear={() => setSelectedSeat(null)}
                                />
                            </div>
                        </div>
                    </div>
                )}
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
