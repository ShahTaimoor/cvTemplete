import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Template from '../models/Template.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const defaultTheme = (t) => ({
  primaryColor: t.primary,
  secondaryColor: t.secondary,
  backgroundColor: t.bg,
  fontFamily: t.font,
});

async function loadCatalog() {
  const mod = await import('../../../frontend/src/config/templateCatalog.js');
  return mod.TEMPLATE_CATALOG || mod.buildTemplateCatalog();
}

const seed = async () => {
  const catalog = await loadCatalog();
  await connectDB();

  for (const t of catalog) {
    await Template.findOneAndUpdate(
      { slug: t.slug },
      {
        slug: t.slug,
        name: t.name,
        layout: t.layout,
        sortOrder: t.sortOrder,
        isPremium: t.isPremium,
        planRequired: t.planRequired,
        category: t.category,
        defaultTheme: defaultTheme(t),
        isActive: true,
      },
      { upsert: true, new: true }
    );
  }

  console.log(`Seeded ${catalog.length} professional templates`);
  await mongoose.disconnect();
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
