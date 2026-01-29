import { useState, useRef } from 'react';
import { SeatingMap } from '../types';
import { useAuth } from '../hooks/useAuth';
import {
    saveToLocalStorage,
    loadFromLocalStorage,
    downloadAsJSON,
    loadFromJSON,
    exportAsCSV,
} from '../utils/storage';
import {
    loadSeatingMapFromSupabase,
    saveSeatingMapToSupabase,
} from '../services/seatingService';

interface DataManagerProps {
    data: SeatingMap;
    onLoadData: (data: SeatingMap) => void;
    onSaveSuccess: () => void;
}

export default function DataManager({ data, onLoadData, onSaveSuccess }: DataManagerProps) {
    const { user } = useAuth();
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
        null
    );
    const [cloudLoading, setCloudLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAutoSave = () => {
        try {
            saveToLocalStorage(data);
            showMessage('브라우저에 자동 저장되었습니다 ✅', 'success');
            onSaveSuccess();
        } catch (error) {
            showMessage('저장에 실패했습니다', 'error');
        }
    };

    const handleAutoLoad = () => {
        const savedData = loadFromLocalStorage();
        if (savedData) {
            onLoadData(savedData);
            showMessage('브라우저 데이터를 불러왔습니다 ✅', 'success');
        } else {
            showMessage('저장된 데이터가 없습니다', 'error');
        }
    };

    const handleDownload = () => {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            downloadAsJSON(data, `seating-map-${timestamp}.json`);
            showMessage('JSON 파일이 다운로드되었습니다 ✅', 'success');
        } catch (error) {
            showMessage('다운로드에 실패했습니다', 'error');
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const loadedData = await loadFromJSON(file);
            onLoadData(loadedData);
            showMessage('JSON 파일이 로드되었습니다 ✅', 'success');
        } catch (error) {
            showMessage(
                error instanceof Error ? error.message : '파일 로드에 실패했습니다',
                'error'
            );
        }

        // 같은 파일을 다시 선택할 수 있도록 input 초기화
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleExportCSV = () => {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            exportAsCSV(data, `seating-map-${timestamp}.csv`);
            showMessage('CSV 파일이 내보내졌습니다 ✅', 'success');
        } catch (error) {
            showMessage('CSV 내보내기에 실패했습니다', 'error');
        }
    };

    // 클라우드 저장 (Supabase)
    const handleCloudSave = async () => {
        if (!user) {
            showMessage('로그인이 필요합니다', 'error');
            return;
        }

        setCloudLoading(true);
        try {
            const success = await saveSeatingMapToSupabase(user.id, data);
            if (success) {
                showMessage('클라우드에 저장되었습니다 ☁️', 'success');
                onSaveSuccess();
            } else {
                showMessage('클라우드 저장에 실패했습니다', 'error');
            }
        } catch (error) {
            showMessage('클라우드 저장에 실패했습니다', 'error');
        } finally {
            setCloudLoading(false);
        }
    };

    // 클라우드 로드 (Supabase)
    const handleCloudLoad = async () => {
        if (!user) {
            showMessage('로그인이 필요합니다', 'error');
            return;
        }

        setCloudLoading(true);
        try {
            const loadedData = await loadSeatingMapFromSupabase(user.id);
            if (loadedData) {
                onLoadData(loadedData);
                showMessage('클라우드에서 불러왔습니다 ☁️', 'success');
            } else {
                showMessage('클라우드에 저장된 데이터가 없습니다', 'error');
            }
        } catch (error) {
            showMessage('클라우드 로드에 실패했습니다', 'error');
        } finally {
            setCloudLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* 메시지 표시 */}
            {message && (
                <div
                    className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                        message.type === 'success'
                            ? 'bg-green-100 text-green-800 border-2 border-green-400'
                            : 'bg-red-100 text-red-800 border-2 border-red-400'
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* 클라우드 저장/로드 (Supabase) */}
            <div className="space-y-2">
                <p className="text-xs font-bold text-gray-600">☁️ 클라우드 저장소</p>
                <div className="flex gap-2">
                    <button
                        onClick={handleCloudSave}
                        disabled={cloudLoading}
                        className="flex-1 px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all font-semibold text-sm disabled:opacity-50"
                    >
                        {cloudLoading ? '처리 중...' : '☁️ 클라우드 저장'}
                    </button>
                    <button
                        onClick={handleCloudLoad}
                        disabled={cloudLoading}
                        className="flex-1 px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all font-semibold text-sm disabled:opacity-50"
                    >
                        {cloudLoading ? '처리 중...' : '📥 클라우드 로드'}
                    </button>
                </div>
            </div>

            {/* 자동 저장/로드 */}
            <div className="space-y-2">
                <p className="text-xs font-bold text-gray-600">🔄 브라우저 저장소</p>
                <div className="flex gap-2">
                    <button
                        onClick={handleAutoSave}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold text-sm"
                    >
                        💾 자동 저장
                    </button>
                    <button
                        onClick={handleAutoLoad}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold text-sm"
                    >
                        📂 자동 로드
                    </button>
                </div>
            </div>

            {/* 파일 다운로드/업로드 */}
            <div className="space-y-2">
                <p className="text-xs font-bold text-gray-600">📄 파일 관리</p>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex-1 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all font-semibold text-sm"
                    >
                        ⬇️ JSON 다운로드
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all font-semibold text-sm"
                    >
                        ⬆️ JSON 업로드
                    </button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* CSV 내보내기 */}
            <div className="space-y-2">
                <p className="text-xs font-bold text-gray-600">📊 데이터 내보내기</p>
                <button
                    onClick={handleExportCSV}
                    className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold text-sm"
                >
                    📋 CSV 내보내기
                </button>
            </div>

            {/* 정보 */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 text-xs text-gray-700">
                <p className="font-semibold mb-1">💡 팁:</p>
                <ul className="space-y-1 list-disc list-inside">
                    <li>클라우드 저장: 어디서든 접근 가능 (로그인 필요)</li>
                    <li>자동 저장: 브라우저에 저장 (휴지통 정리 시 삭제)</li>
                    <li>JSON 다운로드: 파일로 백업 (언제든 복원 가능)</li>
                    <li>CSV 내보내기: 엑셀에서 열기 가능</li>
                </ul>
            </div>
        </div>
    );
}
