import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@stores/useAuthStore";
import { useAlertStore } from "@stores/useAlertStore";
import { CheckCircle, Truck, Package, Star, ChevronRight } from "lucide-react";
import { orderApi } from "@services/order.api";
import type { Order } from "@interfaces/order";

import Step1Payment from "@components/order/Step1Payment";
import Step2Shipping from "@components/order/Step2Shipping";
import Step3Receipt from "@components/order/Step3Receipt";
import Step4Rating from "@components/order/Step4Rating";
import OrderChat from "@components/order/OrderChat";
import type { UserSummary } from "@interfaces/product";

const OrderCompletionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // This must be the ORDER ID
  // const navigate = useNavigate();
  const { user } = useAuthStore();
  const addAlert = useAlertStore((state) => state.addAlert);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderApi.getOrder(id!);
        setOrder(data);
        setCurrentStep(data.step);
      } catch (error) {
        console.error("Failed to load order", error);
        addAlert("error", "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchOrder();
    }
  }, [id, addAlert]);

  const handleUpdate = (updatedOrder: Order) => {
    setOrder(updatedOrder);
    setCurrentStep(updatedOrder.step);
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading order details...
      </div>
    );
  if (!order || !user)
    return (
      <div className="p-8 text-center text-red-500">
        Order not found or unauthorized.
      </div>
    );

  // Helper to safely compare IDs whether populated string or object
  const getUserId = (u: UserSummary) => (u._id ? u._id.toString() : "");

  const isSeller = getUserId(order.seller) === user.id;
  const isBuyer = getUserId(order.buyer) === user.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className={`text-2xl font-bold mb-2`}>Order Completion Status</h1>
        <p
          className={`text-gray-600 ${
            order.status === "CANCELLED" ? "text-gray-400" : ""
          }`}
        >
          Order #{id?.slice(-8)} • {order.product?.name}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Process Area */}
        <div className="flex-1">
          {/* Stepper */}
          <div className="flex items-start justify-between mb-10 mt-4 px-4 sm:px-10">
            {[
              { step: 1, icon: CheckCircle, label: "Payment" },
              { step: 2, icon: Truck, label: "Shipping" },
              { step: 3, icon: Package, label: "Receipt" },
              { step: 4, icon: Star, label: "Rating" },
            ].map((s, index, array) => (
              <React.Fragment key={s.step}>
                {/* Step Item */}
                <div className="flex flex-col items-center gap-2 relative z-10 group cursor-default">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                      order.status === "CANCELLED"
                        ? "bg-red-50 border-gray-300 text-gray-300 opacity-50"
                        : currentStep > s.step
                          ? "bg-blue-600 border-blue-600 text-white visited"
                          : currentStep === s.step
                            ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-50 active-step"
                            : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {order.status !== "CANCELLED" && currentStep > s.step ? (
                      <CheckCircle size={24} className="stroke-[2.5]" />
                    ) : (
                      <s.icon
                        size={24}
                        className={
                          order.status !== "CANCELLED" && currentStep === s.step
                            ? "stroke-[2.5]"
                            : ""
                        }
                      />
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold tracking-wide transition-colors duration-300 ${
                      order.status === "CANCELLED"
                        ? "text-gray-400"
                        : currentStep >= s.step
                          ? "text-blue-700"
                          : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Connector Arrow */}
                {index < array.length - 1 && (
                  <div className="flex-1 flex items-center self-start h-12 px-2">
                    <div
                      className={`h-0.5 w-full rounded-full transition-colors duration-500 ${
                        order.status !== "CANCELLED" && currentStep > s.step
                          ? "bg-blue-600"
                          : "bg-gray-200"
                      }`}
                    />
                    <div
                      className={`mx-1 transition-colors duration-500 ${
                        order.status !== "CANCELLED" && currentStep > s.step
                          ? "text-blue-600"
                          : "text-gray-300"
                      }`}
                    >
                      <ChevronRight size={20} className="stroke-3" />
                    </div>
                    <div
                      className={`h-0.5 w-full rounded-full transition-colors duration-500 ${
                        order.status !== "CANCELLED" && currentStep > s.step
                          ? "bg-blue-600"
                          : "bg-gray-200"
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
            {order.status === "CANCELLED" ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} className="text-red-500 rotate-45" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Transaction Cancelled
                </h2>
                <p className="text-gray-500 max-w-md">
                  This transaction has been cancelled. If this was a mistake,
                  please contact support or check the bid winner options.
                </p>
              </div>
            ) : (
              <>
                {currentStep === 1 && (
                  <Step1Payment
                    order={order}
                    isBuyer={isBuyer}
                    onUpdate={handleUpdate}
                  />
                )}
                {currentStep === 2 && (
                  <Step2Shipping
                    order={order}
                    isSeller={isSeller}
                    onUpdate={handleUpdate}
                  />
                )}
                {currentStep === 3 && (
                  <Step3Receipt
                    order={order}
                    isBuyer={isBuyer}
                    onUpdate={handleUpdate}
                  />
                )}
                {currentStep === 4 && (
                  <Step4Rating
                    order={order}
                    isSeller={isSeller}
                    onUpdate={handleUpdate}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col sticky top-24">
            <OrderChat orderId={order._id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCompletionPage;
