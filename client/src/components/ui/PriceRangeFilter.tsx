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
    <div className="px-1 py-2">
      {/* Formatted Display */}

      <div className="px-1 mb-3">
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

      <div className="text-xs text-blue-900 font-medium flex justify-between">
        <span>{formatPrice(value[0])}</span>
        <span>{formatPrice(value[1])}</span>
      </div>
    </div>
  );
};

export default PriceRangeFilter;
