import { useState, useMemo, useEffect } from 'react';

interface MemberSelectorProps {
    members: Record<string, { id: string; name: string; part: string; group: string }>;
    selectedSeat: { section: string; row: number; seat: number } | null;
    currentMemberId: string | null; // 현재 좌석에 배정된 멤버 ID
    onMemberSelect: (memberId: string) => void;
    onClear: () => void;
    onRemoveMember: () => void;
}

const PARTS = ['Soprano', 'Alto', 'Tenor', 'Bass'] as const;
type Part = (typeof PARTS)[number];

export default function MemberSelector({
    members,
    selectedSeat,
    currentMemberId,
    onMemberSelect,
    onClear,
    onRemoveMember,
}: MemberSelectorProps) {
    const [selectedPart, setSelectedPart] = useState<Part | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [pendingMemberId, setPendingMemberId] = useState<string | null>(null); // 미리보기용

    // 좌석이 바뀌면 선택 상태 초기화
    useEffect(() => {
        setSelectedPart(null);
        setSelectedGroup(null);
        setPendingMemberId(null);
    }, [selectedSeat]);

    // 현재 배정된 멤버 정보
    const currentMember = currentMemberId ? members[currentMemberId] : null;

    // 미리보기 중인 멤버 정보
    const pendingMember = pendingMemberId ? members[pendingMemberId] : null;

    // 선택된 파트의 멤버들
    const membersByPart = useMemo(() => {
        if (!selectedPart) return {};
        return Object.values(members).reduce(
            (acc, member) => {
                if (member.part === selectedPart) {
                    if (!acc[member.group]) acc[member.group] = [];
                    acc[member.group].push(member);
                }
                return acc;
            },
            {} as Record<string, (typeof members)[string][]>,
        );
    }, [selectedPart, members]);

    const filteredMembers = useMemo(() => {
        if (!selectedGroup || !selectedPart) return [];
        return membersByPart[selectedGroup] || [];
    }, [selectedGroup, selectedPart, membersByPart]);

    const groups = useMemo(() => {
        return Object.keys(membersByPart).sort();
    }, [membersByPart]);

    const handleReset = () => {
        setSelectedPart(null);
        setSelectedGroup(null);
        setPendingMemberId(null);
    };

    const handleCancel = () => {
        handleReset();
        onClear();
    };

    const handleConfirm = () => {
        if (pendingMemberId) {
            onMemberSelect(pendingMemberId);
            handleReset();
        }
    };

    const handleRemove = () => {
        onRemoveMember();
        handleReset();
    };

    const handleMemberClick = (memberId: string) => {
        setPendingMemberId(memberId);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 h-fit sticky top-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">멤버 배정</h2>

            {selectedSeat ? (
                <div className="space-y-6">
                    {/* 선택된 좌석 정보 */}
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                            <span className="font-bold">{selectedSeat.section}석</span>
                            <span className="mx-2">|</span>
                            <span className="font-bold">{selectedSeat.row}열</span>
                            <span className="mx-2">|</span>
                            <span className="font-bold">{selectedSeat.seat}번</span>
                        </p>
                    </div>

                    {/* 현재 배정 상태 / 미리보기 */}
                    <div
                        className={`rounded-lg p-4 ${pendingMemberId ? 'bg-amber-50 border-2 border-amber-400' : currentMember ? 'bg-green-50 border-2 border-green-400' : 'bg-gray-50 border-2 border-gray-300'}`}
                    >
                        {pendingMemberId ? (
                            <>
                                <p className="text-xs text-amber-600 font-bold mb-1">📝 미리보기</p>
                                <p className="font-bold text-gray-800">{pendingMember?.name}</p>
                                <p className="text-sm text-gray-600">
                                    {pendingMember?.part} · {pendingMember?.group}조
                                </p>
                            </>
                        ) : currentMember ? (
                            <>
                                <p className="text-xs text-green-600 font-bold mb-1">
                                    ✅ 현재 배정
                                </p>
                                <p className="font-bold text-gray-800">{currentMember.name}</p>
                                <p className="text-sm text-gray-600">
                                    {currentMember.part} · {currentMember.group}조
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-500 text-sm">배정된 멤버 없음</p>
                        )}
                    </div>

                    {/* 파트 선택 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            파트 선택
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {PARTS.map((part) => (
                                <button
                                    key={part}
                                    onClick={() => {
                                        setSelectedPart(part);
                                        setSelectedGroup(null);
                                    }}
                                    className={`
                                        px-3 py-2 rounded-lg font-semibold transition-all duration-200 text-sm
                                        ${
                                            selectedPart === part
                                                ? 'bg-indigo-600 text-white border-2 border-indigo-700'
                                                : 'bg-gray-100 text-gray-800 border-2 border-gray-300 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    {part}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 조 선택 */}
                    {selectedPart && groups.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                조 선택
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {groups.map((group) => (
                                    <button
                                        key={group}
                                        onClick={() => setSelectedGroup(group)}
                                        className={`
                                            px-3 py-2 rounded-lg font-semibold transition-all duration-200 text-sm
                                            ${
                                                selectedGroup === group
                                                    ? 'bg-green-600 text-white border-2 border-green-700'
                                                    : 'bg-gray-100 text-gray-800 border-2 border-gray-300 hover:bg-gray-200'
                                            }
                                        `}
                                    >
                                        {group}조 ({membersByPart[group]?.length || 0})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 멤버 선택 */}
                    {filteredMembers.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                멤버 선택
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {filteredMembers.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleMemberClick(member.id)}
                                        className={`
                                            w-full px-4 py-3 rounded-lg font-semibold text-left transition-all duration-200
                                            ${
                                                pendingMemberId === member.id
                                                    ? 'bg-amber-400 text-white border-2 border-amber-500'
                                                    : 'bg-amber-50 text-gray-800 border-2 border-amber-400 hover:bg-amber-100'
                                            }
                                        `}
                                    >
                                        {member.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="space-y-2">
                        {/* 확인 버튼 (멤버 선택 시에만 활성화) */}
                        {pendingMemberId && (
                            <button
                                onClick={handleConfirm}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-bold text-lg"
                            >
                                ✅ 확인
                            </button>
                        )}

                        <div className="flex gap-2">
                            {/* 비우기 버튼 (현재 배정된 멤버가 있을 때만) */}
                            {currentMember && (
                                <button
                                    onClick={handleRemove}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-semibold"
                                >
                                    🗑️ 비우기
                                </button>
                            )}
                            <button
                                onClick={handleCancel}
                                className={`${currentMember ? 'flex-1' : 'w-full'} px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-semibold`}
                            >
                                ✖️ 취소
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500 py-8">
                    <p>좌석을 클릭하여</p>
                    <p>멤버를 배정하세요</p>
                </div>
            )}
        </div>
    );
}
