import React from 'react';
import { Slider } from "@/components/ui/slider";
import { format, fromUnixTime, getUnixTime, isValid } from 'date-fns';

export default function DateSlicer({ minDate, maxDate, value, onValueChange }) {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!minDate || !maxDate || !isValid(minDate) || !isValid(maxDate)) {
        return null;
    }

    const minTimestamp = getUnixTime(minDate);
    const maxTimestamp = getUnixTime(maxDate);

    const handleValueChange = (newTimestamps) => {
        onValueChange([
            fromUnixTime(newTimestamps[0]),
            fromUnixTime(newTimestamps[1]),
        ]);
    };

    const currentValue = [
        value?.[0] && isValid(value[0]) ? value[0] : minDate,
        value?.[1] && isValid(value[1]) ? value[1] : maxDate
    ];

    const valueTimestamps = [
        getUnixTime(currentValue[0]),
        getUnixTime(currentValue[1]),
    ];

    return (
        <div className="w-full">
            {/* Clean inline date range display and slider */}
            <div className={`${isMobile ? 'flex-col space-y-3' : 'flex items-center gap-4'}`}>
                {/* Date display - responsive layout */}
                <div className={`${isMobile ? 'flex justify-between items-center' : 'flex items-center gap-4'}`}>
                    {/* From date */}
                    <div className="flex items-center gap-2">
                        <span className={`text-slate-400 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>From:</span>
                        <div className={`bg-slate-700/40 px-2 py-1 rounded font-semibold text-blue-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {format(currentValue[0], isMobile ? 'MMM d' : 'MMM d, yyyy')}
                        </div>
                    </div>
                    
                    {/* To date */}
                    <div className="flex items-center gap-2">
                        <span className={`text-slate-400 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>To:</span>
                        <div className={`bg-slate-700/40 px-2 py-1 rounded font-semibold text-blue-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {format(currentValue[1], isMobile ? 'MMM d' : 'MMM d, yyyy')}
                        </div>
                    </div>
                </div>
                
                {/* Slider */}
                <div className={`${isMobile ? 'px-2' : 'flex-1 px-4'}`}>
                    <Slider
                        min={minTimestamp}
                        max={maxTimestamp}
                        step={86400} // one day in seconds
                        value={valueTimestamps}
                        onValueChange={handleValueChange}
                        className={`w-full ${isMobile ? 'touch-action-none' : ''}`}
                        style={isMobile ? { touchAction: 'none' } : {}}
                    />
                </div>
            </div>
        </div>
    );
}