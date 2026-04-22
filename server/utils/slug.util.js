import slugify from 'slugify';

export const generateUniqueSlug = async (Model, title, excludeId = null) => {
  let slug = slugify(title, { lower: true, strict: true, trim: true });

  let query = { slug };
  if (excludeId) query._id = { $ne: excludeId };

  let existingDoc = await Model.findOne(query);
  if (!existingDoc) return slug;

  let counter = 1;
  let newSlug  = slug;

  while (existingDoc) {
    newSlug = slug + '-' + counter;
    query   = { slug: newSlug };
    if (excludeId) query._id = { $ne: excludeId };
    existingDoc = await Model.findOne(query);
    counter++;
  }

  return newSlug;
};

export const isValidSlug = (slug) => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};
