import { useState, useMemo, useRef } from 'react';
import { Member } from '../types';
import { exportMembersAsCSV, importMembersFromCSV } from '../utils/storage';

interface MemberManagerProps {
    members: Record<string, Member>;
    onUpdateMembers: (members: Record<string, Member>) => void;
}

const PARTS = ['Soprano', 'Alto', 'Tenor', 'Bass'] as const;
type Part = (typeof PARTS)[number];

export default function MemberManager({ members, onUpdateMembers }: MemberManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPart, setSelectedPart] = useState<Part | 'all'>('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);

    // 필터링된 멤버 목록
    const filteredMembers = useMemo(() => {
        let filtered = Object.values(members);

        // 검색어 필터링
        if (searchTerm) {
            filtered = filtered.filter((member) =>
                member.name.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        // 파트 필터링
        if (selectedPart !== 'all') {
            filtered = filtered.filter((member) => member.part === selectedPart);
        }

        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }, [members, searchTerm, selectedPart]);

    // 멤버 추가/수정
    const handleSaveMember = (memberData: Omit<Member, 'id'>) => {
        const newMembers = { ...members };

        if (editingMember) {
            // 수정
            newMembers[editingMember.id] = { ...memberData, id: editingMember.id };
        } else {
            // 추가
            const newId = `m${Date.now()}`;
            newMembers[newId] = { ...memberData, id: newId };
        }

        onUpdateMembers(newMembers);
        setShowAddForm(false);
        setEditingMember(null);
    };

    // 멤버 삭제
    const handleDeleteMember = (memberId: string) => {
        if (!confirm('정말로 이 멤버를 삭제하시겠습니까?')) return;

        const newMembers = { ...members };
        delete newMembers[memberId];
        onUpdateMembers(newMembers);
    };

    // CSV 관련
    const csvInputRef = useRef<HTMLInputElement>(null);
    const [importResult, setImportResult] = useState<{
        count: number;
        errors: string[];
    } | null>(null);

    const handleExportCSV = () => {
        const timestamp = new Date().toISOString().split('T')[0];
        exportMembersAsCSV(members, `members-${timestamp}.csv`);
    };

    const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const { members: importedMembers, count, errors } = await importMembersFromCSV(file);

            if (count === 0) {
                setImportResult({
                    count: 0,
                    errors: errors.length > 0 ? errors : ['유효한 멤버 데이터가 없습니다'],
                });
                return;
            }

            // 기존 멤버와 병합
            const newMembers = { ...members, ...importedMembers };
            onUpdateMembers(newMembers);
            setImportResult({ count, errors });

            // 3초 후 결과 메시지 숨기기
            setTimeout(() => setImportResult(null), 5000);
        } catch (error) {
            setImportResult({
                count: 0,
                errors: [error instanceof Error ? error.message : 'CSV 임포트 실패'],
            });
        }

        if (csvInputRef.current) {
            csvInputRef.current.value = '';
        }
    };

    // 멤버 통계
    const stats = useMemo(() => {
        const total = Object.keys(members).length;
        const byPart = PARTS.reduce(
            (acc, part) => {
                acc[part] = Object.values(members).filter((m) => m.part === part).length;
                return acc;
            },
            {} as Record<Part, number>,
        );

        return { total, byPart };
    }, [members]);

    return (
        <div className="space-y-6">
            {/* 통계 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">📊 멤버 통계</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                        <div className="text-gray-600">전체</div>
                    </div>
                    {PARTS.map((part) => (
                        <div key={part} className="text-center">
                            <div className="text-xl font-bold text-indigo-600">
                                {stats.byPart[part]}
                            </div>
                            <div className="text-gray-600">{part}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="멤버 이름 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
                <select
                    value={selectedPart}
                    onChange={(e) => setSelectedPart(e.target.value as Part | 'all')}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                >
                    <option value="all">모든 파트</option>
                    {PARTS.map((part) => (
                        <option key={part} value={part}>
                            {part}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold whitespace-nowrap"
                >
                    ➕ 멤버 추가
                </button>
            </div>

            {/* CSV 임포트/익스포트 */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleExportCSV}
                    disabled={Object.keys(members).length === 0}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    📤 멤버 CSV 내보내기
                </button>
                <button
                    onClick={() => csvInputRef.current?.click()}
                    className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-semibold"
                >
                    📥 멤버 CSV 가져오기
                </button>
                <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                />
            </div>

            {/* 임포트 결과 메시지 */}
            {importResult && (
                <div
                    className={`p-3 rounded-lg text-sm ${
                        importResult.count > 0
                            ? 'bg-green-100 border-2 border-green-400 text-green-800'
                            : 'bg-red-100 border-2 border-red-400 text-red-800'
                    }`}
                >
                    {importResult.count > 0 && (
                        <p className="font-bold">✅ {importResult.count}명의 멤버를 가져왔습니다</p>
                    )}
                    {importResult.errors.length > 0 && (
                        <div className="mt-1">
                            <p className="font-bold">⚠️ 오류:</p>
                            <ul className="list-disc list-inside">
                                {importResult.errors.slice(0, 5).map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                                {importResult.errors.length > 5 && (
                                    <li>...외 {importResult.errors.length - 5}건</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* 멤버 목록 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {searchTerm || selectedPart !== 'all'
                            ? '검색 결과가 없습니다'
                            : '등록된 멤버가 없습니다'}
                    </div>
                ) : (
                    filteredMembers.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-800">{member.name}</div>
                                    <div className="text-sm text-gray-600">
                                        {member.part} • {member.group}조
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingMember(member)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                >
                                    수정
                                </button>
                                <button
                                    onClick={() => handleDeleteMember(member.id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 멤버 추가/수정 폼 모달 */}
            {(showAddForm || editingMember) && (
                <MemberForm
                    member={editingMember}
                    onSave={handleSaveMember}
                    onCancel={() => {
                        setShowAddForm(false);
                        setEditingMember(null);
                    }}
                />
            )}
        </div>
    );
}

// 멤버 추가/수정 폼 컴포넌트
interface MemberFormProps {
    member: Member | null;
    onSave: (member: Omit<Member, 'id'>) => void;
    onCancel: () => void;
}

function MemberForm({ member, onSave, onCancel }: MemberFormProps) {
    const [name, setName] = useState(member?.name || '');
    const [part, setPart] = useState<Part>(member?.part || 'Soprano');
    const [group, setGroup] = useState(member?.group || '1');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        onSave({
            name: name.trim(),
            part,
            group,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="bg-indigo-600 text-white p-4">
                    <h3 className="text-lg font-bold">{member ? '멤버 수정' : '멤버 추가'}</h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">이름</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                            placeholder="멤버 이름 입력"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">파트</label>
                        <select
                            value={part}
                            onChange={(e) => setPart(e.target.value as Part)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                        >
                            {PARTS.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">조</label>
                        <select
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                        >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                <option key={num} value={num.toString()}>
                                    {num}조
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                        >
                            {member ? '수정' : '추가'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
