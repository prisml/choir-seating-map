interface SeatingGridProps {
    section: string;
    rows: Record<number, number>;
    seats: Record<number, Record<string, string>>;
    members: Record<string, { id: string; name: string; part: string; group: string }>;
    onSeatClick: (section: string, row: number, seat: number) => void;
    isSelected: boolean;
}

export default function SeatingGrid({
    section,
    rows,
    seats,
    members,
    onSeatClick,
    isSelected,
}: SeatingGridProps) {
    return (
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{section}석</h3>
            <div className="space-y-3">
                {Object.entries(rows).map(([rowNum, seatCount]) => (
                    <div key={rowNum} className="flex items-center gap-4">
                        <div className="w-12 font-bold text-gray-700 text-right">{rowNum}열</div>
                        <div className="flex gap-2 flex-wrap">
                            {Array.from({ length: seatCount }).map((_, seatIdx) => {
                                const seatNumber = seatIdx + 1;
                                const seatKey = `Seat${seatNumber}`;
                                const memberId = seats[Number(rowNum)]?.[seatKey];
                                const member = memberId ? members[memberId] : null;

                                return (
                                    <button
                                        key={seatKey}
                                        onClick={() =>
                                            onSeatClick(section, Number(rowNum), seatNumber)
                                        }
                                        className={`
                      w-10 h-10 flex items-center justify-center text-xs font-semibold rounded
                      transition-all duration-200 transform hover:scale-110
                      ${
                          member
                              ? 'bg-blue-500 text-white border-2 border-blue-600'
                              : 'bg-gray-200 text-gray-800 border-2 border-gray-300 hover:bg-gray-300'
                      }
                    `}
                                        title={member ? member.name : '빈 자리'}
                                    >
                                        {member ? member.name.charAt(0) : '○'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
