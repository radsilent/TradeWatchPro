import React from 'react';
import { Slider } from "@/components/ui/slider";
import { format, fromUnixTime, getUnixTime, isValid } from 'date-fns';

export default function DateSlicer({ minDate, maxDate, value, onValueChange }) {
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
            <div className="flex items-center gap-4">
                {/* From date */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">From:</span>
                    <div className="bg-slate-700/40 px-2 py-1 rounded text-sm font-semibold text-blue-400">
                        {format(currentValue[0], 'MMM d, yyyy')}
                    </div>
                </div>
                
                {/* Slider */}
                <div className="flex-1 px-4">
                    <Slider
                        min={minTimestamp}
                        max={maxTimestamp}
                        step={86400} // one day in seconds
                        value={valueTimestamps}
                        onValueChange={handleValueChange}
                        className="w-full"
                    />
                </div>
                
                {/* To date */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">To:</span>
                    <div className="bg-slate-700/40 px-2 py-1 rounded text-sm font-semibold text-blue-400">
                        {format(currentValue[1], 'MMM d, yyyy')}
                    </div>
                </div>
            </div>
        </div>
    );
}