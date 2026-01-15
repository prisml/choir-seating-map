import { SeatingMap } from '../types';

const STORAGE_KEY = 'choir_seating_map_data';

/**
 * localStorage에 배치도 저장
 */
export const saveToLocalStorage = (data: SeatingMap): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('localStorage 저장 실패:', error);
        throw new Error('로컬 저장에 실패했습니다');
    }
};

/**
 * localStorage에서 배치도 로드
 */
export const loadFromLocalStorage = (): SeatingMap | null => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('localStorage 로드 실패:', error);
        return null;
    }
};

/**
 * 배치도를 JSON 파일로 다운로드
 */
export const downloadAsJSON = (data: SeatingMap, filename = 'seating-map.json'): void => {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('JSON 다운로드 실패:', error);
        throw new Error('파일 다운로드에 실패했습니다');
    }
};

/**
 * JSON 파일을 읽어서 배치도 로드
 */
export const loadFromJSON = (file: File): Promise<SeatingMap> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content) as SeatingMap;
                resolve(data);
            } catch (error) {
                reject(new Error('유효한 JSON 파일이 아닙니다'));
            }
        };
        reader.onerror = () => {
            reject(new Error('파일 읽기에 실패했습니다'));
        };
        reader.readAsText(file);
    });
};

/**
 * 배치도를 CSV 형식으로 내보내기
 */
export const exportAsCSV = (data: SeatingMap, filename = 'seating-map.csv'): void => {
    try {
        let csv = 'Section,Row,Seat,MemberId,MemberName,Part,Group\n';

        Object.entries(data.seats).forEach(([section, rows]) => {
            Object.entries(rows).forEach(([row, seats]) => {
                Object.entries(seats).forEach(([seat, memberId]) => {
                    const member = data.members[memberId];
                    csv += `${section},${row},${seat},${memberId},"${member?.name || ''}",${
                        member?.part || ''
                    },${member?.group || ''}\n`;
                });
            });
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('CSV 내보내기 실패:', error);
        throw new Error('CSV 내보내기에 실패했습니다');
    }
};
