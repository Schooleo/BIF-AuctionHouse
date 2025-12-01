import { useState, useEffect } from "react";
import PopUpWindow from "@components/ui/PopUpWindow";
import { bidderApi } from "@services/bidder.api";
import { useAuthStore } from "@stores/useAuthStore";
import { formatPrice } from "@utils/product";
import ErrorMessage from "@components/message/ErrorMessage";
import Spinner from "@components/ui/Spinner";
import { useAlertStore } from "@stores/useAlertStore";

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onUpdateProduct?: (updatedProduct: any) => void;
}

const BidModal: React.FC<BidModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  onUpdateProduct,
}) => {
  const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [stepPrice, setStepPrice] = useState<number>(0);
  const [bidAmount, setBidAmount] = useState<string>("0");
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const addAlert = useAlertStore((state) => state.addAlert);

  const format = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value);

  const handleChangeBidAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const rawValue = value.replace(/[^\d]/g, "");

    if (rawValue === "") {
      setBidAmount("0");
      setDisplayValue("");
      return;
    }

    const numericValue = parseFloat(rawValue);
    setBidAmount(numericValue.toString());
    setDisplayValue(format(numericValue));
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchSuggestedPrice = async () => {
      try {
        setIsFetching(true);
        setError("");

        console.log("Fetching suggested price for productId:", productId);

        const data = await bidderApi.getSuggestedPrice(
          productId,
          useAuthStore.getState().token || ""
        );

        setCurrentPrice(data.currentPrice);
        setSuggestedPrice(data.suggestedPrice);
        setStepPrice(data.stepPrice);
        setBidAmount(data.suggestedPrice.toString());
        setDisplayValue(format(data.suggestedPrice));
      } catch (err: any) {
        console.error("Error fetching suggested price:", err);
        setError(
          err?.message || "Failed to fetch suggested price. Please try again."
        );
      } finally {
        setIsFetching(false);
      }
    };

    fetchSuggestedPrice();
  }, [isOpen]);

  const postPlaceBid = async (amount: number) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await bidderApi.placeBid(
        productId,
        amount,
        useAuthStore.getState().token || ""
      );

      addAlert("success", "Your bid has been placed successfully!");

      return response;
    } catch (err: any) {
      console.error("Error placing bid:", err);
      setError(err?.message || "Failed to place bid. Please try again.");
      addAlert("error", err?.message || "Failed to place bid. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError("");

      const bidValue = parseFloat(bidAmount);

      if (isNaN(bidValue) || bidValue <= 0) {
        setError("Please enter a valid bid amount.");
        return;
      }

      if (bidValue < suggestedPrice) {
        setError(`Bid amount must be at least ${formatPrice(suggestedPrice)}.`);
        return;
      }

      const response = await postPlaceBid(bidValue);

      if (onUpdateProduct && response?.data?.product) {
        onUpdateProduct(response.data.product);
      }
      onClose();
    } catch (err: any) {
      console.error("Error placing bid:", err);
      setError(err?.message || "Failed to place bid. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Place Your Bid for "${productName}"`}
      submitText="Place Bid"
      isLoading={isLoading}
      size="md"
    >
      {isFetching ? (
        <div className="flex justify-center items-center h-32">
          <Spinner />
          <p className="mt-4 text-gray-600">Loading bid information...</p>
        </div>
      ) : error && !currentPrice ? (
        <ErrorMessage text={error} />
      ) : (
        // Main content
        <div className="space-py-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">
              {productName}
            </h4>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Price:</span>
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Step Price:</span>
              <span className="text-sm font-semibold text-gray-700">
                {formatPrice(stepPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Suggested Bid:</span>
              <span className="text-lg font-bold text-primary-blue">
                {formatPrice(suggestedPrice)}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="bidAmount"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Type Your Bid Amount (VND)
            </label>
            <input
              id="bidAmount"
              type="text"
              value={displayValue}
              onChange={handleChangeBidAmount}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-lg"
              placeholder="Enter your bid amount"
              disabled={isLoading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Minimum bid: {formatPrice(suggestedPrice)}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              💡 Your bid must be at least {formatPrice(stepPrice)} higher than
              the current price.
            </p>
          </div>
        </div>
      )}
    </PopUpWindow>
  );
};

export default BidModal;
