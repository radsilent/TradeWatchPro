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
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900/80 via-slate-900/50 to-transparent z-[1000]">
            <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-100 mb-3 px-1">
                    <span>{format(currentValue[0], 'MMM d, yyyy')}</span>
                    <span className="text-slate-400">Date Range</span>
                    <span>{format(currentValue[1], 'MMM d, yyyy')}</span>
                </div>
                <Slider
                    min={minTimestamp}
                    max={maxTimestamp}
                    step={86400} // one day in seconds
                    value={valueTimestamps}
                    onValueChange={handleValueChange}
                    className="w-full"
                />
            </div>
        </div>
    );
}