import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import ProductImageCard from "@components/product/ProductImageCard";
import Spinner from "@components/ui/Spinner";
import ErrorMessage from "@components/message/ErrorMessage";
import EmptyMessage from "@components/message/EmptyMessage";
import PopUpWindow from "@components/ui/PopUpWindow";
import SellerProductSummary from "@components/seller/SellerProductSummary";
import SellerBidHistoryModal from "@components/seller/SellerBidHistoryModal";
import SellerQnaManager from "@components/seller/SellerQnaManager";
import { productApi } from "@services/product.api";
import { sellerApi } from "@services/seller.api";
import { orderApi } from "@services/order.api";
import { useAlertStore } from "@stores/useAlertStore";
import { checkRecentlyAdded, formatPrice, maskName } from "@utils/product";
import { formatBidTime } from "@utils/time";
import type { Product, ProductDetails, QuestionAnswer } from "@interfaces/product";
import { Loader2 } from "lucide-react";
import AppendDescriptionModal from "@components/seller/AppendDescriptionModal";
import { useSocket } from "@contexts/SocketContext";

interface SellerProductDetailsContainerProps {
  id: string;
}

interface BidUpdateData {
  currentPrice: number;
  bidCount: number;
  currentBidder: string;
  currentBidderRating: number;
  endTime: string;
}

