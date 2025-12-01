import React from "react";
import WatchlistContainer from "@containers/user/WatchlistContainer";

const WatchListPage: React.FC = () => {
  return (
    <div className="watchlist-page-wrapper py-8">
      <WatchlistContainer />
    </div>
  );
};

export default WatchListPage;