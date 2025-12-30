import { Category, ICategory } from "../models/category.model";
import { Product } from "../models/product.model";

export const CategoryService = {
  // Helper to get stats for a single category
  getStatsForCategory: async (categoryId: string) => {
    const productCount = await Product.countDocuments({ category: categoryId });

    // Most bid-on and ongoing product
    const mostBidProduct = await Product.findOne({
      category: categoryId,
      endTime: { $gt: new Date() },
    })
      .sort({ bidCount: -1 })
      .select("mainImage")
      .lean();

    return {
      productCount,
      representativeImage: mostBidProduct?.mainImage || null,
    };
  },

  listCategories: async (includeStats = false) => {
    const categories = await Category.find().lean();

    // Helper to get stats for a single category
    const getStats = async (catId: string) => {
      const productCount = await Product.countDocuments({ category: catId });
      const mostBidProduct = await Product.findOne({
        category: catId,
        endTime: { $gt: new Date() },
      })
        .sort({ bidCount: -1 })
        .select("mainImage")
        .lean();
      return {
        productCount,
        representativeImage: mostBidProduct?.mainImage || null,
      };
    };

    const roots = categories.filter((c) => !c.parent);
    const children = categories.filter((c) => c.parent);

    // Process children first to get their stats
    const childrenWithStats = await Promise.all(
      children.map(async (child) => {
        if (!includeStats) return child;
        const stats = await getStats(child._id.toString());
        return { ...child, ...stats };
      })
    );

    // Process roots
    const result = await Promise.all(
      roots.map(async (root) => {
        let rootStats = includeStats
          ? await getStats(root._id.toString())
          : { productCount: 0, representativeImage: null };
        const myChildren = childrenWithStats.filter(
          (c) => c.parent?.toString() === root._id.toString()
        );

        // Aggregate stats from children for the root
        if (includeStats) {
          const childrenProductCount = myChildren.reduce(
            (sum, child: any) => sum + (child.productCount || 0),
            0
          );
          rootStats.productCount += childrenProductCount;

          // If root doesn't have an image, try to take from a child (simple heuristic: first child with image, or most popular child)
          if (!rootStats.representativeImage && myChildren.length > 0) {
            const childWithImage = myChildren.find(
              (c: any) => c.representativeImage
            );
            if (childWithImage) {
              rootStats.representativeImage = (
                childWithImage as any
              ).representativeImage;
            }
          }
        }

        return {
          ...root,
          ...rootStats,
          children: myChildren,
        };
      })
    );

    return result;
  },

  listCategoriesPaginated: async (
    page: number,
    limit: number,
    includeStats = false
  ) => {
    const skip = (page - 1) * limit;

    // Count total roots
    const totalRoots = await Category.countDocuments({ parent: null });
    const totalPages = Math.ceil(totalRoots / limit);

    // Fetch roots for this page
    const roots = await Category.find({ parent: null })
      .skip(skip)
      .limit(limit)
      .lean();

    const rootIds = roots.map((r) => r._id);

    // Fetch children for these roots
    const children = await Category.find({ parent: { $in: rootIds } }).lean();

    // Helper to get stats (reused logic, but simpler to repeat or extract if we could)
    const getStats = async (catId: string) => {
      const productCount = await Product.countDocuments({ category: catId });
      const mostBidProduct = await Product.findOne({
        category: catId,
        endTime: { $gt: new Date() },
      })
        .sort({ bidCount: -1 })
        .select("mainImage")
        .lean();
      return {
        productCount,
        representativeImage: mostBidProduct?.mainImage || null,
      };
    };

    // Calculate stats for children
    const childrenWithStats = await Promise.all(
      children.map(async (child) => {
        if (!includeStats) return child;
        const stats = await getStats(child._id.toString());
        return { ...child, ...stats };
      })
    );

    // Assemble result
    const categoriesWithStats = await Promise.all(
      roots.map(async (root) => {
        let rootStats = includeStats
          ? await getStats(root._id.toString())
          : { productCount: 0, representativeImage: null };
        const myChildren = childrenWithStats.filter(
          (c) => c.parent?.toString() === root._id.toString()
        );

        if (includeStats) {
          const childrenProductCount = myChildren.reduce(
            (sum, child: any) => sum + (child.productCount || 0),
            0
          );
          rootStats.productCount += childrenProductCount;
          if (!rootStats.representativeImage && myChildren.length > 0) {
            const childWithImage = myChildren.find(
              (c: any) => c.representativeImage
            );
            if (childWithImage) {
              rootStats.representativeImage = (
                childWithImage as any
              ).representativeImage;
            }
          }
        }

        return {
          ...root,
          ...rootStats,
          children: myChildren,
        };
      })
    );

    return {
      categories: categoriesWithStats,
      total: totalRoots,
      totalPages,
      page,
    };
  },

  createCategory: async (name: string, parentId?: string) => {
    const category = new Category({
      name,
      parent: parentId || null,
    });
    return await category.save();
  },

  updateCategory: async (
    id: string,
    name: string,
    newSubCategories?: string[]
  ) => {
    const category = await Category.findById(id);
    if (!category) throw new Error("Category not found");

    if (name) category.name = name;
    await category.save();

    // Create new sub-categories if provided
    if (newSubCategories && newSubCategories.length > 0) {
      const subCats = newSubCategories.map((subName) => ({
        name: subName,
        parent: id,
      }));
      await Category.insertMany(subCats);
    }

    return category;
  },

  deleteCategory: async (id: string) => {
    // Check for products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw new Error("Cannot delete category with products");
    }

    // Check for sub-categories
    const childCount = await Category.countDocuments({ parent: id });
    if (childCount > 0) {
      throw new Error(
        "Cannot delete category with sub-categories. Please delete them first."
      );
    }

    return await Category.findByIdAndDelete(id);
  },
};
