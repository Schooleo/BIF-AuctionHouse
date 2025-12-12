import { useState, useEffect } from "react";
import PopUpWindow from "@components/ui/PopUpWindow";
import { bidderApi } from "@services/bidder.api";
import { useAuthStore } from "@stores/useAuthStore";
import { formatPrice } from "@utils/product";
import ErrorMessage from "@components/message/ErrorMessage";
import Spinner from "@components/ui/Spinner";
import { useAlertStore } from "@stores/useAlertStore";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Product } from "@interfaces/product";

interface AutoBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onUpdateProduct?: (updatedProduct: Product) => void;
}

const AutoBidModal: React.FC<AutoBidModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
}) => {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [baseStepPrice, setBaseStepPrice] = useState<number>(0);
  const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
  const [buyNowPrice, setBuyNowPrice] = useState<number | undefined>(undefined);

  // User Inputs
  const [maxPrice, setMaxPrice] = useState<string>("0");
  const [currentStepPrice, setCurrentStepPrice] = useState<number>(0);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [warning, setWarning] = useState<string>("");
  const addAlert = useAlertStore((state) => state.addAlert);

  const handleChangeMaxPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const rawValue = value.replace(/[^\d]/g, "");
    if (rawValue === "") {
      setMaxPrice("0");
      setWarning("");
      setError("");
      return;
    }
    setMaxPrice(rawValue);
    setWarning(""); // Xóa cảnh báo khi thay đổi
    setError("");
  };

  const handleBlurMaxPrice = () => {
    setIsInputFocused(false);
    const val = parseFloat(maxPrice);
    if (isNaN(val) || val < suggestedPrice) {
      setMaxPrice(suggestedPrice.toString());
      setWarning("");
      setError("");
    } else if (buyNowPrice && val > buyNowPrice) {
      // Đặt giá trần thành giá mua ngay
      setMaxPrice(buyNowPrice.toString());
      setWarning("You're currently setting the Highest Amount possible");
      setError("");
    }
  };

  const handleFocusMaxPrice = () => {
    setIsInputFocused(true);
    if (maxPrice === "0") {
      setMaxPrice("");
    }
  };

  const handleIncrementStep = () => {
    setCurrentStepPrice((prev) => prev + baseStepPrice);
    setError("");

    const newStepPrice = currentStepPrice + baseStepPrice;
    if (newStepPrice + currentPrice >= parseInt(maxPrice)) {
      setMaxPrice((currentPrice + newStepPrice).toString());
    }
  };

  const handleDecrementStep = () => {
    if (currentStepPrice > baseStepPrice) {
      setCurrentStepPrice((prev) => prev - baseStepPrice);
      setError("");
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchSuggested = async () => {
      try {
        setIsFetching(true);
        setError("");
        const data = await bidderApi.getSuggestedPrice(
          productId,
          useAuthStore.getState().token || ""
        );
        setCurrentPrice(data.currentPrice);
        setBaseStepPrice(data.stepPrice);
        setSuggestedPrice(data.suggestedPrice);
        setBuyNowPrice(data.buyNowPrice);

        // Khởi tạo ban đầu
        if (
          data.myAutoBidMaxPrice &&
          data.myAutoBidStepPrice &&
          data.myAutoBidMaxPrice >= currentPrice
        ) {
          setMaxPrice(data.myAutoBidMaxPrice.toString());
          setCurrentStepPrice(data.myAutoBidStepPrice);
        } else {
          setMaxPrice(data.suggestedPrice.toString());
          setCurrentStepPrice(data.stepPrice);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch info.";
        setError(message);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSuggested();
  }, [isOpen, productId, currentPrice]);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError("");

      const maxVal = parseFloat(maxPrice);

      if (isNaN(maxVal) || maxVal <= 0) {
        setError("Please enter a valid amount.");
        return;
      }

      if (maxVal < suggestedPrice) {
        setError(`Max amount must be at least ${formatPrice(suggestedPrice)}.`);
        return;
      }

      if (buyNowPrice && maxVal > buyNowPrice) {
        setError(
          `Max amount cannot exceed Buy Now price (${formatPrice(buyNowPrice)}).`
        );
        return;
      }

      if (currentStepPrice % baseStepPrice !== 0) {
        setError(
          `Step price must be a multiple of ${formatPrice(baseStepPrice)}.`
        );
        return;
      }

      await bidderApi.setAutoBid(
        productId,
        maxVal,
        currentStepPrice,
        useAuthStore.getState().token || ""
      );

      addAlert("success", "Auto Bid set successfully!");
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to set auto bid.";
      setError(message);
      addAlert("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Set Auto Bid for "${productName}"`}
      submitText="Update"
      isLoading={isLoading}
      size="md"
    >
      {isFetching ? (
        <div className="flex justify-center items-center h-32">
          <Spinner />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Info Section */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Price:</span>
              <span className="font-bold">{formatPrice(currentPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Min Increment:</span>
              <span className="font-semibold">
                {formatPrice(baseStepPrice)}
              </span>
            </div>
            {buyNowPrice && (
              <div className="flex justify-between">
                <span className="text-gray-600">Buy Now Price:</span>
                <span className="font-semibold text-red-600">
                  {formatPrice(buyNowPrice)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Min Valid Bid:</span>
              <span className="font-bold text-primary-blue">
                {formatPrice(suggestedPrice)}
              </span>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Set Highest Amount (VND)
            </label>
            <div className="relative">
              <input
                type="text"
                value={
                  isInputFocused
                    ? maxPrice
                    : new Intl.NumberFormat("vi-VN").format(
                        parseFloat(maxPrice) || 0
                      )
                }
                onChange={handleChangeMaxPrice}
                onBlur={handleBlurMaxPrice}
                onFocus={handleFocusMaxPrice}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-lg"
              />
              <div className="mt-1 text-xs text-gray-500">
                The system will bid up to this amount for you.
              </div>
              {warning && (
                <div className="mt-1 text-xs text-orange-600 font-medium">
                  {warning}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Set Bid Step (VND)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-lg font-medium">
                {formatPrice(currentStepPrice)}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={handleIncrementStep}
                  className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDecrementStep}
                  disabled={currentStepPrice <= baseStepPrice}
                  className="p-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Must be a multiple of {formatPrice(baseStepPrice)}.
            </div>
          </div>

          <div className="flex items-center justify-center p-2 bg-blue-50 text-blue-700 rounded-md font-medium animate-pulse">
            Currently bidding...{" "}
            <span className="m-1 font-bold">
              {formatPrice(parseFloat(maxPrice))}
            </span>
          </div>

          {error && <ErrorMessage text={error} />}
        </div>
      )}
    </PopUpWindow>
  );
};

export default AutoBidModal;
