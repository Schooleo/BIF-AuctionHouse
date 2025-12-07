import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { bidderApi } from "@services/bidder.api";
import type { AuctionItem, RateSellerDto } from "@interfaces/bidder";
import ProductCard from "@components/product/ProductCard";
import Spinner from "@components/ui/Spinner";
import RateSellerModal from "@components/user/RateSellerModal";
import WonAuctionCard from "./WonAuctionCard";

const WonAuctionsTab: React.FC = () => {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(
    null
  );
  const [ratingMode, setRatingMode] = useState<"create" | "update">("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const limit = 12;

  useEffect(() => {
    fetchAuctions();
  }, [page]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bidderApi.getWonAuctions(page, limit);
      setAuctions(response.data || []);
      console.log("Fetched won auctions:", response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || "Unable to load won auctions list");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRateModal = (
    auction: AuctionItem,
    mode: "create" | "update"
  ) => {
    setSelectedAuction(auction);
    setRatingMode(mode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAuction(null);
  };

  const handleSubmitRating = async (data: RateSellerDto) => {
    if (!selectedAuction?.seller?._id) return;

    try {
      setSubmitting(true);
      if (ratingMode === "create") {
        await bidderApi.rateSeller(selectedAuction.seller._id, data);
      } else {
        await bidderApi.updateSellerRating(selectedAuction.seller._id, data);
      }
      handleCloseModal();
      await fetchAuctions(); // Refresh list
    } catch (err: any) {
      alert(err.message || "Unable to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async (auction: AuctionItem) => {
    if (!auction.seller?._id) return;
    if (!confirm("Are you sure you want to delete this rating?")) return;

    try {
      await bidderApi.deleteSellerRating(auction.seller._id);
      await fetchAuctions(); // Refresh list
    } catch (err: any) {
      alert(err.message || "Unable to delete rating");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => fetchAuctions()}
          className="mt-4 text-blue-600 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-4">You haven't won any auctions yet</p>
        <button
          onClick={() => navigate("/products")}
          className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
        >
          Join Auctions Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {" "}
      {/* Changed from grid to stack */}
      {auctions.map((auction) => (
        <WonAuctionCard
          key={auction._id}
          auction={auction}
          onRate={() => handleOpenRateModal(auction, "create")}
          onUpdateRating={() => handleOpenRateModal(auction, "update")}
          onDeleteRating={() => handleDeleteRating(auction)}
        />
      ))}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
      {/* Rating Modal */}
      {selectedAuction && (
        <RateSellerModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitRating}
          sellerName={selectedAuction.seller?.name || "Seller"}
          productName={selectedAuction.name}
          existingRating={selectedAuction.myRating}
          mode={ratingMode}
          loading={submitting}
        />
      )}
    </div>
  );
};

export default WonAuctionsTab;
