import { Category } from "../models/category.model";

export const CategoryService = {
  listCategories: async () => {
    const categories = await Category.find().lean();
    
    const roots = categories.filter(c => !c.parent);
    const children = categories.filter(c => c.parent);

    const result = roots.map(root => ({
      ...root,
      children: children.filter(c => c.parent?.toString() === root._id.toString())
    }));

    return result;
  }
};