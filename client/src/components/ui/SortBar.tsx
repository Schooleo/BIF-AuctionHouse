import { useSearchParams } from "react-router-dom";
import type { ProductSortOption } from "@interfaces/product";

interface SortBarProps {
  sort: ProductSortOption;
  setSort: (sort: ProductSortOption) => void;
}

const SortBar: React.FC<SortBarProps> = ({ sort, setSort }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSortChange = (value: ProductSortOption) => {
    setSort(value);
    searchParams.set("sort", value);
    setSearchParams(searchParams);
  };

  return (
    <div className="flex mb-4">
      <label
        className="mr-2 self-center font-bold text-primary-blue"
        htmlFor="sort"
      >
        Sort:
      </label>
      <select
        value={sort}
        onChange={(e) => handleSortChange(e.target.value as ProductSortOption)}
        className="px-3 py-2 border rounded-md custom-select"
      >
        <option value="default">Default</option>
        <option value="endingSoon">Ending Soon</option>
        <option value="mostBidOn">Most Bid-On</option>
        <option value="highestPriced">Highest Priced</option>
      </select>
    </div>
  );
};

export default SortBar;
