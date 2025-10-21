import { Category, City } from "../models";
import logger from "./logger";

const initialCategories = [
  { id: "import", name: { ar: "استيراد", en: "Import" }, isActive: true },
  { id: "export", name: { ar: "تصدير", en: "Export" }, isActive: true },
  { id: "vehicles", name: { ar: "مركبات", en: "Vehicles" }, isActive: true },
  { id: "fast", name: { ar: "سريع", en: "Fast" }, isActive: true },
  { id: "other", name: { ar: "أخرى", en: "Other" }, isActive: true },
];

const initialCities = [
  { id: "riyadh", name: { ar: "الرياض", en: "Riyadh" }, isActive: true },
  { id: "jeddah", name: { ar: "جدة", en: "Jeddah" }, isActive: true },
  { id: "dammam", name: { ar: "الدمام", en: "Dammam" }, isActive: true },
  { id: "mecca", name: { ar: "مكة", en: "Mecca" }, isActive: true },
  { id: "medina", name: { ar: "المدينة", en: "Medina" }, isActive: true },
  { id: "khobar", name: { ar: "الخبر", en: "Khobar" }, isActive: true },
  { id: "tabuk", name: { ar: "تبوك", en: "Tabuk" }, isActive: true },
  { id: "abha", name: { ar: "أبها", en: "Abha" }, isActive: true },
];

export const seedCategories = async (): Promise<void> => {
  try {
    const existingCategories = await Category.countDocuments();

    if (existingCategories === 0) {
      await Category.insertMany(initialCategories);
      logger.info("Initial categories seeded successfully");
    } else {
      logger.info("Categories already exist, skipping seeding");
    }
  } catch (error) {
    logger.error("Error seeding categories:", error);
    throw error;
  }
};

export const seedCities = async (): Promise<void> => {
  try {
    const existingCities = await City.countDocuments();

    if (existingCities === 0) {
      await City.insertMany(initialCities);
      logger.info("Initial cities seeded successfully");
    } else {
      logger.info("Cities already exist, skipping seeding");
    }
  } catch (error) {
    logger.error("Error seeding cities:", error);
    throw error;
  }
};

export const seedAll = async (): Promise<void> => {
  try {
    await Promise.all([seedCategories(), seedCities()]);
    logger.info("Database seeding completed successfully");
    return;
  } catch (error) {
    logger.error("Error during database seeding:", error);
    throw error;
  }
};
