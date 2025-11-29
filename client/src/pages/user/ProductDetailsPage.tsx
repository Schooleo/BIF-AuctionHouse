import { useParams } from "react-router-dom";
import ProductDetailsContainer from "@containers/user/ProductDetailsContainer";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams();

  return <ProductDetailsContainer id={id || ""} />;
};

export default ProductDetailsPage;
