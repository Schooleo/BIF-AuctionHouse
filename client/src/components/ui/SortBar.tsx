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
    searchParams.set("page", "1"); 
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
        <option value="default">Newest First (Default)</option>
        <option value="oldest">Oldest First</option>
        <option value="endingSoon">Ending Soonest</option>
        <option value="endingLatest">Ending Latest</option>
        <option value="mostBidOn">Most Bid-On</option>
        <option value="leastBidOn">Least Bid-On</option>
        <option value="highestPriced">Highest Price</option>
        <option value="lowestPriced">Lowest Price</option>
      </select>
    </div>
  );
};

export default SortBar;
