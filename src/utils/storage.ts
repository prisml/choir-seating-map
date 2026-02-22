import { SeatingMap, Member } from '../types';

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
 * 멤버 목록을 CSV 파일로 익스포트
 */
export const exportMembersAsCSV = (
    members: Record<string, Member>,
    filename = 'members.csv',
): void => {
    try {
        const BOM = '\uFEFF';
        let csv = BOM + '이름,파트,조\n';

        Object.values(members)
            .sort((a, b) => {
                const partOrder = ['Soprano', 'Alto', 'Tenor', 'Bass'];
                const partDiff = partOrder.indexOf(a.part) - partOrder.indexOf(b.part);
                if (partDiff !== 0) return partDiff;
                const groupDiff = parseInt(a.group) - parseInt(b.group);
                if (groupDiff !== 0) return groupDiff;
                return a.name.localeCompare(b.name);
            })
            .forEach((member) => {
                csv += `"${member.name}",${member.part},${member.group}\n`;
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
        console.error('멤버 CSV 익스포트 실패:', error);
        throw new Error('멤버 CSV 익스포트에 실패했습니다');
    }
};

/**
 * CSV 파일에서 멤버 목록 임포트
 * CSV 형식: 이름,파트,조 (헤더 포함)
 * 파트 값: Soprano, Alto, Tenor, Bass
 */
export const importMembersFromCSV = (
    file: File,
): Promise<{ members: Record<string, Member>; count: number; errors: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = (e.target?.result as string).replace(/^\uFEFF/, '');
                const lines = content.split(/\r?\n/).filter((line) => line.trim());

                if (lines.length < 2) {
                    reject(new Error('CSV 파일에 데이터가 없습니다'));
                    return;
                }

                const validParts = ['Soprano', 'Alto', 'Tenor', 'Bass'];
                const members: Record<string, Member> = {};
                const errors: string[] = [];
                let count = 0;

                // 첫 줄은 헤더, 두 번째 줄부터 데이터
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // CSV 파싱 (쌍따옴표 처리)
                    const fields = parseCSVLine(line);

                    if (fields.length < 3) {
                        errors.push(`${i + 1}번째 줄: 필드가 부족합니다 (이름,파트,조 필요)`);
                        continue;
                    }

                    const [name, part, group] = fields.map((f) => f.trim());

                    if (!name) {
                        errors.push(`${i + 1}번째 줄: 이름이 비어있습니다`);
                        continue;
                    }

                    if (!validParts.includes(part)) {
                        errors.push(
                            `${i + 1}번째 줄: "${part}"는 유효하지 않은 파트입니다 (Soprano/Alto/Tenor/Bass)`,
                        );
                        continue;
                    }

                    if (!group || isNaN(parseInt(group))) {
                        errors.push(`${i + 1}번째 줄: "${group}"는 유효하지 않은 조 번호입니다`);
                        continue;
                    }

                    const id = `m${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
                    members[id] = {
                        id,
                        name,
                        part: part as Member['part'],
                        group,
                    };
                    count++;
                }

                resolve({ members, count, errors });
            } catch (error) {
                reject(new Error('CSV 파일 파싱에 실패했습니다'));
            }
        };
        reader.onerror = () => {
            reject(new Error('파일 읽기에 실패했습니다'));
        };
        reader.readAsText(file);
    });
};

/**
 * CSV 한 줄 파싱 (쌍따옴표 지원)
 */
function parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                fields.push(current);
                current = '';
            } else {
                current += char;
            }
        }
    }
    fields.push(current);
    return fields;
}

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
