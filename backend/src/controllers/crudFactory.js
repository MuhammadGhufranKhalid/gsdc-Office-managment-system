import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { tenantFilter, isTenantScoped, isObjectIdType } from '../utils/tenancy.js';
import ActivityLog from '../models/ActivityLog.js';

const IMMUTABLE_FIELDS = ['companyId', '_id', 'createdAt', 'updatedAt', '__v'];

const sanitize = (body = {}) => {
  const clean = { ...body };
  IMMUTABLE_FIELDS.forEach((f) => delete clean[f]);
  return clean;
};

const collectTenantRefs = (Model) => {
  const refs = [];
  Model.schema.eachPath((path, type) => {
    if (path === 'companyId') return;
    const isArray = type.instance === 'Array' && isObjectIdType(type.caster?.instance);
    const isSingle = isObjectIdType(type.instance);
    if (!isArray && !isSingle) return;
    const ref = type.options?.ref || type.caster?.options?.ref;
    if (ref && isTenantScoped(ref)) refs.push({ path, ref, isArray });
  });
  return refs;
};

/**
 * @param {mongoose.Model} Model
 * @param {object} options
 * @param {string[]} options.searchFields
 * @param {string[]} options.filterFields
 * @param {Array}    options.populate
 * @param {string}   options.entityName
 */
export const crudFactory = (Model, options = {}) => {
  const {
    searchFields = [],
    filterFields = [],
    populate = [],
    entityName = Model.modelName,
    beforeCreate = null,
  } = options;

  const tenantScoped = isTenantScoped(Model);
  let tenantRefs = null; // computed lazily, on first write

  const applyPopulate = (query) => {
    populate.forEach((p) => query.populate(p));
    return query;
  };

  const scope = (req) => (tenantScoped ? tenantFilter(req) : {});

  const log = async (req, action, entityId, meta = {}) => {
    try {
      await ActivityLog.create({
        actor: req.tenant?.isSuperAdmin ? undefined : req.user?._id,
        action,
        entityType: entityName,
        entityId,
        companyId: req.tenant?.companyId,
        meta,
      });
    } catch { }
  };

  const assertRefsInTenant = async (body, companyId) => {
    if (!tenantScoped || !companyId) return;
    if (tenantRefs === null) tenantRefs = collectTenantRefs(Model);

    for (const { path, ref, isArray } of tenantRefs) {
      const value = body[path];
      if (value === undefined || value === null || value === '') continue;

      const ids = (isArray ? value : [value]).filter(Boolean);
      if (!ids.length) continue;
      if (!ids.every((id) => mongoose.isValidObjectId(id))) {
        throw ApiError.badRequest(`Invalid reference supplied for '${path}'.`);
      }

      const found = await mongoose.model(ref).countDocuments({ _id: { $in: ids }, companyId });
      if (found !== new Set(ids.map(String)).size) {
        throw ApiError.badRequest(
          `Invalid reference for '${path}': the record does not exist in your company.`
        );
      }
    }
  };

  return {
    list: asyncHandler(async (req, res) => {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const skip = (page - 1) * limit;

      const filter = { ...scope(req) };

      if (req.query.search && searchFields.length) {
        const rx = new RegExp(req.query.search.trim(), 'i');
        filter.$or = searchFields.map((f) => ({ [f]: rx }));
      }

      filterFields.forEach((f) => {
        if (req.query[f] !== undefined && req.query[f] !== '') filter[f] = req.query[f];
      });

      const sort = req.query.sort || '-createdAt';

      const [items, total] = await Promise.all([
        applyPopulate(Model.find(filter).sort(sort).skip(skip).limit(limit)),
        Model.countDocuments(filter),
      ]);

      return sendSuccess(res, {
        data: items,
        meta: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }),

    get: asyncHandler(async (req, res) => {
      const doc = await applyPopulate(
        Model.findOne({ _id: req.params.id, ...scope(req) })
      );
      if (!doc) throw ApiError.notFound(`${entityName} not found`);
      return sendSuccess(res, { data: doc });
    }),

    create: asyncHandler(async (req, res) => {
      const payload = sanitize(req.body);
      const companyId = req.tenant?.companyId;

      if (tenantScoped) {
        if (!companyId) {
          throw ApiError.forbidden('A company context is required to create this record.');
        }
        await assertRefsInTenant(payload, companyId);
        payload.companyId = companyId;
      }

      const finalPayload = beforeCreate
        ? await beforeCreate(payload, req)
        : payload;

      const doc = await Model.create(finalPayload);
      await log(req, 'created', doc._id, { name: doc.name || doc.title });
      return sendSuccess(res, { statusCode: 201, message: `${entityName} created`, data: doc });
    }),

    update: asyncHandler(async (req, res) => {
      const payload = sanitize(req.body);
      const companyId = req.tenant?.companyId;

      if (tenantScoped) await assertRefsInTenant(payload, companyId);

      const doc = await Model.findOneAndUpdate(
        { _id: req.params.id, ...scope(req) },
        payload,
        { new: true, runValidators: true }
      );
      if (!doc) throw ApiError.notFound(`${entityName} not found`);
      await log(req, 'updated', doc._id);
      return sendSuccess(res, { message: `${entityName} updated`, data: doc });
    }),

    remove: asyncHandler(async (req, res) => {
      const doc = await Model.findOneAndDelete({ _id: req.params.id, ...scope(req) });
      if (!doc) throw ApiError.notFound(`${entityName} not found`);
      await log(req, 'deleted', doc._id);
      return sendSuccess(res, { message: `${entityName} deleted` });
    }),
  };
};
