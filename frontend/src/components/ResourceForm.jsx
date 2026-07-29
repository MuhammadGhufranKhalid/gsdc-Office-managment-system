import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal.jsx';
import { resource as resourceApi } from '../services/api.js';


export default function ResourceForm({ open, onClose, onSubmit, fields, initial, title, saving }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Options for fields that reference another resource (e.g. an employee's
  // team). Fetched when the form opens; the API already scopes the list to the
  // caller's company, so only same-company records can ever be selected.
  const [remoteOptions, setRemoteOptions] = useState({});

  useEffect(() => {
    if (!open) return;
    const remote = fields.filter((f) => f.optionsFrom);
    if (!remote.length) return;

    let cancelled = false;
    Promise.all(
      remote.map((f) =>
        resourceApi(f.optionsFrom.resource)
          .list({ limit: 100, sort: f.optionsFrom.sort || 'name' })
          .then((r) => [f.name, r.data.map((row) => ({
            value: row._id,
            label: row[f.optionsFrom.labelKey || 'name'] || row.fullName || row._id,
          }))])
          .catch(() => [f.name, []])
      )
    ).then((entries) => {
      if (!cancelled) setRemoteOptions(Object.fromEntries(entries));
    });

    return () => { cancelled = true; };
  }, [open, fields]);

  useEffect(() => {
    if (open) {
      const defaults = {};
      fields.forEach((f) => {
        let v = initial?.[f.name];
        if (v && typeof v === 'object' && v._id) v = v._id;         // populated ref -> id
        if (f.type === 'date' && v) v = new Date(v).toISOString().slice(0, 10);
        defaults[f.name] = v ?? '';
      });
      reset(defaults);
    }
  }, [open, initial]);

  const submit = (data) => {
    const clean = {};
    Object.entries(data).forEach(([k, v]) => { if (v !== '' && v !== null) clean[k] = v; });
    onSubmit(clean);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" form="resource-form" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="resource-form" onSubmit={handleSubmit(submit)} className="grid grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.name} className={f.colSpan === 2 || f.type === 'textarea' ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
            <label className="label">{f.label}{f.required && ' *'}</label>
            {f.type === 'textarea' ? (
              <textarea rows={3} className="input" {...register(f.name, { required: f.required })} />
            ) : f.type === 'select' ? (
              <select className="input" {...register(f.name, { required: f.required })}>
                <option value="">Select…</option>
                {(f.optionsFrom ? (remoteOptions[f.name] || []) : (f.options || [])).map((o) => (
                  <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || 'text'}
                className="input"
                {...register(f.name, { required: f.required, valueAsNumber: f.type === 'number' })}
              />
            )}
            {errors[f.name] && <p className="text-xs text-danger mt-1">This field is required</p>}
          </div>
        ))}
      </form>
    </Modal>
  );
}
