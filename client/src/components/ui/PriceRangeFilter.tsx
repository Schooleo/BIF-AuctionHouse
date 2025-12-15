import React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { formatPrice } from "@utils/product";

interface PriceRangeFilterProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  min,
  max,
  value,
  onChange,
}) => {
  return (
    <div className="px-2 py-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Price Range</h3>
      
      {/* Formatted Display */}
      <div className="text-xs text-blue-900 font-medium mb-3 flex justify-between">
        <span>{formatPrice(value[0])}</span>
        <span>{formatPrice(value[1])}</span>
      </div>

      <div className="px-2 mb-6">
        <Slider
          range
          min={min}
          max={max}
          value={value}
          onChange={(val) => onChange(val as [number, number])}
          trackStyle={[{ backgroundColor: "#042443" }]} // Primary Blue
          handleStyle={[
            { borderColor: "#042443", backgroundColor: "#fff", opacity: 1 },
            { borderColor: "#042443", backgroundColor: "#fff", opacity: 1 },
          ]}
          railStyle={{ backgroundColor: "#e5e7eb" }}
        />
      </div>
    </div>
  );
};

export default PriceRangeFilter;
