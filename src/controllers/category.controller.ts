import { Response } from "express";
import { Category } from "../models";
import { AuthRequest } from "../types";
import logger from "../utils/logger";

// Get all categories (public endpoint)
export const getAllCategories = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("-__v")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error("Get all categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
};

// Get category by ID
export const getCategoryById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ id, isActive: true }).select("-__v");

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error("Get category by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get category",
    });
  }
};

// Create new category (admin only)
export const createCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id, name } = req.body;

    // Check if category with this ID already exists
    const existingCategory = await Category.findOne({ id });
    if (existingCategory) {
      res.status(400).json({
        success: false,
        message: "Category with this ID already exists",
      });
      return;
    }

    const category = new Category({
      id,
      name,
    });

    await category.save();

    logger.info(`New category created: ${id} by user: ${req.user?.userId}`);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    logger.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// Update category (admin only)
export const updateCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const category = await Category.findOne({ id });
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    if (name) {
      category.name = name;
    }

    if (typeof isActive === "boolean") {
      category.isActive = isActive;
    }

    await category.save();

    logger.info(`Category updated: ${id} by user: ${req.user?.userId}`);

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    logger.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// Delete category (admin only) - soft delete by setting isActive to false
export const deleteCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ id });
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    category.isActive = false;
    await category.save();

    logger.info(`Category deleted: ${id} by user: ${req.user?.userId}`);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    logger.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};

// Get all categories including inactive ones (admin only)
export const getAllCategoriesAdmin = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const categories = await Category.find().select("-__v").sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error("Get all categories admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
};