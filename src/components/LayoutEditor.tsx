import { useState } from 'react';
import { SeatingMap, Section } from '../types';

interface LayoutEditorProps {
    seatingMap: SeatingMap;
    onUpdateLayout: (sections: Record<string, Section>) => void;
    onClose: () => void;
}

export default function LayoutEditor({ seatingMap, onUpdateLayout, onClose }: LayoutEditorProps) {
    const [sections, setSections] = useState<Record<string, Section>>(
        JSON.parse(JSON.stringify(seatingMap.sections)),
    );
    const [newSectionName, setNewSectionName] = useState('');

    // 새 섹션 추가
    const handleAddSection = () => {
        const name = newSectionName.trim().toUpperCase();
        if (!name || sections[name]) {
            alert(name ? '이미 존재하는 석 이름입니다' : '석 이름을 입력하세요');
            return;
        }
        setSections((prev) => ({
            ...prev,
            [name]: { rows: { 1: 4 } },
        }));
        setNewSectionName('');
    };

    // 섹션 삭제
    const handleDeleteSection = (sectionName: string) => {
        if (!confirm(`${sectionName}석을 삭제하시겠습니까?`)) return;
        setSections((prev) => {
            const updated = { ...prev };
            delete updated[sectionName];
            return updated;
        });
    };

    // 행 추가
    const handleAddRow = (sectionName: string) => {
        setSections((prev) => {
            const section = prev[sectionName];
            const rowNumbers = Object.keys(section.rows).map(Number);
            const newRowNum = Math.max(...rowNumbers, 0) + 1;
            return {
                ...prev,
                [sectionName]: {
                    ...section,
                    rows: { ...section.rows, [newRowNum]: 4 },
                },
            };
        });
    };

    // 행 삭제
    const handleDeleteRow = (sectionName: string, rowNum: number) => {
        setSections((prev) => {
            const section = prev[sectionName];
            const updatedRows = { ...section.rows };
            delete updatedRows[rowNum];
            return {
                ...prev,
                [sectionName]: { ...section, rows: updatedRows },
            };
        });
    };

    // 좌석 수 변경
    const handleSeatCountChange = (sectionName: string, rowNum: number, count: number) => {
        if (count < 1 || count > 20) return;
        setSections((prev) => ({
            ...prev,
            [sectionName]: {
                ...prev[sectionName],
                rows: { ...prev[sectionName].rows, [rowNum]: count },
            },
        }));
    };

    // 적용
    const handleApply = () => {
        onUpdateLayout(sections);
        onClose();
    };

    // 총 좌석 수 계산
    const getTotalSeats = () => {
        return Object.values(sections).reduce((total, section) => {
            return total + Object.values(section.rows).reduce((sum, count) => sum + count, 0);
        }, 0);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">🎹 레이아웃 설정</h2>
                    <div className="text-sm">총 {getTotalSeats()}석</div>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* 새 섹션 추가 */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            placeholder="새 석 이름 (예: C)"
                            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                            maxLength={2}
                        />
                        <button
                            onClick={handleAddSection}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
                        >
                            ➕ 석 추가
                        </button>
                    </div>

                    {/* 섹션별 설정 */}
                    {Object.entries(sections)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([sectionName, section]) => (
                            <div
                                key={sectionName}
                                className="border-2 border-gray-300 rounded-lg overflow-hidden"
                            >
                                {/* 섹션 헤더 */}
                                <div className="bg-gray-100 p-3 flex justify-between items-center">
                                    <h3 className="font-bold text-lg">{sectionName}석</h3>
                                    <div className="flex gap-2">
                                        <span className="text-sm text-gray-600">
                                            {Object.keys(section.rows).length}개 열 |{' '}
                                            {Object.values(section.rows).reduce((a, b) => a + b, 0)}
                                            석
                                        </span>
                                        <button
                                            onClick={() => handleDeleteSection(sectionName)}
                                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>

                                {/* 행 목록 */}
                                <div className="p-3 space-y-2">
                                    {Object.entries(section.rows)
                                        .sort(([a], [b]) => Number(a) - Number(b))
                                        .map(([rowNum, seatCount]) => (
                                            <div
                                                key={rowNum}
                                                className="flex items-center gap-3 bg-gray-50 p-2 rounded"
                                            >
                                                <span className="w-16 font-semibold">
                                                    {rowNum}열
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() =>
                                                            handleSeatCountChange(
                                                                sectionName,
                                                                Number(rowNum),
                                                                seatCount - 1,
                                                            )
                                                        }
                                                        className="w-8 h-8 bg-gray-300 rounded hover:bg-gray-400 font-bold"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={seatCount}
                                                        onChange={(e) =>
                                                            handleSeatCountChange(
                                                                sectionName,
                                                                Number(rowNum),
                                                                Number(e.target.value),
                                                            )
                                                        }
                                                        className="w-16 text-center border-2 border-gray-300 rounded py-1"
                                                        min={1}
                                                        max={20}
                                                    />
                                                    <button
                                                        onClick={() =>
                                                            handleSeatCountChange(
                                                                sectionName,
                                                                Number(rowNum),
                                                                seatCount + 1,
                                                            )
                                                        }
                                                        className="w-8 h-8 bg-gray-300 rounded hover:bg-gray-400 font-bold"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="text-sm text-gray-500">자리</span>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteRow(sectionName, Number(rowNum))
                                                    }
                                                    className="ml-auto px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}

                                    {/* 행 추가 버튼 */}
                                    <button
                                        onClick={() => handleAddRow(sectionName)}
                                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-indigo-400 hover:text-indigo-500"
                                    >
                                        ➕ 행 추가
                                    </button>
                                </div>
                            </div>
                        ))}

                    {Object.keys(sections).length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            섹션이 없습니다. 새 석을 추가하세요.
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="border-t p-4 flex gap-3 justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                    >
                        ✅ 적용
                    </button>
                </div>
            </div>
        </div>
    );
}
