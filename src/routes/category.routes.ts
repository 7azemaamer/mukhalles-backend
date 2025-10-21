import { Router, type Router as IRouter } from "express";

const router: IRouter = Router();

const categories = [
  { id: "import", name: { ar: "استيراد", en: "Import" }, isActive: true },
  { id: "export", name: { ar: "تصدير", en: "Export" }, isActive: true },
  { id: "vehicles", name: { ar: "مركبات", en: "Vehicles" }, isActive: true },
  { id: "fast", name: { ar: "سريع", en: "Fast" }, isActive: true },
  { id: "other", name: { ar: "أخرى", en: "Other" }, isActive: true },
];

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: categories,
  });
});

export default router;