const SellerProductDetailsContainer: React.FC<SellerProductDetailsContainerProps> = ({ id }) => {
  const addAlert = useAlertStore((state) => state.addAlert);
  const navigate = useNavigate();
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isBidHistoryOpen, setIsBidHistoryOpen] = useState(false);
  const [isConfirmWinnerOpen, setIsConfirmWinnerOpen] = useState(false);
  const [confirmingWinner, setConfirmingWinner] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<QuestionAnswer | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [rejectingBidderId, setRejectingBidderId] = useState<string | null>(null);

  const [isAppendModalOpen, setIsAppendModalOpen] = useState(false);

  // Real-time state
  const { socket, joinProductRoom, leaveProductRoom } = useSocket();
  const [showFire, setShowFire] = useState(false);

  const fetchDetails = useCallback(
    async (withLoader: boolean = true) => {
      if (!id) {
        setError("Product not found.");
        setLoading(false);
        return;
      }

      if (withLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await productApi.fetchProductDetails({ id });
        setDetails(data);
        setError(null);
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message || "Failed to load product details. Please try again.";
        setError(message);
        if (!withLoader) {
          addAlert("error", message);
        }
      } finally {
        if (withLoader) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [id, addAlert]
  );

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Socket Integration
  useEffect(() => {
    if (id) {
      joinProductRoom(id);

      if (socket) {
        socket.on("new_bid", (data: BidUpdateData) => {
          setDetails((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              product: {
                ...prev.product,
                currentPrice: data.currentPrice,
                bidCount: data.bidCount,
                endTime: data.endTime,
                // Update current bidder with dummy data for display
                currentBidder: {
                  ...prev.product.currentBidder,
                  _id: "socket-update",
                  name: data.currentBidder,
                  rating: data.currentBidderRating,
                  email: "",
                  role: "bidder",
                  isVerified: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as unknown as Product["currentBidder"],
              },
            };
          });

          setShowFire(true);
          setTimeout(() => setShowFire(false), 3000); // Show fire for 3s
        });
      }

      return () => {
        leaveProductRoom(id);
        if (socket) socket.off("new_bid");
      };
    }
  }, [id, socket, joinProductRoom, leaveProductRoom]);

  const product: Product | null = details?.product ?? null;

  const allImages = useMemo(() => {
    if (!product) return [];
    const images = [product.mainImage, ...(product.subImages ? product.subImages : [])].filter(Boolean) as string[];

    if (images.length === 0) {
      return ["/product/placeholder.png"];
    }

    return images;
  }, [product]);

  const sanitizedDescription = useMemo(() => {
    if (!product?.description) return "";
    return DOMPurify.sanitize(product.description);
  }, [product?.description]);

  const descriptionHistory = product?.descriptionHistory ?? [];

  const categoryName = useMemo(() => {
    if (!product) return "Unknown Category";
    if (typeof product.category === "string") {
      return product.category;
    }
    return product.category?.name ?? "Unknown Category";
  }, [product]);

  const questions = useMemo<QuestionAnswer[]>(() => {
    if (!details) return [];
    if (details.questions && details.questions.length > 0) {
      return details.questions;
    }
    return product?.questions ?? [];
  }, [details, product?.questions]);

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      const aAnswered = a.answer ? 1 : 0;
      const bAnswered = b.answer ? 1 : 0;

      if (aAnswered !== bAnswered) {
        return aAnswered - bAnswered;
      }

      return new Date(b.askedAt).getTime() - new Date(a.askedAt).getTime();
    });
  }, [questions]);

  const isEnded = useMemo(() => {
    if (!product) return false;
    return new Date(product.endTime).getTime() <= Date.now();
  }, [product]);

  const confirmDisabled = useMemo(() => {
    if (!product) return true;
    return !product.highestBidder || product.winnerConfirmed === true;
  }, [product]);

  const openAnswerModal = (question: QuestionAnswer) => {
    setActiveQuestion(question);
    setAnswerDraft(question.answer ?? "");
    setAnswerError(null);
  };

  const closeAnswerModal = () => {
    setActiveQuestion(null);
    setAnswerDraft("");
    setAnswerError(null);
    setIsSubmittingAnswer(false);
  };

  const handleAnswerSubmit = async () => {
    if (!product || !activeQuestion) return;
    const trimmed = answerDraft.trim();

    if (!trimmed) {
      setAnswerError("Answer is required.");
      return;
    }

    try {
      setIsSubmittingAnswer(true);
      const response = await sellerApi.answerQuestion(product._id, activeQuestion._id, trimmed);

      if (response?.message) {
        addAlert("success", response.message);
      } else {
        addAlert("success", "Answer saved successfully.");
      }

      await fetchDetails(false);
      closeAnswerModal();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || "Failed to submit answer. Please try again.";
      addAlert("error", message);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleRejectBidder = async (bidderId: string) => {
    if (!product) return;
    try {
      setRejectingBidderId(bidderId);
      const response = await sellerApi.rejectBidder(product._id, bidderId);

      if (response?.message) {
        addAlert("success", response.message);
      } else {
        addAlert("success", "Bidder rejected successfully.");
      }

      // Close modal before refresh to prevent stale data
      setIsBidHistoryOpen(false);

      // Fetch updated product data
      await fetchDetails(false);

      // Reopen modal with fresh data
      setTimeout(() => setIsBidHistoryOpen(true), 100);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || "Failed to reject bidder. Please try again.";
      addAlert("error", message);
      throw err;
    } finally {
      setRejectingBidderId(null);
    }
  };

  const handleConfirmWinner = async () => {
    if (!product || confirmDisabled) {
      setIsConfirmWinnerOpen(false);
      return;
    }

    try {
      setConfirmingWinner(true);
      const response = await sellerApi.confirmWinner(product._id);

      if (response?.message) {
        addAlert("success", response.message);
      } else {
        addAlert("success", "Winner confirmed successfully.");
      }

      await fetchDetails(false);
      setIsConfirmWinnerOpen(false);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || "Failed to confirm winner. Please try again.";
      addAlert("error", message);
    } finally {
      setConfirmingWinner(false);
    }
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    setDetails((prev) =>
      prev
        ? {
            ...prev,
            product: {
              ...prev.product,
              ...updatedProduct,
            },
          }
        : prev
    );
  };

  const handleManageTransaction = async () => {
    if (!product) return;
    try {
      // Assuming createOrder handles "get or create" logic
      const order = await orderApi.createOrder(product._id);
      navigate(`/seller/orders/${order._id}`);
    } catch (error) {
      console.error("Failed to navigate to order:", error);
      addAlert("error", "Failed to open order details.");
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 mx-auto max-w-3xl">
        <ErrorMessage text={error} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 mx-auto max-w-3xl">
        <EmptyMessage text="Product not found or no longer available." />
      </div>
    );
  }

  const winnerConfirmed = Boolean(product.winnerConfirmed);
  const highestBidAmount = product.currentPrice ?? product.startingPrice;

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 md:px-0">
        {refreshing && (
          <div className="flex justify-end items-center gap-2 text-sm text-gray-500 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Refreshing latest data...
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-10">
          <div className="w-full md:w-5/12 shrink-0">
            <ProductImageCard images={allImages} recentlyAdded={checkRecentlyAdded(product.startTime)} />
          </div>

          <div className="flex-1">
            <SellerProductSummary
              product={product}
              categoryName={categoryName}
              isEnded={isEnded}
              onOpenBidHistory={() => setIsBidHistoryOpen(true)}
              onConfirmWinner={() => setIsConfirmWinnerOpen(true)}
              confirmDisabled={confirmDisabled}
              confirmLoading={confirmingWinner}
              winnerConfirmed={winnerConfirmed}
              onManageTransaction={handleManageTransaction}
              showFire={showFire}
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 font-semibold">Starting Price</p>
            <p className="text-xl font-semibold text-gray-900">{formatPrice(product.startingPrice)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 font-semibold">Buy Now Price</p>
            <p className="text-xl font-semibold text-yellow-600">
              {product.buyNowPrice ? formatPrice(product.buyNowPrice) : "Not set"}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Highest Bidder / Bids</p>
                <p className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <span>{product.bidCount} bids</span>
                  {product.currentBidder && (
                    <span className="text-sm text-gray-600 font-normal">(by {product.currentBidder.name})</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 font-semibold">Rejected Bidders</p>
            <p className="text-xl font-semibold text-gray-900">{product.rejectedBidders?.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 font-semibold">Allow Unrated Bidders</p>
            <p
              className={
                product.allowUnratedBidders
                  ? "text-xl font-semibold text-green-700"
                  : "text-xl font-semibold text-red-700"
              }
            >
              {product.allowUnratedBidders ? "Allowed" : "Not allowed"}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 font-semibold">Auto-Extend</p>
            <p
              className={
                product.autoExtends ? "text-xl font-semibold text-green-700" : "text-xl font-semibold text-red-700"
              }
            >
              {product.autoExtends ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>

        <div className="mt-10 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Product Description</h2>
            <button
              type="button"
              onClick={() => setIsAppendModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary-blue rounded-lg hover:bg-primary-blue/90 transition"
            >
              Append Description
            </button>
          </div>
          <div
            className="prose prose-sm max-w-none text-gray-700 break-all"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        </div>

        {descriptionHistory.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description Update History</h3>
            <div className="space-y-4">
              {descriptionHistory.map((entry) => (
                <div key={entry.updatedAt} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-2">Updated {formatBidTime(entry.updatedAt)}</p>
                  <div
                    className="text-gray-700 prose prose-sm max-w-none break-all"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(entry.content),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <AppendDescriptionModal
          isOpen={isAppendModalOpen}
          onClose={() => setIsAppendModalOpen(false)}
          productId={product._id}
          onUpdate={handleProductUpdate}
        />

        <div className="mt-10">
          <SellerQnaManager
            questions={sortedQuestions}
            onAnswerClick={(question) => {
              setIsConfirmWinnerOpen(false);
              setIsBidHistoryOpen(false);
              openAnswerModal(question);
            }}
          />
        </div>
      </div>

      <SellerBidHistoryModal
        productId={product._id}
        isOpen={isBidHistoryOpen}
        onClose={() => setIsBidHistoryOpen(false)}
        onRejectBidder={handleRejectBidder}
        rejectedBidderIds={product.rejectedBidders ?? []}
        currentBidderId={
          typeof product.currentBidder === "object"
            ? product.currentBidder?._id
            : product.currentBidder
              ? String(product.currentBidder)
              : undefined
        }
        rejectingBidderId={rejectingBidderId}
        winnerConfirmed={winnerConfirmed}
      />

      <PopUpWindow
        isOpen={Boolean(activeQuestion)}
        onClose={closeAnswerModal}
        title={activeQuestion?.answer ? "Edit Answer" : "Answer Question"}
        submitText={activeQuestion?.answer ? "Update Answer" : "Submit Answer"}
        onSubmit={handleAnswerSubmit}
        isLoading={isSubmittingAnswer}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Question</p>
            <p className="text-sm text-gray-800">{activeQuestion?.question}</p>
            <p className="text-xs text-gray-500 mt-2">
              Asked by {activeQuestion?.questioner.name ?? "Unknown bidder"} on{" "}
              {activeQuestion ? formatBidTime(activeQuestion.askedAt) : "--"}
            </p>
          </div>

          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer
            </label>
            <textarea
              id="answer"
              value={answerDraft}
              onChange={(event) => {
                setAnswerDraft(event.target.value);
                setAnswerError(null);
              }}
              className="w-full min-h-[140px] border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition"
              placeholder="Provide a detailed answer to help the bidder."
              maxLength={2000}
            />
            {answerError && <p className="text-xs text-red-500 mt-2">{answerError}</p>}
            <p className="text-xs text-gray-400 mt-2">{answerDraft.trim().length} / 2000 characters</p>
          </div>
        </div>
      </PopUpWindow>

      <PopUpWindow
        isOpen={isConfirmWinnerOpen}
        onClose={() => setIsConfirmWinnerOpen(false)}
        title="Confirm Auction Winner"
        submitText={confirmDisabled ? "Close" : winnerConfirmed ? "Close" : "Confirm Winner"}
        onSubmit={confirmDisabled || winnerConfirmed ? () => setIsConfirmWinnerOpen(false) : handleConfirmWinner}
        isLoading={confirmingWinner}
      >
        <div className="space-y-4 text-sm text-gray-700">
          <p className="text-base">
            Current highest bidder: <span className="font-semibold">{product.highestBidder?.name ?? ""}</span>
          </p>
          <p className="text-blue-600 text-base">
            Final bid amount: <span className="font-semibold">{formatPrice(highestBidAmount)}</span>
          </p>
          {product.highestBidder?.rating !== undefined && (
            <p className="text-yellow-600 text-base">Bidder rating: {product.highestBidder.rating.toFixed(2)} ★</p>
          )}
          {winnerConfirmed ? (
            <p className="text-green-600 font-medium">You have already confirmed this winner.</p>
          ) : confirmDisabled ? (
            <p className="text-yellow-600">You cannot confirm a winner until there is an active highest bid.</p>
          ) : (
            <p className="text-red-700">
              Confirming the winner will finalize this auction. If you do not wish to award the product to the current
              highest bidder, reject them first from the bid history list to recalculate the winner.
            </p>
          )}
        </div>
      </PopUpWindow>
    </div>
  );
};

export default SellerProductDetailsContainer;
