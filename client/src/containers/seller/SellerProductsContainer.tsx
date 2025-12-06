import React from "react";
import { useLocation } from "react-router-dom";
import ActiveProductsContainer from "./ActiveProductsContainer";
import EndedProductsContainer from "./EndedProductsContainer";
import BidWinnersContainer from "./BidWinnersContainer";

const SellerProductsContainer: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname.includes("ended-products")) {
    return <EndedProductsContainer />;
  }

  if (pathname.includes("bid-winners")) {
    return <BidWinnersContainer />;
  }

  return <ActiveProductsContainer />;
};

export default SellerProductsContainer;
