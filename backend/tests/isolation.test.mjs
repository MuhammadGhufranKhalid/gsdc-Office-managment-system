process.env.JWT_SECRET = 'test_secret';

import path from 'path';
import { fileURLToPath } from 'url';
const B = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const mongoose = (await import('mongoose')).default;
const { crudFactory } = await import(`${B}/controllers/crudFactory.js`);
const { tenantFilter, TENANT_MODELS } = await import(`${B}/utils/tenancy.js`);
const { resolveTenantScope, companyAdminOnly, superAdminOnly, requireTenantForWrite } =
  await import(`${B}/middleware/tenant.js`);
const Project = (await import(`${B}/models/Project.js`)).default;
const Employee = (await import(`${B}/models/Employee.js`)).default;
const Team = (await import(`${B}/models/Team.js`)).default;
const Company = (await import(`${B}/models/Company.js`)).default;
const { isTenantScoped } = await import(`${B}/utils/tenancy.js`);

const A = new mongoose.Types.ObjectId(); // company A
const C = new mongoose.Types.ObjectId(); // company B
const DOC = new mongoose.Types.ObjectId();

let pass = 0, fail = 0;
const ok = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${extra}`); }
};
const thenable = (value) => {
  const q = {
    populate() { return q; }, sort() { return q; }, skip() { return q; },
    limit() { return q; }, select() { return q; }, session() { return q; },
    then(res) { return Promise.resolve(value).then(res); },
  };
  return q;
};

const captured = {};
const stub = (Model, docReturn = { _id: DOC }) => {
  Model.find = (f) => { captured.find = f; return thenable([]); };
  Model.countDocuments = (f) => { captured.count = f; return thenable(0); };
  Model.findOne = (f) => { captured.findOne = f; return thenable(docReturn); };
  Model.findById = (id) => { captured.findById = id; return thenable(docReturn); };
  Model.create = (p) => { captured.create = p; return Promise.resolve({ _id: DOC, ...p }); };
  Model.findOneAndUpdate = (f, p) => { captured.updFilter = f; captured.updPayload = p; return thenable(docReturn); };
  Model.findOneAndDelete = (f) => { captured.delFilter = f; return thenable(docReturn); };
  Model.findByIdAndUpdate = () => { captured.usedFindByIdAndUpdate = true; return thenable(docReturn); };
  Model.findByIdAndDelete = () => { captured.usedFindByIdAndDelete = true; return thenable(docReturn); };
};

const res = () => ({ status() { return this; }, json(b) { this.body = b; return this; }, cookie() { return this; } });
const run = async (handler, req) => {
  const r = res();
  await handler(req, r, (e) => { if (e) throw e; });
  return r;
};
const reqFor = (tenant, extra = {}) => ({
  query: {}, params: {}, body: {}, user: { _id: new mongoose.Types.ObjectId(), role: 'Company Admin' },
  tenant, ...extra,
});

console.log('\n=== 1. Registry ===');
ok(TENANT_MODELS.has('Project') && TENANT_MODELS.has('Employee') && TENANT_MODELS.has('Team'),
  'core models are registered as tenant-scoped');
ok(isTenantScoped(Project) && isTenantScoped(Employee) && isTenantScoped(Team),
  'schema-derived detection agrees (import-order independent)');
ok(!isTenantScoped(Company), 'Company itself is NOT tenant-scoped');
ok(Project.schema.path('companyId').isRequired && Employee.schema.path('companyId').isRequired,
  'companyId is required, so no document can exist without a tenant');

console.log('\n=== 2. tenantFilter fails closed ===');
ok(String(tenantFilter({ tenant: { companyId: A } }).companyId) === String(A),
  'company user is scoped to its own companyId');
ok(Object.keys(tenantFilter({ tenant: { isSuperAdmin: true } })).length === 0,
  'unscoped super admin gets a platform-wide filter');
ok(tenantFilter({ tenant: {} }).companyId === null,
  'principal with no company matches nothing (fails closed)');
ok(tenantFilter({}).companyId === null,
  'missing tenant context matches nothing (fails closed)');

console.log('\n=== 3. Reads are scoped ===');
stub(Project);
const pc = crudFactory(Project, { entityName: 'Project' });

await run(pc.list, reqFor({ companyId: A }));
ok(String(captured.find.companyId) === String(A), 'list() filters by companyId');
ok(String(captured.count.companyId) === String(A), 'list() count filters by companyId too');

await run(pc.get, reqFor({ companyId: A }, { params: { id: String(DOC) } }));
ok(captured.findOne && String(captured.findOne.companyId) === String(A),
  'get() uses findOne with companyId');
ok(!captured.findById, 'get() never uses bare findById (no id-guessing leak)');

console.log('\n=== 4. Cross-tenant read is refused ===');

Project.findOne = (f) => { captured.findOne = f; return thenable(null); };
let threw = null;
try { await run(pc.get, reqFor({ companyId: C }, { params: { id: String(DOC) } })); }
catch (e) { threw = e; }
ok(threw && threw.statusCode === 404,
  'reading another company\'s document returns 404', threw ? '' : '(no error thrown)');

console.log('\n=== 5. Writes force companyId ===');
stub(Project);

await run(pc.create, reqFor({ companyId: A }, {
  body: { name: 'X', companyId: String(C), _id: 'forged', createdAt: 'forged' },
}));
ok(String(captured.create.companyId) === String(A),
  'create() overrides a client-supplied companyId with the session one');
ok(captured.create._id === undefined && captured.create.createdAt === undefined,
  'create() strips _id / createdAt from the body');

captured.updPayload = null;
await run(pc.update, reqFor({ companyId: A }, {
  params: { id: String(DOC) }, body: { name: 'Y', companyId: String(C) },
}));
ok(captured.updPayload.companyId === undefined,
  'update() refuses to move a record to another company');
ok(String(captured.updFilter.companyId) === String(A),
  'update() filter is scoped to the caller\'s company');
ok(!captured.usedFindByIdAndUpdate, 'update() never uses unscoped findByIdAndUpdate');

await run(pc.remove, reqFor({ companyId: A }, { params: { id: String(DOC) } }));
ok(String(captured.delFilter.companyId) === String(A), 'remove() filter is scoped');
ok(!captured.usedFindByIdAndDelete, 'remove() never uses unscoped findByIdAndDelete');

console.log('\n=== 6. Cross-tenant references rejected on write ===');
stub(Project);
const foreignEmp = new mongoose.Types.ObjectId();
Employee.countDocuments = (f) => {
  captured.refCheck = f;
  return thenable(0);
};
threw = null;
try {
  await run(pc.create, reqFor({ companyId: A }, {
    body: { name: 'P', manager: String(foreignEmp) },
  }));
} catch (e) { threw = e; }
ok(threw && threw.statusCode === 400,
  'attaching another company\'s employee is rejected', threw ? '' : '(no error)');
ok(captured.refCheck && String(captured.refCheck.companyId) === String(A),
  'reference check is scoped to the caller\'s company');

Employee.countDocuments = () => thenable(1);
threw = null;
try {
  await run(pc.create, reqFor({ companyId: A }, {
    body: { name: 'P', manager: String(foreignEmp) },
  }));
} catch (e) { threw = e; }
ok(!threw, 'a same-company reference is accepted', threw ? threw.message : '');

console.log('\n=== 7. Super Admin scope resolution ===');
const r1 = reqFor({ companyId: A, isSuperAdmin: false }, { query: { companyId: String(C) } });
resolveTenantScope(r1, null, () => {});
ok(String(r1.tenant.companyId) === String(A),
  'a company user CANNOT widen scope via ?companyId');

const r2 = reqFor({ companyId: null, isSuperAdmin: true }, { query: { companyId: String(C) } });
resolveTenantScope(r2, null, () => {});
ok(String(r2.tenant.companyId) === String(C),
  'a super admin CAN scope itself via ?companyId');

const r3 = reqFor({ companyId: null, isSuperAdmin: true }, { query: { companyId: 'not-an-id' } });
let err = null;
resolveTenantScope(r3, null, (e) => { err = e; });
ok(err && err.statusCode === 400, 'a malformed ?companyId is rejected');

console.log('\n=== 8. Route guards ===');
err = null; superAdminOnly(reqFor({ companyId: A, isSuperAdmin: false }), null, (e) => { err = e; });
ok(err && err.statusCode === 403, 'superAdminOnly blocks a company user');
err = 'none'; superAdminOnly(reqFor({ isSuperAdmin: true }), null, (e) => { err = e; });
ok(err === undefined, 'superAdminOnly admits the super admin');

err = null; companyAdminOnly(reqFor({ companyId: null, isSuperAdmin: true }), null, (e) => { err = e; });
ok(err && err.statusCode === 403, 'companyAdminOnly blocks an UNSCOPED super admin');
err = 'none'; companyAdminOnly(reqFor({ companyId: C, isSuperAdmin: true }), null, (e) => { err = e; });
ok(err === undefined, 'companyAdminOnly admits a scoped super admin');
err = null;
companyAdminOnly({ ...reqFor({ companyId: A }), user: { role: 'Developer' } }, null, (e) => { err = e; });
ok(err && err.statusCode === 403, 'companyAdminOnly blocks a non-admin employee');
err = 'none';
companyAdminOnly({ ...reqFor({ companyId: A }), user: { role: 'Company Admin' } }, null, (e) => { err = e; });
ok(err === undefined, 'companyAdminOnly admits the Company Admin');

err = null; requireTenantForWrite(reqFor({ companyId: null, isSuperAdmin: true }), null, (e) => { err = e; });
ok(err && err.statusCode === 403, 'writes without a company context are refused');

console.log(`\n=========================================`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log(`=========================================\n`);
process.exit(fail ? 1 : 0);
