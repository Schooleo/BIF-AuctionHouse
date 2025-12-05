import { useParams } from "react-router-dom";
import SellerProductDetailsContainer from "@containers/seller/SellerProductDetailsContainer";

const SellerProductDetailsPage: React.FC = () => {
  const { id } = useParams();

    return <SellerProductDetailsContainer id={id || ""} />;
};

export default SellerProductDetailsPage;
