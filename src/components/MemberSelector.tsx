import { useState, useMemo } from 'react';

interface MemberSelectorProps {
    members: Record<string, { id: string; name: string; part: string; group: string }>;
    selectedSeat: { section: string; row: number; seat: number } | null;
    onMemberSelect: (memberId: string) => void;
    onClear: () => void;
}

const PARTS = ['Soprano', 'Alto', 'Tenor', 'Bass'] as const;
type Part = (typeof PARTS)[number];

export default function MemberSelector({
    members,
    selectedSeat,
    onMemberSelect,
    onClear,
}: MemberSelectorProps) {
    const [selectedPart, setSelectedPart] = useState<Part | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    // 선택된 파트의 멤버들
    const membersByPart = useMemo(() => {
        if (!selectedPart) return {};
        return Object.values(members).reduce((acc, member) => {
            if (member.part === selectedPart) {
                if (!acc[member.group]) acc[member.group] = [];
                acc[member.group].push(member);
            }
            return acc;
        }, {} as Record<string, (typeof members)[string][]>);
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
        onClear();
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

                    {/* 파트 선택 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            파트 선택
                        </label>
                        <div className="space-y-2">
                            {PARTS.map((part) => (
                                <button
                                    key={part}
                                    onClick={() => {
                                        setSelectedPart(part);
                                        setSelectedGroup(null);
                                    }}
                                    className={`
                    w-full px-4 py-2 rounded-lg font-semibold transition-all duration-200
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
                            <div className="space-y-2">
                                {groups.map((group) => (
                                    <button
                                        key={group}
                                        onClick={() => setSelectedGroup(group)}
                                        className={`
                      w-full px-4 py-2 rounded-lg font-semibold transition-all duration-200
                      ${
                          selectedGroup === group
                              ? 'bg-green-600 text-white border-2 border-green-700'
                              : 'bg-gray-100 text-gray-800 border-2 border-gray-300 hover:bg-gray-200'
                      }
                    `}
                                    >
                                        {group}조 ({membersByPart[group]?.length || 0}명)
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
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {filteredMembers.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => onMemberSelect(member.id)}
                                        className="w-full px-4 py-3 bg-amber-50 text-gray-800 border-2 border-amber-400 rounded-lg hover:bg-amber-100 transition-all duration-200 font-semibold text-left"
                                    >
                                        {member.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 초기화 버튼 */}
                    <button
                        onClick={handleReset}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-semibold"
                    >
                        초기화
                    </button>
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
