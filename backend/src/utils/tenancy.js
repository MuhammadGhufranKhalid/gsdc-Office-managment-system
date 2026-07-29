import mongoose from 'mongoose';

export const TENANT_MODELS = new Set();

/**
 * @param {mongoose.Model|string} model a model, or a model name
 */
export const isTenantScoped = (model) => {
  const Model = typeof model === 'string' ? mongoose.models[model] : model;
  return Boolean(Model?.schema?.path('companyId'));
};

export const isObjectIdType = (instance) =>
  String(instance || '').toLowerCase() === 'objectid';

/**
 * @param {mongoose.Schema} schema
 * @param {{ modelName?: string, required?: boolean }} options
 */
export const tenantPlugin = (schema, options = {}) => {
  const { modelName, required = true } = options;

  schema.add({
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required,
      index: true,
    },
  });

  if (modelName) TENANT_MODELS.add(modelName);
};

/**
 * @param {import('express').Request} req
 * @returns {object} a Mongo filter fragment (possibly empty)
 */
export const tenantFilter = (req) => {
  const { companyId, isSuperAdmin } = req.tenant || {};
  if (companyId) return { companyId };
  if (isSuperAdmin) return {}; 
  return { companyId: null };
};
