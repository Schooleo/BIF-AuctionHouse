import { useParams } from "react-router-dom";
import ProductDetailsContainer from "@containers/ProductDetailsContainer";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams();

  return <ProductDetailsContainer id={id || ""} />;
};

export default ProductDetailsPage;
