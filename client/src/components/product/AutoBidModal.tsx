import { useState, useEffect } from "react";
import PopUpWindow from "@components/ui/PopUpWindow";
import { bidderApi } from "@services/bidder.api";
import { useAuthStore } from "@stores/useAuthStore";
import { formatPrice } from "@utils/product";
import ErrorMessage from "@components/message/ErrorMessage";
import Spinner from "@components/ui/Spinner";
import { useAlertStore } from "@stores/useAlertStore";
import { ChevronUp, ChevronDown, AlertCircle, CheckCircle } from "lucide-react";
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
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const addAlert = useAlertStore((state) => state.addAlert);
  const user = useAuthStore((state) => state.user);

  // Calculate user reputation
  const userReputation = user ? 
    (user.positiveRatings || 0) + (user.negativeRatings || 0) === 0 
      ? 1 // No ratings = 100% reputation
      : (user.positiveRatings || 0) / ((user.positiveRatings || 0) + (user.negativeRatings || 0))
    : 1;
  const hasLowReputation = userReputation < 0.5; // Below 50% is considered low

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
    setWarning("");
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
    if (!isOpen) {
      setShowConfirmation(false);
      return;
    }

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

        if (
          data.myAutoBidMaxPrice &&
          data.myAutoBidStepPrice &&
          data.myAutoBidMaxPrice >= data.suggestedPrice
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
  }, [isOpen, productId]);

  const handleReviewBid = () => {
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

    setShowConfirmation(true);
  };

  const handleConfirmBid = async () => {
    try {
      setIsLoading(true);
      setError("");

      const maxVal = parseFloat(maxPrice);

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
      setShowConfirmation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEdit = () => {
    setShowConfirmation(false);
    setError("");
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={showConfirmation ? handleConfirmBid : handleReviewBid}
      title={
        showConfirmation
          ? "Confirm Auto Bid"
          : `Set Auto Bid for "${productName}"`
      }
      submitText={showConfirmation ? "Confirm & Place Bid" : "Set Auto Bid"}
      cancelText={showConfirmation ? "Back to Edit" : "Cancel"}
      onCancel={showConfirmation ? handleBackToEdit : undefined}
      isLoading={isLoading}
      isDisabled={!showConfirmation && hasLowReputation}
      size="md"
    >
      {isFetching ? (
        <div className="flex flex-col justify-center items-center h-32 gap-3">
          <Spinner />
          <p className="text-gray-600">Loading bid information...</p>
        </div>
      ) : showConfirmation ? (
        // Confirmation View
        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Review Your Auto Bid
                </h3>
                <p className="text-sm text-blue-800">
                  Please carefully review the details below before confirming
                  your automatic bid.
                </p>
              </div>
            </div>
          </div>

          {/* Bid Summary */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">Bid Summary</h4>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Product</span>
                <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">
                  {productName}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Current Price</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(currentPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Your Max Bid</span>
                <span className="font-bold text-primary-blue text-lg">
                  {formatPrice(parseFloat(maxPrice))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Bid Step</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(currentStepPrice)}
                </span>
              </div>
              {buyNowPrice && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Buy Now Price</span>
                  <span className="font-semibold text-green-600">
                    {formatPrice(buyNowPrice)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-indigo-900 mb-2 text-sm">
                  How Auto Bidding Works
                </h4>
                <ul className="text-xs text-indigo-800 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>
                      The system will automatically place bids on your behalf up
                      to your maximum amount
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>
                      Bids will increase by your chosen step price (
                      {formatPrice(currentStepPrice)})
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>
                      You'll only pay the minimum amount needed to win, not
                      necessarily your max bid
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {error && <ErrorMessage text={error} />}
        </div>
      ) : (
        // Input View
        <div className="space-y-6">
          {/* Low Reputation Warning */}
          {hasLowReputation && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 mb-1">
                    Low Reputation Score
                  </h3>
                  <p className="text-sm text-red-800">
                    Your reputation score is below 80% ({Math.round(userReputation * 100)}%). 
                    Auto bidding is disabled to protect sellers. Please improve your reputation 
                    by completing transactions successfully to use this feature.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                <span className="font-semibold text-green-600">
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
                  className="p-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDecrementStep}
                  disabled={currentStepPrice <= baseStepPrice}
                  className="p-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Must be a multiple of {formatPrice(baseStepPrice)}.
            </div>
          </div>

          <div className="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md font-medium">
            <span className="text-sm">
              Ready to auto-bid up to{" "}
              <span className="font-bold text-lg">
                {formatPrice(parseFloat(maxPrice))}
              </span>
            </span>
          </div>

          {error && <ErrorMessage text={error} />}
        </div>
      )}
    </PopUpWindow>
  );
};

export default AutoBidModal;
